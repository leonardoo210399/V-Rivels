import { Client, Databases, Query } from 'node-appwrite';
import { Client as DiscordClient, GatewayIntentBits, Events } from 'discord.js';

export default async ({ req, res, log, error }) => {
  log('Function started. Initializing Appwrite client...');
  
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

  const databases = new Databases(client);

  // Map variables from your .env structure
  const DATABASE_ID = process.env.DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const TOURNAMENTS_COLLECTION_ID = process.env.TOURNAMENTS_COLLECTION_ID || process.env.NEXT_PUBLIC_APPWRITE_TOURNAMENTS_COLLECTION_ID;
  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vrivalsarena.com";

  log(`Variables check - DB: ${DATABASE_ID ? 'OK' : 'MISSING'}, Collection: ${TOURNAMENTS_COLLECTION_ID ? 'OK' : 'MISSING'}`);

  if (!DATABASE_ID || !TOURNAMENTS_COLLECTION_ID || !DISCORD_BOT_TOKEN) {
    const msg = 'Missing required environment variables. Check DATABASE_ID, TOURNAMENTS_COLLECTION_ID, and DISCORD_BOT_TOKEN.';
    error(msg);
    return res.json({ success: false, message: msg });
  }

  try {
    // 1. Get all tournaments that need a check-in alert
    const now = new Date().toISOString();
    const tournaments = await databases.listDocuments(
      DATABASE_ID,
      TOURNAMENTS_COLLECTION_ID,
      [
        Query.equal('checkInEnabled', true),
        Query.equal('checkInAlertSent', false),
        Query.lessThanEqual('checkInStart', now),
        Query.notEqual('discordChannelId', null)
      ]
    );

    log(`Found ${tournaments.documents.length} tournaments needing check-in alerts.`);

    if (tournaments.documents.length === 0) {
      return res.json({ success: true, message: 'No alerts to send.' });
    }

    // 2. Initialize Discord Client
    log('Logging in to Discord...');
    const discordClient = new DiscordClient({ intents: [GatewayIntentBits.Guilds] });
    await discordClient.login(DISCORD_BOT_TOKEN);

    // Wait for ready
    if (!discordClient.isReady()) {
      await new Promise((resolve) => discordClient.once(Events.ClientReady, resolve));
    }

    const results = [];

    for (const tournament of tournaments.documents) {
      try {
        const channel = await discordClient.channels.fetch(tournament.discordChannelId);
        if (channel) {
          const ping = tournament.discordRoleId ? `<@&${tournament.discordRoleId}> ` : "";
          
          await channel.send(`${ping}🚨 **CHECK-IN IS NOW LIVE!**\nRegistered players for **${tournament.name}** can now check-in on the website.\n\n🔗 **Check-in Here:** <${SITE_URL}/tournaments/${tournament.$id}>\n\n*Note: Failure to check-in may result in disqualification!*`);
          
          // 3. Mark as sent
          await databases.updateDocument(
            DATABASE_ID,
            TOURNAMENTS_COLLECTION_ID,
            tournament.$id,
            { checkInAlertSent: true }
          );
          
          results.push({ id: tournament.$id, status: 'sent' });
          log(`Successfully sent alert for tournament: ${tournament.name}`);
        } else {
          results.push({ id: tournament.$id, status: 'channel_not_found' });
        }
      } catch (err) {
        error(`Failed to send alert for ${tournament.$id}: ${err.message}`);
        results.push({ id: tournament.$id, status: 'error', error: err.message });
      }
    }

    await discordClient.destroy();
    return res.json({ success: true, results });

  } catch (err) {
    error(`Main process error: ${err.message}`);
    return res.json({ success: false, error: err.message });
  }
};
