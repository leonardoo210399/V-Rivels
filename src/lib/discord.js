/**
 * Discord Integration Client Utilities
 * (Server-side logic has been moved to logic/discord-bot.js and actions/discord.js)
 */

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
