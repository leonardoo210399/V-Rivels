/**
 * Discord Webhook Integration
 * Sends tournament announcements to Discord channels
 */

const DISCORD_WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;
const PLAYER_FINDER_WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_PLAYER_FINDER_WEBHOOK_URL;

// VRivals Arena Discord Server ID
export const VRIVALS_SERVER_ID = "1463457657737449506";
export const DISCORD_INVITE_URL = "https://discord.gg/gexZcZzCHV";

// Discord Agent Emoji Mapping (Custom emojis from VRivals Discord server)
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

// Valorant API Agent Image URLs (Full portraits for Discord embeds)
const AGENT_IMAGES = {
  "Astra": "https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/displayicon.png",
  "Breach": "https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png",
  "Brimstone": "https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/displayicon.png",
  "Chamber": "https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png",
  "Clove": "https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png",
  "Cypher": "https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png",
  "Deadlock": "https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/displayicon.png",
  "Fade": "https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png",
  "Gekko": "https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png",
  "Harbor": "https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/displayicon.png",
  "Iso": "https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/displayicon.png",
  "Jett": "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png",
  "KAY/O": "https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/displayicon.png",
  "Killjoy": "https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png",
  "Neon": "https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png",
  "Omen": "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png",
  "Phoenix": "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png",
  "Raze": "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png",
  "Reyna": "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png",
  "Sage": "https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png",
  "Skye": "https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png",
  "Sova": "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png",
  "Viper": "https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494f68/displayicon.png",
  "Yoru": "https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/displayicon.png",
};

/**
 * Get Discord emoji for an agent name
 * @param {string} agentName - The agent's display name
 * @returns {string} - Discord emoji string or the agent name if not found
 */
function getAgentEmoji(agentName) {
  return AGENT_EMOJIS[agentName] || agentName;
}

/**
 * Get Valorant API image URL for an agent
 * @param {string} agentName - The agent's display name
 * @returns {string|null} - Image URL or null if not found
 */
function getAgentImage(agentName) {
  return AGENT_IMAGES[agentName] || null;
}

/**
 * Check if a user is a member of the VRivals Arena Discord server
 * @param {string} accessToken - The Discord OAuth access token
 * @returns {Promise<{isMember: boolean, guildInfo: object|null}>}
 */
export async function checkDiscordMembership(accessToken) {
  if (!accessToken) {
    // console.log("[Discord] No access token provided");
    return { isMember: false, guildInfo: null };
  }

  const CACHE_KEY = `discord_guilds_cache_${accessToken.substring(0, 10)}`;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Check cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        // console.log("[Discord] Using cached guild data");
        const vrivalsGuild = data.find((guild) => guild.id === VRIVALS_SERVER_ID);
        return {
          isMember: !!vrivalsGuild,
          guildInfo: vrivalsGuild || null,
        };
      }
    }
  } catch (e) {
    console.warn("Failed to read discord cache", e);
  }

  try {
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 429) {
      console.warn("[Discord] Rate limit hit (429).");
      // If we have stale cache, try to use it as fallback
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          console.log("[Discord] Falling back to stale cache due to 429");
          const { data } = JSON.parse(cached);
          const vrivalsGuild = data.find((guild) => guild.id === VRIVALS_SERVER_ID);
          return {
            isMember: !!vrivalsGuild,
            guildInfo: vrivalsGuild || null,
          };
        }
      } catch (e) { /* ignore */ }
      
      return { isMember: false, guildInfo: null, rateLimited: true };
    }

    if (!response.ok) {
      console.warn("[Discord] Failed to fetch guilds:", response.status);
      return { isMember: false, guildInfo: null };
    }

    const guilds = await response.json();
    
    // Save to cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: guilds
      }));
    } catch (e) {
      console.warn("Failed to save discord cache", e);
    }

    const vrivalsGuild = guilds.find((guild) => guild.id === VRIVALS_SERVER_ID);

    return {
      isMember: !!vrivalsGuild,
      guildInfo: vrivalsGuild || null,
    };
  } catch (error) {
    console.error("[Discord] Error checking membership:", error);
    return { isMember: false, guildInfo: null };
  }
}

/**
 * Send a message to Discord via webhook
 * @param {Object} payload - The webhook payload
 */
async function sendWebhookMessage(payload) {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn("Discord webhook URL not configured");
    return null;
  }

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Failed to send Discord webhook:", error);
    return false;
  }
}

/**
 * Format date for Discord embed
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format time for Discord embed
 */
function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Get a short teaser from description (first 150 chars)
 */
function getTeaser(description) {
  if (!description) return "Join now and compete for glory!";
  // Remove markdown formatting
  const clean = description.replace(/\*\*/g, "").replace(/\n+/g, " ").trim();
  if (clean.length <= 150) return clean;
  return clean.substring(0, 147) + "...";
}

/**
 * Send a new tournament announcement to Discord
 * @param {Object} tournament - The tournament data
 */
export async function announceNewTournament(tournament) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vrivalsarena.com";
  const tournamentUrl = `${siteUrl}/tournaments/${tournament.$id}`;

  // Parse entry fee for display
  const entryFeeDisplay = tournament.entryFee 
    ? (tournament.entryFee === "0" || tournament.entryFee === "Free" ? "🆓 FREE" : `₹${tournament.entryFee}`)
    : "🆓 FREE";

  // Parse prize pool
  const prizeDisplay = tournament.prizePool || "TBA";

  // Game mode display
  const gameModeEmoji = tournament.gameType === "Deathmatch" ? "💀" : "⚔️";
  const gameModeText = tournament.gameType === "Deathmatch" ? "Deathmatch FFA" : "5v5 Tournament";

  const embed = {
    title: `🏆 ${tournament.name}`,
    url: tournamentUrl, // Makes the title clickable!
    description: `${getTeaser(tournament.description)}\n\n**━━━━━━━━━━━━━━━━━━━━━━━━━━━━**`,
    color: 0xff4757, // Rose/red color matching your brand
    fields: [
      {
        name: "📅 DATE",
        value: `\`${formatDate(tournament.date)}\``,
        inline: true,
      },
      {
        name: "🕐 TIME",
        value: `\`${formatTime(tournament.date)} IST\``,
        inline: true,
      },
      {
        name: `${gameModeEmoji} MODE`,
        value: `\`${gameModeText}\``,
        inline: true,
      },
      {
        name: "💰 PRIZE POOL",
        value: `\`${prizeDisplay}\``,
        inline: true,
      },
      {
        name: "🎟️ ENTRY FEE",
        value: `\`${entryFeeDisplay}\``,
        inline: true,
      },
      {
        name: "👥 SLOTS",
        value: `\`${tournament.maxTeams || "∞"} ${tournament.gameType === "Deathmatch" ? "players" : "teams"}\``,
        inline: true,
      },
      {
        name: "🏅 PRIZES",
        value: `> 🥇 **1st:** ${tournament.firstPrize || "TBA"}\n> 🥈 **2nd:** ${tournament.secondPrize || "TBA"}`,
        inline: false,
      },
      {
        name: "🔗 QUICK LINKS",
        value: `**[🎯 Register Now](${tournamentUrl})** • **[📋 View Details](${tournamentUrl})** • **[🏆 All Tournaments](${siteUrl}/tournaments)**`,
        inline: false,
      },
    ],
    image: {
      // VRivals custom banner hosted on Discord CDN
      url: "https://cdn.discordapp.com/attachments/1000433438148534415/1463524436308131945/image.png",
    },
    thumbnail: {
      url: `${siteUrl}/vrivals_logo.png`,
    },
    footer: {
      text: "VRivals Arena • Limited slots available! Click title to register →",
      icon_url: `${siteUrl}/vrivals_logo.png`,
    },
    timestamp: new Date().toISOString(),
  };

  const payload = {
    username: "VRivals Arena",
    avatar_url: `${siteUrl}/vrivals_logo.png`,
    content: "# 🔔 NEW TOURNAMENT ALERT!\n\n@everyone A new tournament has just been announced! Register now before slots fill up!\n\n",
    embeds: [embed],
  };

  return await sendWebhookMessage(payload);
}

/**
 * Send a tournament reminder to Discord
 * @param {Object} tournament - The tournament data
 * @param {string} message - Custom reminder message
 */
export async function sendTournamentReminder(tournament, message = "Tournament starting soon!") {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vrivalsarena.com";

  const embed = {
    title: "⏰ TOURNAMENT REMINDER",
    description: `**${tournament.name}**\n\n${message}`,
    color: 0xffa502, // Orange/warning color
    fields: [
      {
        name: "📅 Starting",
        value: formatDate(tournament.date),
        inline: true,
      },
      {
        name: "👥 Registered Teams",
        value: `${tournament.registeredTeams || 0}/${tournament.maxTeams}`,
        inline: true,
      },
    ],
    footer: {
      text: "VRivals Arena",
      icon_url: `${siteUrl}/vrivals_logo.png`,
    },
    timestamp: new Date().toISOString(),
  };

  const payload = {
    username: "VRivals Arena",
    avatar_url: `${siteUrl}/vrivals_logo.png`,
    embeds: [embed],
  };

  return await sendWebhookMessage(payload);
}

/**
 * Announce tournament results to Discord
 * @param {Object} tournament - The tournament data
 * @param {Object} results - The results data { winner, runnerUp, thirdPlace }
 */
export async function announceTournamentResults(tournament, results) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vrivalsarena.com";

  const embed = {
    title: "🏆 TOURNAMENT RESULTS",
    description: `**${tournament.name}** has concluded!\n\nCongratulations to all participants!`,
    color: 0x2ed573, // Green/success color
    fields: [
      {
        name: "🥇 Champion",
        value: results.winner || "TBD",
        inline: true,
      },
      {
        name: "🥈 Runner Up",
        value: results.runnerUp || "TBD",
        inline: true,
      },
      {
        name: "🥉 Third Place",
        value: results.thirdPlace || "TBD",
        inline: true,
      },
    ],
    footer: {
      text: "VRivals Arena • Thanks for participating!",
      icon_url: `${siteUrl}/vrivals_logo.png`,
    },
    timestamp: new Date().toISOString(),
  };

  const payload = {
    username: "VRivals Arena",
    avatar_url: `${siteUrl}/vrivals_logo.png`,
    content: "🎊 **Tournament Complete!** Here are the final results:",
    embeds: [embed],
  };

  return await sendWebhookMessage(payload);
}

/**
 * Send a custom announcement to Discord
 * @param {string} title - The announcement title
 * @param {string} message - The announcement message
 * @param {string} color - Hex color (optional)
 */
export async function sendCustomAnnouncement(title, message, color = 0xff4757) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vrivalsarena.com";

  const embed = {
    title: `📢 ${title}`,
    description: message,
    color: color,
    footer: {
      text: "VRivals Arena",
      icon_url: `${siteUrl}/vrivals_logo.png`,
    },
    timestamp: new Date().toISOString(),
  };

  const payload = {
    username: "VRivals Arena",
    avatar_url: `${siteUrl}/vrivals_logo.png`,
    embeds: [embed],
  };

  return await sendWebhookMessage(payload);
}

/**
 * Send a webhook message to a specific URL
 * @param {Object} payload - The webhook payload
 * @param {string} webhookUrl - The webhook URL to use
 */
async function sendWebhookToUrl(payload, webhookUrl) {
  if (!webhookUrl) {
    console.warn("Webhook URL not provided");
    return null;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Failed to send Discord webhook:", error);
    return false;
  }
}

/**
 * Announce a new scouting report (player ad) to Discord
 * @param {Object} data - The scouting report data
 * @param {string} data.ingameName - Player's in-game name
 * @param {string} data.tag - Player's tag
 * @param {string} data.role - Player's preferred role
 * @param {Array|string} data.mainAgent - Main agent(s)
 * @param {Array} data.secondaryAgents - Secondary agents
 * @param {string} data.description - Player's description
 * @param {string} data.region - Player's region
 * @param {Object} rankData - Optional rank data { tier, tierPatched }
 */
export async function announceNewScoutingReport(data, rankData = null) {
  const webhookUrl = PLAYER_FINDER_WEBHOOK_URL || DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn("No webhook URL configured for player finder announcements");
    return null;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vrivalsarena.com";
  const playerFinderUrl = `${siteUrl}/player-finder`;
  const playerProfileUrl = `${siteUrl}/player/${data.userId}`;

  // Format main agents with emojis
  const mainAgentsArray = Array.isArray(data.mainAgent) ? data.mainAgent : (data.mainAgent ? [data.mainAgent] : []);
  const mainAgentsEmojis = mainAgentsArray.map(agent => getAgentEmoji(agent)).join(" ");

  // Format secondary agents with emojis
  const secondaryAgentsArray = data.secondaryAgents || [];
  const secondaryAgentsEmojis = secondaryAgentsArray.slice(0, 5).map(agent => getAgentEmoji(agent)).join(" ") + 
      (secondaryAgentsArray.length > 5 ? ` +${secondaryAgentsArray.length - 5}` : "");

  // Role emoji mapping
  const roleEmojis = {
    Duelist: "⚔️",
    Controller: "🌫️",
    Sentinel: "🛡️",
    Initiator: "⚡",
    Flex: "🔄",
  };
  const roleEmoji = roleEmojis[data.role] || "🎮";

  // Region display
  const regionNames = {
    ap: "Asia Pacific",
    eu: "Europe",
    na: "North America",
    kr: "Korea",
    latam: "LATAM",
    br: "Brazil",
  };
  const regionDisplay = regionNames[data.region?.toLowerCase()] || data.region || "Unknown";

  // Rank display
  const rankDisplay = rankData?.tierPatched || "Unranked";

  // Truncate description
  const descriptionTeaser = data.description?.length > 200 
    ? data.description.substring(0, 197) + "..." 
    : data.description || "No description provided.";

  // formatting the message content (Markdown)
  // Name in H1 for maximum visibility and Blue Color (via Link)
  const introContent = `# 🔔 NEW PLAYER LISTING!

# [${data.ingameName}#${data.tag}](${playerProfileUrl})
**is looking for a team!**`;
  
  const embedDescription = `**⭐ MAIN AGENTS:**
# ${mainAgentsEmojis || "Not specified"}

**🎮 SECONDARY:**
${secondaryAgentsEmojis || "None"}

━━━━━━━━━━━━━━━━━━━━━━━

${roleEmoji} **Role:** \`${data.role || "Flex"}\`  •  🏆 **Rank:** \`${rankDisplay}\`  •  🌍 **Region:** \`${regionDisplay}\`

> *"${descriptionTeaser}"*

🔗 **[Check out this player on Player Finder →](${playerFinderUrl})**`;

  const embed = {
    color: 0xff4757, // Rose color
    description: embedDescription,
    thumbnail: {
      url: rankData?.rankImage || `${siteUrl}/vrivals_logo.png`, // Rank image or Logo fallback
    },
    footer: {
      text: "VRivals Arena • Player Finder",
      icon_url: `${siteUrl}/vrivals_logo.png`,
    },
    timestamp: new Date().toISOString(),
  };

  const payload = {
    username: "VRivals Player Finder",
    avatar_url: `${siteUrl}/vrivals_logo.png`,
    content: introContent,
    embeds: [embed],
  };

  return await sendWebhookToUrl(payload, webhookUrl);
}
