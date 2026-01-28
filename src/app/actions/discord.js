"use server";
import { createTournamentChannel, deleteTournamentChannels, addMemberToTournamentChannels, assignTournamentRole, sendTournamentMessage, announceNewTournament, announceNewScoutingReport } from "@/lib/discord-bot";

/**
 * Server Action to create Discord Channels for a tournament.
 * Guaranteed to run on the server.
 * 
 * @param {string} tournamentName 
 * @param {object} details
 * @returns {Promise<{channelId: string, voiceChannelId: string, roleId: string, inviteUrl: string, error: string}>}
 */
export async function createTournamentChannelAction(tournamentName, details) {
  return await createTournamentChannel(tournamentName, details);
}

export async function deleteTournamentChannelsAction(channelIds, roleId = null) {
    return await deleteTournamentChannels(channelIds, roleId);
}

export async function addMemberToTournamentChannelsAction(channelIds, discordUserId) {
    return await addMemberToTournamentChannels(channelIds, discordUserId);
}

export async function assignTournamentRoleAction(roleId, discordUserId) {

    return await assignTournamentRole(roleId, discordUserId);
}

export async function sendTournamentMessageAction(channelId, message, roleId = null) {
    return await sendTournamentMessage(channelId, message, roleId);
}

export async function announceNewTournamentAction(tournament) {
    return await announceNewTournament(tournament);
}

export async function announceNewScoutingReportAction(data, rankData) {
    return await announceNewScoutingReport(data, rankData);
}

/**
 * Sends a notification to the specific tournament channel AND the public results channel.
 */
/**
 * Sends a notification to the specific tournament channel AND the public results channel.
 * Can optionally take a DIFFERENT message for the public channel.
 */
export async function broadcastMatchResultAction(channelId, message, roleId = null, publicMessage = null) {
    // 1. Send to the specific tournament channel (with role ping)
    if (channelId) {
        await sendTournamentMessage(channelId, message, roleId);
    }

    // 2. Send to the public results channel (from env, no role ping)
    const publicResultsChannelId = process.env.DISCORD_RESULTS_CHANNEL_ID;
    if (publicResultsChannelId) {
        const msgToSend = publicMessage || message;
        // We catch errors here so one failure doesn't stop the other
        try {
            await sendTournamentMessage(publicResultsChannelId, msgToSend, null);
        } catch (error) {
            console.warn("Failed to broadcast to public results channel:", error);
        }
    }
    
    return true;
}

/**
 * Sends a registration approval notification to the Public Registrations Channel.
 */
export async function announceRegistrationApprovedAction(tournamentName, registrantName, transactionId) {
    const channelId = process.env.DISCORD_REGISTRATIONS_CHANNEL_ID;
    if (!channelId) {
        // Silently fail if not configured, or warn
        // console.warn("DISCORD_REGISTRATIONS_CHANNEL_ID is not set.");
        return;
    }

    const message = `✨ **REGISTRATION CONFIRMED!**\n\n**${registrantName}** has secured their slot in **${tournamentName}**! 🎟️\n\n*Good luck!* 🍀`;
    
    try {
        await sendTournamentMessage(channelId, message, null);
    } catch (error) {
        console.warn("Failed to announce registration approval:", error);
    }
}
