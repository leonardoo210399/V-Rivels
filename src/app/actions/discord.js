"use server";
import { createTournamentChannel, deleteTournamentChannels, addMemberToTournamentChannels, assignTournamentRole } from "@/lib/discord-bot";

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
