import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
// NOTE: User must create this collection and add ID to .env or here
const MATCHES_COLLECTION_ID = "matches"; 

export async function getMatches(tournamentId) {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            MATCHES_COLLECTION_ID,
            [Query.equal("tournamentId", tournamentId), Query.limit(100)]
        );
        return response.documents;
    } catch (error) {
        console.warn("Matches collection might not exist yet or empty.", error);
        return [];
    }
}

export async function createBracket(tournamentId, registrations, gameType = "5v5") {
    if (!registrations || registrations.length < 2) {
        throw new Error("Need at least 2 participants to start.");
    }

    if (gameType === "Deathmatch") {
        // For Deathmatch, we create a single "Lobby" match document
        // that represents the entire FFA match. 
        return await databases.createDocument(
            DATABASE_ID,
            MATCHES_COLLECTION_ID,
            ID.unique(),
            {
                tournamentId,
                round: 1,
                matchIndex: 0,
                teamA: "LOBBY", // Marker for DM
                status: "scheduled",
                // For DM, we can store the participant list in metadata if needed,
                // but for now the UI uses registrations list filtered by tournamentId.
            }
        );
    }

    // 1. Generate the match structure in memory (Single Elimination)
    const matches = generateSingleEliminationBracket(registrations);
    
    // 2. Save each match to the database
    const promises = matches.map(match => {
        return databases.createDocument(
            DATABASE_ID,
            MATCHES_COLLECTION_ID,
            ID.unique(),
            {
                tournamentId,
                round: match.round,
                matchIndex: match.matchIndex,
                teamA: match.teamA ? match.teamA.$id : null,
                teamB: match.teamB ? match.teamB.$id : null,
                winner: match.winner ? match.winner.$id : null,
                scoreA: 0,
                scoreB: 0,
                status: match.status,
            }
        );
    });

    await Promise.all(promises);
    return matches;
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 */
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

/**
 * Generates a single-elimination bracket structure.
 * @param {Array} participants - Array of registration objects/IDs.
 * @returns {Array} Array of match objects for the entire tournament.
 */
export function generateSingleEliminationBracket(participants) {
    if (!participants || participants.length < 2) return [];

    const shuffled = shuffle([...participants]);
    const totalTeams = shuffled.length;
    
    // Find the next power of 2
    let size = 2;
    while (size < totalTeams) {
        size *= 2;
    }

    // Number of byes needed
    const byes = size - totalTeams;
    
    // Round 1 matches
    const matches = [];
    const round1MatchesCount = size / 2;
    
    // We will structure matches by Round.
    // Round 1 is the first round played. 
    // If byes exist, they technically "win" round 1 automatically, but standard brackets usually visualize byes in Round 1.
    
    // Let's create the leaf nodes (Round 1)
    let currentRound = [];
    
    // In a standard seeded bracket:
    // Match 1: Seed 1 vs Seed 8
    // Match 2: Seed 4 vs Seed 5
    // etc.
    // Since we are random, we just pair them up.
    // We place "Byes" effectively. A bye is typically matched against the highest seeds.
    // Here we just treat the end of the array as 'bye' slots if we filled with nulls.
    
    // Pad the array with nulls for byes
    const paddedParticipants = [...shuffled];
    for (let i = 0; i < byes; i++) {
        paddedParticipants.push(null); // 'null' represents a Bye
    }

    // Create Round 1
    // Pairing: 0 vs 1, 2 vs 3, etc. isn't ideal for byes. 
    // Standard bye placement usually pairs index i with index (size - 1 - i).
    // Let's use the standard "fold" method for pairing if we treated them as seeds.
    // But since it's random shuffle, linear pairing is fine: (0 vs 1), (2 vs 3)...
    // IF we put all nulls at the end, then the last N matches will be (Player vs Bye).
    // However, (Player vs Bye) means Player advances.
    // If we have (Bye vs Bye), that shouldn't happen if byes < totalTeams.
    
    // Better shuffle: Distribute byes.
    // Actually, pairing (Top vs Bottom) is safer to distribute byes if they are at the end.
    // 0 vs 15, 1 vs 14... 
    // If we put byes at the end of the list, 0 plays a Bye, 1 plays a Bye... 
    // This gives top seeds (first in shuffled) the byes.
    
    for (let i = 0; i < round1MatchesCount; i++) {
        const teamA = paddedParticipants[i];
        const teamB = paddedParticipants[size - 1 - i];
        
        // If teamB is null, teamA gets a bye (automatically wins).
        // If teamA is null (shouldn't happen with this sort), it's a bye.
        
        currentRound.push({
            round: 1,
            matchIndex: i,
            teamA: teamA,
            teamB: teamB,
            winner: teamB === null ? teamA : (teamA === null ? teamB : null), // Auto-advance if bye
            status: (teamB === null || teamA === null) ? 'completed' : 'scheduled'
        });
    }

    matches.push(...currentRound);

    // Generate subsequent rounds
    let activeMatchCount = round1MatchesCount;
    let roundNum = 2;
    
    while (activeMatchCount > 1) {
        activeMatchCount /= 2;
        const nextRound = [];
        for (let i = 0; i < activeMatchCount; i++) {
            nextRound.push({
                round: roundNum,
                matchIndex: i,
                teamA: null, // To be determined by previous round
                teamB: null,
                winner: null,
                status: 'scheduled'
            });
        }
        matches.push(...nextRound);
        roundNum++;
    }

    return matches;
}

export async function getMatch(matchId) {
    return await databases.getDocument(
        DATABASE_ID,
        MATCHES_COLLECTION_ID,
        matchId
    );
}

export async function updateMatchScore(matchId, scoreA, scoreB, winnerId) {
    return await databases.updateDocument(
        DATABASE_ID,
        MATCHES_COLLECTION_ID,
        matchId,
        {
            scoreA,
            scoreB,
            winner: winnerId,
            status: "completed"
        }
    );
}

export async function updateMatchStatus(matchId, status) {
    return await databases.updateDocument(
        DATABASE_ID,
        MATCHES_COLLECTION_ID,
        matchId,
        {
            status
        }
    );
}

export async function updateMatchVeto(matchId, vetoData) {
    return await databases.updateDocument(
        DATABASE_ID,
        MATCHES_COLLECTION_ID,
        matchId,
        {
            vetoData: JSON.stringify(vetoData)
        }
    );
}

export async function updateParticipantScore(registrationId, kills, deaths) {
    const REGISTRATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID;
    
    // Fetch current registration to get existing metadata
    const reg = await databases.getDocument(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, registrationId);
    
    let metadata = {};
    try {
        metadata = reg.metadata ? (typeof reg.metadata === 'string' ? JSON.parse(reg.metadata) : reg.metadata) : {};
    } catch (e) {
        console.warn("Failed to parse metadata for registration:", registrationId, e);
        metadata = {};
    }
    
    metadata.kills = kills;
    metadata.deaths = deaths;

    return await databases.updateDocument(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        registrationId,
        {
            metadata: JSON.stringify(metadata)
        }
    );
}

const TOURNAMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TOURNAMENTS_COLLECTION_ID;

export async function finalizeMatch(matchId, scoreA, scoreB) {
    const REGISTRATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID;
    const USERS_COLLECTION_ID = "users";

    // 1. Get current match and tournament
    const match = await databases.getDocument(DATABASE_ID, MATCHES_COLLECTION_ID, matchId);
    const tournament = await databases.getDocument(DATABASE_ID, TOURNAMENTS_COLLECTION_ID, match.tournamentId);
    
    // 2. Determine winner (registration ID)
    const winnerRegId = scoreA > scoreB ? match.teamA : (scoreB > scoreA ? match.teamB : null);
    
    if (!winnerRegId) throw new Error("Match cannot be completed without a winner (score tie).");

    // 3. Update current match
    await databases.updateDocument(DATABASE_ID, MATCHES_COLLECTION_ID, matchId, {
        scoreA,
        scoreB,
        winner: winnerRegId,
        status: 'completed'
    });

    // 4. Update Winner's Global Stats
    try {
        const reg = await databases.getDocument(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, winnerRegId);
        const userId = reg.userId;
        const userProfile = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);

        const updateData = {
            matchesWon: (userProfile.matchesWon || 0) + 1
        };

        // If this is the final match, it means they won the tournament
        const matchesRes = await getMatches(match.tournamentId);
        const maxRound = Math.max(...matchesRes.map(m => m.round));
        
        if (match.round === maxRound && tournament.firstPrize) {
            updateData.tournamentsWon = (userProfile.tournamentsWon || 0) + 1;
            
            // Parse earnings from tournament prize string (e.g. "₹5,000" -> 5000)
            const prizeValue = parseInt(tournament.firstPrize?.replace(/[^0-9]/g, "")) || 0;
            updateData.totalEarnings = (userProfile.totalEarnings || 0) + prizeValue;

            // Save winner and runner up to tournament doc for reversal support
            const runnerUpRegId = winnerRegId === match.teamA ? match.teamB : match.teamA;
            await databases.updateDocument(DATABASE_ID, TOURNAMENTS_COLLECTION_ID, match.tournamentId, {
                winnerRegId: winnerRegId,
                runnerUpRegId: runnerUpRegId
            });

            // Also award runner up prize
            if (runnerUpRegId && tournament.secondPrize) {
                try {
                    const runnerReg = await databases.getDocument(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, runnerUpRegId);
                    const runnerProfile = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, runnerReg.userId);
                    const runnerPrize = parseInt(tournament.secondPrize?.replace(/[^0-9]/g, "")) || 0;
                    
                    await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, runnerReg.userId, {
                        matchesWon: (runnerProfile.matchesWon || 0) + 1,
                        runnerUp: (runnerProfile.runnerUp || 0) + 1,
                        totalEarnings: (runnerProfile.totalEarnings || 0) + runnerPrize
                    });
                } catch (e) { console.warn("Runner up prize award failed", e); }
            }
        }

        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, updateData);
    } catch (err) {
        console.warn("Failed to update user stats during match finalization:", err.message);
    }

    // 5. Advance winner to next round if it's a bracket match
    const nextRoundNum = match.round + 1;
    const nextMatchIndex = Math.floor(match.matchIndex / 2);
    
    try {
        const nextMatchesRes = await databases.listDocuments(
            DATABASE_ID,
            MATCHES_COLLECTION_ID,
            [
                Query.equal("tournamentId", match.tournamentId),
                Query.equal("round", nextRoundNum),
                Query.equal("matchIndex", nextMatchIndex)
            ]
        );

        if (nextMatchesRes.total > 0) {
            const nextMatch = nextMatchesRes.documents[0];
            const isTeamA = match.matchIndex % 2 === 0;
            
            await databases.updateDocument(DATABASE_ID, MATCHES_COLLECTION_ID, nextMatch.$id, {
                [isTeamA ? 'teamA' : 'teamB']: winnerRegId
            });
        }
    } catch (e) {
        // Final match or error finding next
    }

    // 6. Check if all matches are completed to finish tournament
    try {
        const matches = await getMatches(match.tournamentId);
        const allCompleted = matches.length > 0 && matches.every(m => m.status === 'completed');
        
        if (allCompleted) {
            await databases.updateDocument(
                DATABASE_ID,
                TOURNAMENTS_COLLECTION_ID,
                match.tournamentId,
                { status: 'completed' }
            );
        }
    } catch (error) {
        console.error("Failed to check if tournament completed:", error);
    }

    return winnerRegId;
}

/**
 * Finalizes a Deathmatch tournament by identifying winners and awarding stats
 * Prevents duplicate rewards by checking tournament status
 */
export async function finalizeDeathmatch(tournamentId, winnerRegId, runnerUpRegId = null) {
    const REGISTRATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID;
    const USERS_COLLECTION_ID = "users";

    try {
        const tournament = await databases.getDocument(DATABASE_ID, TOURNAMENTS_COLLECTION_ID, tournamentId);
        
        // CRITICAL: If the tournament is already completed, do NOT award prizes again
        if (tournament.status === 'completed') {
            return false;
        }

        // 1. Award Winner Stats
        const winnerReg = await databases.getDocument(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, winnerRegId);
        const winnerProfile = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, winnerReg.userId);
        
        const winnerData = {
            matchesWon: (winnerProfile.matchesWon || 0) + 1,
            tournamentsWon: (winnerProfile.tournamentsWon || 0) + 1
        };

        if (tournament.firstPrize) {
            const prizeValue = parseInt(tournament.firstPrize?.replace(/[^0-9]/g, "")) || 0;
            winnerData.totalEarnings = (winnerProfile.totalEarnings || 0) + prizeValue;
        }
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, winnerReg.userId, winnerData);

        // 2. Award Runner Up Stats
        if (runnerUpRegId) {
            const runnerUpReg = await databases.getDocument(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, runnerUpRegId);
            const runnerUpProfile = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, runnerUpReg.userId);
            
            const runnerData = {
                matchesWon: (runnerUpProfile.matchesWon || 0) + 1,
                runnerUp: (runnerUpProfile.runnerUp || 0) + 1
            };

            if (tournament.secondPrize) {
                const prizeValue = parseInt(tournament.secondPrize?.replace(/[^0-9]/g, "")) || 0;
                runnerData.totalEarnings = (runnerUpProfile.totalEarnings || 0) + prizeValue;
            }
            await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, runnerUpReg.userId, runnerData);
        }

        // 3. Mark tournament with winners for reversal support
        await databases.updateDocument(DATABASE_ID, TOURNAMENTS_COLLECTION_ID, tournamentId, {
            winnerRegId,
            runnerUpRegId
        });

        return true;
    } catch (err) {
        console.error("Failed to finalize deathmatch stats:", err);
        throw err;
    }
}

export async function revertTournamentStats(tournamentId) {
    const REGISTRATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID;
    const USERS_COLLECTION_ID = "users";

    try {
        const tournament = await databases.getDocument(DATABASE_ID, TOURNAMENTS_COLLECTION_ID, tournamentId);
        
        // If not completed or no winner, nothing to revert
        if (tournament.status !== 'completed' || !tournament.winnerRegId) return false;

        // 1. Revert Winner
        try {
            const winnerReg = await databases.getDocument(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, tournament.winnerRegId);
            const winnerProfile = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, winnerReg.userId);
            
            const winnerData = {
                matchesWon: Math.max(0, (winnerProfile.matchesWon || 0) - 1),
                tournamentsWon: Math.max(0, (winnerProfile.tournamentsWon || 0) - 1)
            };
            if (tournament.firstPrize) {
                const prizeValue = parseInt(tournament.firstPrize?.replace(/[^0-9]/g, "")) || 0;
                winnerData.totalEarnings = Math.max(0, (winnerProfile.totalEarnings || 0) - prizeValue);
            }
            await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, winnerReg.userId, winnerData);
        } catch (e) { console.warn("Failed to revert winner stats", e); }

        // 2. Revert Runner Up
        if (tournament.runnerUpRegId) {
            try {
                const runnerUpReg = await databases.getDocument(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, tournament.runnerUpRegId);
                const runnerUpProfile = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, runnerUpReg.userId);
                
                const runnerData = {
                    matchesWon: Math.max(0, (runnerUpProfile.matchesWon || 0) - 1),
                    runnerUp: Math.max(0, (runnerUpProfile.runnerUp || 0) - 1)
                };
                if (tournament.secondPrize) {
                    const prizeValue = parseInt(tournament.secondPrize?.replace(/[^0-9]/g, "")) || 0;
                    runnerData.totalEarnings = Math.max(0, (runnerUpProfile.totalEarnings || 0) - prizeValue);
                }
                await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, runnerUpReg.userId, runnerData);
            } catch (e) { console.warn("Failed to revert runner up stats", e); }
        }

        // 3. Clear the ids on tournament
        await databases.updateDocument(DATABASE_ID, TOURNAMENTS_COLLECTION_ID, tournamentId, {
            winnerRegId: null,
            runnerUpRegId: null
        });

        return true;
    } catch (err) {
        console.error("Failed to revert tournament stats:", err);
        return false;
    }
}

export async function deleteMatches(tournamentId) {
    try {
        const matches = await getMatches(tournamentId);
        const promises = matches.map(m => 
            databases.deleteDocument(DATABASE_ID, MATCHES_COLLECTION_ID, m.$id)
        );
        await Promise.all(promises);
        return true;
    } catch (error) {
        console.error("Failed to delete matches:", error);
        throw error;
    }
}

/**
 * Update match scheduled time
 */
export async function updateMatchScheduledTime(matchId, scheduledTime) {
    return await databases.updateDocument(
        DATABASE_ID,
        MATCHES_COLLECTION_ID,
        matchId,
        { scheduledTime }
    );
}

/**
 * Update match notes/admin comments
 */
export async function updateMatchNotes(matchId, notes) {
    return await databases.updateDocument(
        DATABASE_ID,
        MATCHES_COLLECTION_ID,
        matchId,
        { notes }
    );
}

/**
 * Update complete match details (for admin panel)
 */
export async function updateMatchDetails(matchId, details) {
    const updateData = {};
    
    if (details.scheduledTime !== undefined) {
        updateData.scheduledTime = details.scheduledTime;
    }
    if (details.notes !== undefined) {
        updateData.notes = details.notes;
    }
    if (details.playerStats !== undefined) {
        updateData.playerStats = JSON.stringify(details.playerStats);
    }
    if (details.scoreA !== undefined) {
        updateData.scoreA = details.scoreA;
    }
    if (details.scoreB !== undefined) {
        updateData.scoreB = details.scoreB;
    }
    
    return await databases.updateDocument(
        DATABASE_ID,
        MATCHES_COLLECTION_ID,
        matchId,
        updateData
    );
}

/**
 * Parse player stats from match document
 */
export function parsePlayerStats(match) {
    if (!match.playerStats) return {};
    try {
        return typeof match.playerStats === 'string' 
            ? JSON.parse(match.playerStats) 
            : match.playerStats;
    } catch (e) {
        console.error("Failed to parse player stats:", e);
        return {};
    }
}
