/**
 * Discord Webhook Integration
 * Sends tournament announcements to Discord channels
 */

const DISCORD_WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;

// VRivals Arena Discord Server ID
export const VRIVALS_SERVER_ID = "1463457657737449506";
export const DISCORD_INVITE_URL = "https://discord.gg/gexZcZzCHV";

/**
 * Check if a user is a member of the VRivals Arena Discord server
 * @param {string} accessToken - The Discord OAuth access token
 * @returns {Promise<{isMember: boolean, guildInfo: object|null}>}
 */
export async function checkDiscordMembership(accessToken) {
  if (!accessToken) {
    console.log("[Discord] No access token provided");
    return { isMember: false, guildInfo: null };
  }

  try {
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.warn("[Discord] Failed to fetch guilds:", response.status);
      return { isMember: false, guildInfo: null };
    }

    const guilds = await response.json();
    console.log("[Discord] User's guilds:", guilds.map(g => ({ id: g.id, name: g.name })));
    console.log("[Discord] Looking for server ID:", VRIVALS_SERVER_ID);
    
    const vrivalsGuild = guilds.find((guild) => guild.id === VRIVALS_SERVER_ID);
    console.log("[Discord] VRivals guild found:", vrivalsGuild ? vrivalsGuild.name : "NO");

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
