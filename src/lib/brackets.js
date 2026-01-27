import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const MATCHES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID || "matches"; 

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

export async function createBracket(tournamentId, registrations, gameType = "5v5", tournamentDate = null) {
    if (!registrations || registrations.length < 2) {
        throw new Error("Need at least 2 participants to start.");
    }

    if (gameType === "Deathmatch") {
        return await databases.createDocument(
            DATABASE_ID,
            MATCHES_COLLECTION_ID,
            ID.unique(),
            {
                tournamentId,
                round: 1,
                matchIndex: 0,
                teamA: "LOBBY",
                status: "scheduled",
            }
        );
    }

    // 1. Generate the match structure in memory (Single Elimination)
    const matches = generateSingleEliminationBracket(registrations);
    
    // 2. Save each match to the database
    // We do this sequentially or carefully because some matches might depend on others
    // though for initial creation, all data is in the 'matches' array from generateSingleEliminationBracket
    const promises = matches.map(match => {
        let scheduledTime = null;
        if (tournamentDate && gameType === "5v5") {
            const startDate = new Date(tournamentDate);
            // Calculation matching Admin Panel: (Round-1)*4 hours + MatchIndex
            const offset = (match.round - 1) * 4 + match.matchIndex;
            startDate.setHours(startDate.getHours() + offset);
            scheduledTime = startDate.toISOString();
        }

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
                status: match.status || "scheduled",
                vetoStarted: false,
                scheduledTime: scheduledTime
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
 * @param {Array} participants - Array of registration objects.
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

    const byes = size - totalTeams;
    const round1MatchesCount = size / 2;
    
    const allMatches = [];
    let currentRoundMatches = [];
    
    // Pad for byes
    const paddedParticipants = [...shuffled];
    for (let i = 0; i < byes; i++) {
        paddedParticipants.push(null);
    }

    // Create Round 1
    for (let i = 0; i < round1MatchesCount; i++) {
        const teamA = paddedParticipants[i];
        const teamB = paddedParticipants[size - 1 - i];
        
        const winner = teamB === null ? teamA : (teamA === null ? teamB : null);
        
        currentRoundMatches.push({
            round: 1,
            matchIndex: i,
            teamA: teamA,
            teamB: teamB,
            winner: winner,
            status: winner ? 'completed' : 'scheduled'
        });
    }

    allMatches.push(...currentRoundMatches);

    // Generate subsequent rounds
    let prevRoundMatches = currentRoundMatches;
    let roundNum = 2;
    let activeMatchCount = round1MatchesCount;
    
    while (activeMatchCount > 1) {
        activeMatchCount /= 2;
        const nextRoundMatches = [];
        for (let i = 0; i < activeMatchCount; i++) {
            // Match in next round depends on two matches from previous round
            const match1 = prevRoundMatches[i * 2];
            const match2 = prevRoundMatches[i * 2 + 1];
            
            // Advance winners if available (Byes)
            const teamA = match1.winner;
            const teamB = match2.winner;
            
            // If both teams advanced via byes, this match might also be completed
            // (Unlikely in standard seeding but possible in random)
            const winner = (teamA && teamB === null) ? teamA : (teamA === null && teamB ? teamB : null);

            nextRoundMatches.push({
                round: roundNum,
                matchIndex: i,
                teamA: teamA,
                teamB: teamB,
                winner: null, // Subseq round winner must be determined by playing
                status: 'scheduled'
            });
        }
        allMatches.push(...nextRoundMatches);
        prevRoundMatches = nextRoundMatches;
        roundNum++;
    }

    return allMatches;
}

export async function getMatch(matchId) {
    if (!matchId) {
        console.error("getMatch called without matchId");
        throw new Error("matchId is required");
    }
    try {
        return await databases.getDocument(
            DATABASE_ID,
            MATCHES_COLLECTION_ID,
            matchId
        );
    } catch (error) {
        console.error(`Failed to fetch match with ID: ${matchId}`, error);
        throw error;
    }
}

export async function updateMatchScore(matchId, scoreA, scoreB, winnerId) {
    if (!matchId) throw new Error("matchId is required for updateMatchScore");
    
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

export async function startMatchVeto(matchId) {
    return await databases.updateDocument(
        DATABASE_ID,
        MATCHES_COLLECTION_ID,
        matchId,
        {
            vetoStarted: true
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
    const USERS_COLLECTION_ID = "users"; // Ensure this matches actual collection ID

    console.log("Starting finalizeDeathmatch:", { tournamentId, winnerRegId, runnerUpRegId });

    try {
        const tournament = await databases.getDocument(DATABASE_ID, TOURNAMENTS_COLLECTION_ID, tournamentId);
        
        // CRITICAL: If the tournament is already completed, do NOT award prizes again
        if (tournament.status === 'completed') {
            console.log("Tournament already completed. Skipping finalization.");
            return false;
        }

        // 1. Award Winner Stats
        console.log("Fetching winner registration:", winnerRegId);
        const winnerReg = await databases.getDocument(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, winnerRegId);
        
        console.log("Fetching winner profile for user:", winnerReg.userId); // Check if this starts with underscore or is invalid
        if (!winnerReg.userId) throw new Error("Winner Registration has no userId");

        const winnerProfile = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, winnerReg.userId);
        
        const winnerData = {
            matchesWon: (winnerProfile.matchesWon || 0) + 1,
            tournamentsWon: (winnerProfile.tournamentsWon || 0) + 1
        };

        if (tournament.firstPrize) {
            const prizeValue = parseInt(tournament.firstPrize?.replace(/[^0-9]/g, "")) || 0;
            winnerData.totalEarnings = (winnerProfile.totalEarnings || 0) + prizeValue;
        }
        
        console.log("Updating winner stats...", winnerReg.userId);
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, winnerReg.userId, winnerData);

        // 2. Award Runner Up Stats
        if (runnerUpRegId) {
            console.log("Fetching runner up:", runnerUpRegId);
            const runnerUpReg = await databases.getDocument(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, runnerUpRegId);
            
            console.log("Fetching runner up profile:", runnerUpReg.userId);
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
        console.log("Updating tournament doc:", tournamentId);
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
 * Note: seriesScores and mapPlayerStats are stored INSIDE playerStats JSON
 * to avoid exceeding Appwrite's attribute limit on the matches collection
 */
export async function updateMatchDetails(matchId, details) {
    const updateData = {};
    
    if (details.scheduledTime !== undefined) {
        updateData.scheduledTime = details.scheduledTime;
    }
    if (details.notes !== undefined) {
        updateData.notes = details.notes;
    }
    
    // Consolidate all player/match stats into a single playerStats JSON field
    // This avoids needing separate seriesScores and mapPlayerStats columns
    const consolidatedStats = {
        players: details.playerStats || {},
        seriesScores: details.seriesScores || [],
        mapPlayerStats: details.mapPlayerStats || [],
    };
    updateData.playerStats = JSON.stringify(consolidatedStats);
    
    if (details.scoreA !== undefined) {
        updateData.scoreA = details.scoreA;
    }
    if (details.scoreB !== undefined) {
        updateData.scoreB = details.scoreB;
    }
    if (details.matchFormat !== undefined) {
        updateData.matchFormat = details.matchFormat;
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
 * Handles both legacy format (flat player stats) and new consolidated format
 * Returns: { players: {}, seriesScores: [], mapPlayerStats: [] }
 */
export function parsePlayerStats(match) {
    if (!match.playerStats) {
        return { players: {}, seriesScores: [], mapPlayerStats: [] };
    }
    try {
        const parsed = typeof match.playerStats === 'string' 
            ? JSON.parse(match.playerStats) 
            : match.playerStats;
        
        // Check if it's the new consolidated format
        if (parsed.players !== undefined) {
            return {
                players: parsed.players || {},
                seriesScores: parsed.seriesScores || [],
                mapPlayerStats: parsed.mapPlayerStats || [],
            };
        }
        
        // Legacy format: playerStats is just the player stats object
        return {
            players: parsed,
            seriesScores: [],
            mapPlayerStats: [],
        };
    } catch (e) {
        console.error("Failed to parse player stats:", e);
        return { players: {}, seriesScores: [], mapPlayerStats: [] };
    }
}

/**
 * Reset an individual match to its initial state
 * Clears scores, winner, veto data, player stats, and sets status back to scheduled
 */
export async function resetMatch(matchId) {
    try {
        return await databases.updateDocument(
            DATABASE_ID,
            MATCHES_COLLECTION_ID,
            matchId,
            {
                scoreA: 0,
                scoreB: 0,
                winner: null,
                status: 'scheduled',
                vetoData: null,
                vetoStarted: false,
                playerStats: null,
                notes: null
            }
        );
    } catch (error) {
        console.error("Failed to reset match:", error);
        throw error;
    }
}
