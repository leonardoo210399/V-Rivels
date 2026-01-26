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
  console.log(`[DiscordBot] Starting for: ${tournamentName}`);
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
      console.log(`[DiscordBot] Attempting to create role: ${roleName}`);
      role = await guild.roles.create({
        name: roleName,
        color: "#ff4757", // Rose color
        reason: `Tournament role for ${tournamentName}`,
        permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      });
      console.log(`[DiscordBot] Role created successfully: ${role.id}`);
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

    console.log(`[DiscordBot] Creating text channel: ${sanitizedName}`);
    
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
      console.log(`[DiscordBot] Creating private voice channel: ${voiceName}`);
      
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
      console.log(`[DiscordBot] Voice channel created successfully: ${voiceChannelId}`);
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
    console.log(`[DiscordBot] AssignRole Request - User: ${discordUserId}, Role: ${roleId}`);
    
    if (!BOT_TOKEN) return { error: "Bot token missing" };
    if (!roleId || !discordUserId) return { error: "Missing RoleID or UserID" };
    
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
        if (!guild) throw new Error("Server not found");

        // Hierarchy Check
        const botMember = await guild.members.fetch(client.user.id);
        const botHighestRole = botMember.roles.highest;
        
        console.log(`[DiscordBot] Bot Role: ${botHighestRole.name} (Pos: ${botHighestRole.position})`);

        // Fetch User
        let member = null;
        try {
            member = await guild.members.fetch(discordUserId);
        } catch (fetchErr) {
            console.error(`[DiscordBot] Member fetch failed: ${fetchErr.message}. User might not be in server.`);
            throw new Error("User not found in Discord server. Ask them to join first!");
        }

        if (member) {
            // Check if role exists
            const role = await guild.roles.fetch(roleId);
            if (!role) throw new Error("Tournament role no longer exists.");

            // Final Hierarchy Check
            if (botHighestRole.position <= role.position) {
                console.error(`[DiscordBot] HIERARCHY ERROR: Bot role [${botHighestRole.name}] is LOWER or EQUAL to Tournament Role [${role.name}]. Bot cannot assign this role.`);
                throw new Error("Bot lacks hierarchy to assign this role. Move the Bot's own role to the top of settings.");
            }

            await member.roles.add(roleId);
            console.log(`[DiscordBot] SUCCESS: Role ${role.name} assigned to user ${member.user.tag}`);
            
            await client.destroy();
            return { success: true };
        } else {
            throw new Error("Member not found in guild");
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
                    console.log(`[DiscordBot] Role deleted: ${roleId}`);
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

