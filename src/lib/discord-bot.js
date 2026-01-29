import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, Events } from "discord.js";
import { VRIVALS_SERVER_ID } from "./discord";

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

/**
 * Serverless Discord Bot Action (v14 Compatible)
 * Creates tournament channels (text + voice) and generates an invite link.
 * 
 * @param {string} tournamentName 
 * @param {object} details - Extra info like prizePool, date, rules, etc.
 */
export async function createTournamentChannel(tournamentName, details = {}) {

  if (!BOT_TOKEN) {
    console.error("DISCORD_BOT_TOKEN is missing in .env");
    return { error: "Bot token missing" };
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  try {
    await client.login(BOT_TOKEN);

    // Wait for client to be ready
    if (!client.isReady()) {
      await new Promise((resolve) => client.once(Events.ClientReady, resolve));
    }

    const guild = await client.guilds.fetch(VRIVALS_SERVER_ID);
    if (!guild) {
      throw new Error("VRivals Guild not found.");
    }

    // 1. Find or Create "Tournaments" Category
    let category = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && (c.name.includes("Active Tournaments"))
    );

    if (!category) {
      category = await guild.channels.create({
        name: "🏆 Active Tournaments",
        type: ChannelType.GuildCategory,
      });
    }

    // 2. Create the Role
    let role = null;
    try {
      const roleName = `Tournament: ${tournamentName.substring(0, 30)}`;

      role = await guild.roles.create({
        name: roleName,
        color: "#ff4757", // Rose color
        reason: `Tournament role for ${tournamentName}`,
        permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      });

    } catch (roleErr) {
      console.error("[DiscordBot] Role Creation FAILED:", roleErr.message);
      // We continue because we want the channels to be created anyway, 
      // but this explains why the role is missing.
    }

    // 3. Create the Channel
    const sanitizedName = tournamentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 30);


    
    // Prepare permission overwrites
    const textOverwrites = [
      {
        id: guild.id, // @everyone
        deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
      },
      {
        id: client.user.id, // Bot itself
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      }
    ];

    if (role) {
      textOverwrites.push({
        id: role.id, // Tournament Role
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      });
    }

    const channel = await guild.channels.create({
      name: sanitizedName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: textOverwrites,
    });

    // 3b. Create the Voice Channel (Private + Linked)
    let voiceChannelId = null;
    try {
      const voiceName = `🔊 Lobby: ${tournamentName}`;

      
      const voiceOverwrites = [
        {
          id: guild.id, // @everyone
          deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect], // Make it private
        },
        {
          id: client.user.id, // Bot
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
        }
      ];

      if (role) {
        voiceOverwrites.push({
          id: role.id, // Tournament Role
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
        });
      }

      const voiceChannel = await guild.channels.create({
        name: voiceName,
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: voiceOverwrites,
      });
      voiceChannelId = voiceChannel.id;

    } catch (voiceError) {
      console.error("[DiscordBot] Voice Channel Creation Failed:", voiceError.message);
    }

    // 4. Create Invite
    const invite = await channel.createInvite({
      maxAge: 0,
      maxUses: 0,
      unique: true,
      reason: `Tournament Lobby for ${tournamentName}`,
    });

    // 5. Send Concise Welcome Message
    const voiceLink = voiceChannelId ? `<#${voiceChannelId}>` : "Not available";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vrivalsarena.com";
    const tournamentUrl = details.id ? `${siteUrl}/tournaments/${details.id}` : siteUrl;

    // Extract important rules from description if they exist
    let rulesText = "";
    if (details.description) {
      const rulesMatch = details.description.match(/(?:RULES|GUIDELINES).*?:([\s\S]*?)(?:\n\n|[A-Z\s]{5,}:|$)/i);
      if (rulesMatch && rulesMatch[1]) {
        rulesText = rulesMatch[1]
          .split('\n')
          .filter(line => {
            const l = line.toLowerCase();
            return !l.includes('join our official discord') && 
                   !l.includes('joining our official discord') &&
                   !l.includes('join discord');
          })
          .join('\n')
          .trim()
          .substring(0, 500);
      }
    }

    const separator = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
    const messageContent = [
      `# 🏆 ${tournamentName.toUpperCase()}`,
      `### *New Tournament Lobby Created!*`,
      separator,
      `📅 **SCHEDULE:** \`${details.date ? new Date(details.date).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' }) : 'Check Website'}\``,
      `💰 **PRIZE POOL:** \`₹${details.prizePool || 'TBD'}\``,
      `🥇 **1st:** \`₹${details.firstPrize || 'TBD'}\`  |  🥈 **2nd:** \`₹${details.secondPrize || 'TBD'}\``,
      separator,
      `🔊 **VOICE LOBBY:** ${voiceLink}`,
      `*(Join here for pre-match briefing)*`,
      "",
      `🔗 **TOURNAMENT PAGE:** <${tournamentUrl}>`,
      `*(Check brackets & standings here)*`,
      separator,
      rulesText ? `📜 **ESSENTIAL RULES:**\n${rulesText}\n` : "",
      `🚩 **LOBBY PROCEDURE:**`,
      `1️⃣  Check-in on the website 15m before start.`,
      `2️⃣  Wait in this channel for the **Party Code**.`,
      `3️⃣  GLHF!`
    ].filter(line => line !== null).join("\n");

    // Final safety check: Discord limit is 2000 characters
    const safeContent = messageContent.substring(0, 1990);

    const welcomeMsg = await channel.send({
      content: safeContent
    });

    try {
      await welcomeMsg.pin();
    } catch (pinError) {
      console.warn("[DiscordBot] Failed to pin welcome message:", pinError.message);
    }

    // Cleanup
    await client.destroy();

    return {
      channelId: channel.id,
      voiceChannelId: voiceChannelId,
      roleId: role?.id || null,
      inviteUrl: invite.url,
      partyCode: null, 
    };

  } catch (error) {
    console.error("[DiscordBot] Critical Error:", error);
    if (client) await client.destroy();
    return { error: error.message };
  }
}

/**
 * Serverless Discord Bot Action
 * Assigns a specific role to a user.
 * 
 * @param {string} roleId 
 * @param {string} discordUserId 
 */
export async function assignTournamentRole(roleId, discordUserId) {
    // Sanitize input: Remove any <@! >, spaces, or non-numeric characters if it's a mention
    const sanitizedUserId = String(discordUserId).replace(/[^0-9]/g, "");
    const sanitizedRoleId = String(roleId).replace(/[^0-9]/g, "");



    
    if (!BOT_TOKEN) return { error: "Bot token missing" };
    if (!sanitizedRoleId || !sanitizedUserId) return { error: "Invalid RoleID or UserID format" };
    
    const client = new Client({ 
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] 
    });

    try {
        await client.login(BOT_TOKEN);
        
        // Wait for ready
        if (!client.isReady()) {
            await new Promise((resolve) => client.once(Events.ClientReady, resolve));
        }

        const guild = await client.guilds.fetch(VRIVALS_SERVER_ID);
        if (!guild) {
          console.error(`[DiscordBot] Guild not found for ID: ${VRIVALS_SERVER_ID}`);
          throw new Error(`Discord Server (Guild) not found. Check VRIVALS_SERVER_ID in discord.js`);
        }
        


        // Hierarchy Check
        const botMember = await guild.members.fetch(client.user.id);
        const botHighestRole = botMember.roles.highest;
        


        // Fetch User
        let member = null;
        try {

            member = await guild.members.fetch(sanitizedUserId);

        } catch (fetchErr) {
            console.error(`[DiscordBot] Member fetch failed for ${sanitizedUserId}: ${fetchErr.message}`);
            throw new Error(`Member not found in "${guild.name}". Ensure the user has joined the server.`);
        }

        if (member) {
            // Check if role exists
            const role = await guild.roles.fetch(sanitizedRoleId);
            if (!role) {
              console.error(`[DiscordBot] Role not found in guild: ${sanitizedRoleId}`);
              throw new Error("Tournament role no longer exists in your server.");
            }



            // Final Hierarchy Check
            if (botHighestRole.position <= role.position) {
                console.error(`[DiscordBot] HIERARCHY ERROR: Bot [${botHighestRole.name} @ ${botHighestRole.position}] cannot manage Role [${role.name} @ ${role.position}].`);
                throw new Error(`Bot role is too low in Discord settings. Drag the Bot's role to the top.`);
            }

            try {
                await member.roles.add(sanitizedRoleId);

            } catch (addError) {
                console.error(`[DiscordBot] FAILED to add role: ${addError.message}`);
                throw new Error(`Discord Error: ${addError.message}`);
            }
            
            await client.destroy();
            return { success: true };
        }
    } catch (e) {
        console.error("[DiscordBot] AssignRole ERROR:", e.message);
        if (client) await client.destroy();
        return { error: e.message };
    }
}

/**
 * Serverless Discord Bot Action
 * Adds a specific user to tournament channels (Legacy/Backup).
 * 
 * @param {string|string[]} channelIds 
 * @param {string} discordUserId 
 */
export async function addMemberToTournamentChannels(channelIds, discordUserId) {
    if (!BOT_TOKEN) return { error: "Bot token missing" };
    
    const ids = Array.isArray(channelIds) ? channelIds : [channelIds];
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    try {
        await client.login(BOT_TOKEN);
        
        // Wait for ready
        if (!client.isReady()) {
            await new Promise((resolve) => client.once(Events.ClientReady, resolve));
        }

        for (const id of ids) {
            try {
                if (!id) continue;
                const channel = await client.channels.fetch(id);
                if (channel) {
                    await channel.permissionOverwrites.create(discordUserId, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true,
                        Connect: true,
                        Speak: true
                    });
                }
            } catch (err) {
                console.warn(`Failed to add user to channel ${id}:`, err.message);
            }
        }

        await client.destroy();
        return { success: true };
    } catch (e) {
        console.error("Failed to add member:", e);
        await client.destroy();
        return { error: e.message };
    }
}

/**
 * Serverless Discord Bot Action
 * Deletes tournament channels and roles.
 * 
 * @param {string|string[]} channelIds - Discord Channel IDs to delete
 * @param {string} roleId - Discord Role ID to delete (optional)
 * @returns {Promise<{success: boolean, error: string}>}
 */
export async function deleteTournamentChannels(channelIds, roleId = null) {
    if (!BOT_TOKEN) return { error: "Bot token missing" };
    
    const ids = Array.isArray(channelIds) ? channelIds.filter(id => !!id) : [channelIds].filter(id => !!id);

    const client = new Client({
        intents: [GatewayIntentBits.Guilds],
    });

    try {
        await client.login(BOT_TOKEN);
        
        // Wait for client to be ready
        if (!client.isReady()) {
            await new Promise((resolve) => client.once(Events.ClientReady, resolve));
        }

        const guild = await client.guilds.fetch(VRIVALS_SERVER_ID);

        // 1. Delete Channels
        for (const id of ids) {
            try {
                const channel = await client.channels.fetch(id);
                if (channel) {
                    await channel.delete();
                }
            } catch (error) {
                console.warn(`Discord Delete Error for channel ${id}:`, error.message);
            }
        }

        // 2. Delete Role
        if (roleId && guild) {
            try {
                const role = await guild.roles.fetch(roleId);
                if (role) {
                    await role.delete(`Tournament closed.`);

                }
            } catch (roleError) {
                console.warn(`Discord Role Delete Error for ${roleId}:`, roleError.message);
            }
        }

        await client.destroy();
        return { success: true };

    } catch (error) {
        console.error("Discord Delete Action Error:", error);
        await client.destroy();
        return { error: error.message };
    }
}

/**
 * Serverless Discord Bot Action
 * Sends a message to a specific channel, optionally pinging a role.
 * 
 * @param {string} channelId 
 * @param {string} message 
 * @param {string} roleId - Optional role ID to ping
 */
export async function sendTournamentMessage(channelId, message, roleId = null) {
  if (!BOT_TOKEN) return { error: "Bot token missing" };
  if (!channelId) return { error: "Channel ID missing" };

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  try {
    await client.login(BOT_TOKEN);
    
    // Wait for ready
    if (!client.isReady()) {
      await new Promise((resolve) => client.once(Events.ClientReady, resolve));
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel) throw new Error("Channel not found");

    const ping = roleId ? `<@&${roleId}> ` : "";
    const finalMessage = `${ping}${message}`;

    await channel.send(finalMessage);
    
    await client.destroy();
    return { success: true };
  } catch (e) {
    console.error("[DiscordBot] SendMessage ERROR:", e.message);
    if (client) await client.destroy();
    return { error: e.message };
  }
}

// ==========================================
// MIGRATED ANNOUNCEMENT LOGIC (FROM WEBHOOKS)
// ==========================================

// Discord Agent Emoji Mapping
const AGENT_EMOJIS = {
  "Astra": "<:Astra:1464119402621571184>",
  "Breach": "<:Breach:1464119496565330024>",
  "Brimstone": "<:Brimstone:1464119563280187422>",
  "Chamber": "<:Chamber:1464119792716742751>",
  "Clove": "<:Clove:1464119821393199139>",
  "Cypher": "<:Cypher:1464119916033478668>",
  "Deadlock": "<:Deadlock:1464119946186457098>",
  "Fade": "<:Fade:1464119988997586955>",
  "Gekko": "<:Gekko:1464120021230813194>",
  "Harbor": "<:Harbor:1464120059940311100>",
  "Iso": "<:Iso:1464120095965057034>",
  "Jett": "<:Jett:1464120126402986049>",
  "KAY/O": "<:KAYO:1464120172322357301>",
  "Killjoy": "<:Killjoy:1464120252446281904>",
  "Neon": "<:Neon:1464120379693076725>",
  "Omen": "<:Omen:1464120406435696811>",
  "Phoenix": "<:Phoenix:1464120435720323073>",
  "Raze": "<:Raze:1464120460559253640>",
  "Reyna": "<:Reyna:1464120480314298553>",
  "Sage": "<:Sage:1464120500753010748>",
  "Skye": "<:Skye:1464120521724792917>",
  "Sova": "<:Sova:1464120556747231316>",
  "Tejo": "<:Tejo:1464120590834073693>",
  "Veto": "<:Veto:1464120654214463529>",
  "Viper": "<:Viper:1464120716382175434>",
  "Vyse": "<:Vyse:1464120743854997554>",
  "Waylay": "<:Waylay:1464120779766497342>",
  "Yoru": "<:Yoru:1464120826847694962>",
};

function getAgentEmoji(agentName) {
  return AGENT_EMOJIS[agentName] || agentName;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getTeaser(description) {
  if (!description) return "Join now and compete for glory!";
  const clean = description.replace(/\*\*/g, "").replace(/\n+/g, " ").trim();
  if (clean.length <= 150) return clean;
  return clean.substring(0, 147) + "...";
}

/**
 * Announce a new tournament to the configured Discord channel
 */
export async function announceNewTournament(tournament) {
  const channelId = process.env.DISCORD_TOURNAMENT_INFO_CHANNEL_ID;
  if (!BOT_TOKEN || !channelId) return { error: "Missing config" };

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  try {
    await client.login(BOT_TOKEN);
    if (!client.isReady()) await new Promise((r) => client.once(Events.ClientReady, r));

    const channel = await client.channels.fetch(channelId);
    if (!channel) throw new Error("Announcements channel not found");

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vrivalsarena.com";
    const tournamentUrl = `${siteUrl}/tournaments/${tournament.$id}`;
    const entryFeeDisplay = tournament.entryFee 
      ? (tournament.entryFee === "0" || tournament.entryFee === "Free" ? "🆓 FREE" : `₹${tournament.entryFee}`)
      : "🆓 FREE";
    const prizeDisplay = tournament.prizePool || "TBA";
    const gameModeEmoji = tournament.gameType === "Deathmatch" ? "💀" : "⚔️";
    const gameModeText = tournament.gameType === "Deathmatch" ? "Deathmatch" : "5v5 Tournament";

    const embed = {
      title: `🏆 ${tournament.name}`,
      url: tournamentUrl,
      description: `${getTeaser(tournament.description)}\n\n**━━━━━━━━━━━━━━━━━━━━━━━━━━━━**`,
      color: 0xff4757, 
      fields: [
        { name: "📅 DATE", value: `\`${formatDate(tournament.date)}\``, inline: true },
        { name: "🕐 TIME", value: `\`${formatTime(tournament.date)} IST\``, inline: true },
        { name: `${gameModeEmoji} MODE`, value: `\`${gameModeText}\``, inline: true },
        
        { name: "💰 PRIZE POOL", value: `\`${prizeDisplay}\``, inline: true },
        { name: "🎟️ ENTRY FEE", value: `\`${entryFeeDisplay}\``, inline: true },
        { name: "👥 SLOTS", value: `\`${tournament.maxTeams || "∞"} ${tournament.gameType === "Deathmatch" ? "players" : "teams"}\``, inline: true },
        
        { name: "🏅 PRIZES", value: `> 🥇 **1st:** ${tournament.firstPrize || "TBA"}\n> 🥈 **2nd:** ${tournament.secondPrize || "TBA"}\n`, inline: false },
        
        { name: "🔗 QUICK LINKS", value: `>>> **[🎯 Register Now](${tournamentUrl})**\n**[📋 View Details](${tournamentUrl})**\n**[🏆 All Tournaments](${siteUrl}/tournaments)**`, inline: false },
      ],
      image: { url: "https://cdn.discordapp.com/attachments/1000433438148534415/1463524436308131945/image.png" },
      thumbnail: { url: `${siteUrl}/vrivals_logo.png` },
      footer: { text: "VRivals Arena • Limited slots available! Click title to register →", icon_url: `${siteUrl}/vrivals_logo.png` },
      timestamp: new Date().toISOString(),
    };

    await channel.send({
      content: "# 🔔 NEW TOURNAMENT ALERT!\n\n@everyone A new tournament has just been announced! Register now before slots fill up!\n\n",
      embeds: [embed],
    });

    await client.destroy();
    return { success: true };
  } catch (e) {
    console.error("[DiscordBot] AnnounceTournament ERROR:", e);
    if (client) await client.destroy();
    return { error: e.message };
  }
}

/**
 * Announce a new scouting report (player ad)
 */
export async function announceNewScoutingReport(data, rankData = null) {
  const channelId = process.env.DISCORD_PLAYER_FINDER_CHANNEL_ID;
  if (!BOT_TOKEN || !channelId) return { error: "Missing config" };

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  try {
    await client.login(BOT_TOKEN);
    if (!client.isReady()) await new Promise((r) => client.once(Events.ClientReady, r));

    const channel = await client.channels.fetch(channelId);
    if (!channel) throw new Error("Player Finder channel not found");

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vrivalsarena.com";
    const playerFinderUrl = `${siteUrl}/player-finder`;
    const playerProfileUrl = `${siteUrl}/player/${data.userId}`;

    const mainAgentsArray = Array.isArray(data.mainAgent) ? data.mainAgent : (data.mainAgent ? [data.mainAgent] : []);
    const mainAgentsEmojis = mainAgentsArray.map(agent => getAgentEmoji(agent)).join(" ");

    const secondaryAgentsArray = data.secondaryAgents || [];
    const secondaryAgentsEmojis = secondaryAgentsArray.slice(0, 5).map(agent => getAgentEmoji(agent)).join(" ") + 
        (secondaryAgentsArray.length > 5 ? ` +${secondaryAgentsArray.length - 5}` : "");

    const roleEmojis = { Duelist: "⚔️", Controller: "🌫️", Sentinel: "🛡️", Initiator: "⚡", Flex: "🔄" };
    const roleEmoji = roleEmojis[data.role] || "🎮";
    const regionNames = { ap: "Asia Pacific", eu: "Europe", na: "North America", kr: "Korea", latam: "LATAM", br: "Brazil" };
    const regionDisplay = regionNames[data.region?.toLowerCase()] || data.region || "Unknown";
    const rankDisplay = rankData?.tierPatched || "Unranked";

    const descriptionTeaser = data.description?.length > 200 
      ? data.description.substring(0, 197) + "..." 
      : data.description || "No description provided.";

    const embed = {
      color: 0xff4757,
      description: `**⭐ MAIN AGENTS:**\n# ${mainAgentsEmojis || "Not specified"}\n\n**🎮 SECONDARY:**\n${secondaryAgentsEmojis || "None"}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n\n${roleEmoji} **Role:** \`${data.role || "Flex"}\`  •  🏆 **Rank:** \`${rankDisplay}\`  •  🌍 **Region:** \`${regionDisplay}\`\n\n> *"${descriptionTeaser}"*\n\n🔗 **[Check out this player on Player Finder →](${playerFinderUrl})**`,
      thumbnail: { url: rankData?.rankImage || `${siteUrl}/vrivals_logo.png` },
      footer: { text: "VRivals Arena • Player Finder", icon_url: `${siteUrl}/vrivals_logo.png` },
      timestamp: new Date().toISOString(),
    };

    const introContent = `# 🔔 NEW PLAYER LISTING!\n\n# [${data.ingameName}#${data.tag}](${playerProfileUrl})\n**is looking for a team!**`;

    await channel.send({
      content: introContent,
      embeds: [embed],
    });

    await client.destroy();
    return { success: true };
  } catch (e) {
    console.error("[DiscordBot] AnnounceScoutingReport ERROR:", e);
    if (client) await client.destroy();
    return { error: e.message };
  }
}
