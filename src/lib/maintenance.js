import { databases } from "./appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = "users";
const TOURNAMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TOURNAMENTS_COLLECTION_ID;
const REGISTRATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID;
const MATCHES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID || "matches";

/**
 * Fetches all documents from a collection with pagination
 */
async function fetchAllDocuments(collectionId, queries = []) {
    let allDocs = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
        const response = await databases.listDocuments(
            DATABASE_ID,
            collectionId,
            [...queries, Query.limit(limit), Query.offset(offset)]
        );
        
        allDocs = [...allDocs, ...response.documents];
        
        if (response.documents.length < limit) break;
        offset += limit;
    }
    
    return allDocs;
}

/**
 * Parses currency prize string (e.g. "₹5,000") to integer
 */
function parsePrize(prizeStr) {
    if (!prizeStr) return 0;
    return parseInt(prizeStr.replace(/[^0-9]/g, "")) || 0;
}

/**
 * Main function to synchronize the leaderboard with actual database records
 * Recalculates all user stats from scratch based on matches and tournament results
 */
export async function syncLeaderboardWithDB() {
    console.log("Starting Full Leaderboard Sync...");
    
    try {
        // 1. Fetch all required data in parallel
        const [users, tournaments, registrations, completedMatches] = await Promise.all([
            fetchAllDocuments(USERS_COLLECTION_ID),
            fetchAllDocuments(TOURNAMENTS_COLLECTION_ID),
            fetchAllDocuments(REGISTRATIONS_COLLECTION_ID),
            fetchAllDocuments(MATCHES_COLLECTION_ID, [Query.equal("status", "completed")])
        ]);

        console.log(`Analyzing: ${users.length} users, ${tournaments.length} tournaments, ${registrations.length} registrations, ${completedMatches.length} completed matches`);

        // 2. Initialize stats index for all known users
        const statsMap = {};
        users.forEach(u => {
            statsMap[u.$id] = {
                matchesWon: 0,
                tournamentsWon: 0,
                runnerUp: 0,
                totalEarnings: 0
            };
        });

        // Add index for registrations to find userId quickly
        const regToUser = {};
        registrations.forEach(r => {
            regToUser[r.$id] = r.userId;
        });

        // 3. Calculate Individual Match Wins
        completedMatches.forEach(m => {
            if (m.winner && regToUser[m.winner]) {
                const userId = regToUser[m.winner];
                if (statsMap[userId]) {
                    statsMap[userId].matchesWon += 1;
                }
            }
        });

        // 4. Calculate Tournament Wins and Earnings
        tournaments.forEach(t => {
            const firstPrize = parsePrize(t.firstPrize);
            const secondPrize = parsePrize(t.secondPrize);

            if (t.winnerRegId && regToUser[t.winnerRegId]) {
                const userId = regToUser[t.winnerRegId];
                if (statsMap[userId]) {
                    statsMap[userId].tournamentsWon += 1;
                    statsMap[userId].totalEarnings += firstPrize;
                    
                    // For Deathmatch, the winner gets a match win credited here
                    // because the LOBBY match document usually doesn't have a winner set.
                    if (t.gameType === "Deathmatch") {
                        statsMap[userId].matchesWon += 1;
                    }
                }
            }

            if (t.runnerUpRegId && regToUser[t.runnerUpRegId]) {
                const userId = regToUser[t.runnerUpRegId];
                if (statsMap[userId]) {
                    statsMap[userId].runnerUp += 1;
                    statsMap[userId].totalEarnings += secondPrize;

                    // Same for Deathmatch runner-up to maintain parity with legacy logic
                    if (t.gameType === "Deathmatch") {
                        statsMap[userId].matchesWon += 1;
                    }
                }
            }
        });

        // 5. Compare and Update Users
        let updatedCount = 0;
        const updatePromises = users.map(async (u) => {
            const calculated = statsMap[u.$id];
            
            // Check if any stat has changed
            const matchesChanged = (u.matchesWon || 0) !== calculated.matchesWon;
            const tournamentsChanged = (u.tournamentsWon || 0) !== calculated.tournamentsWon;
            const runnerUpChanged = (u.runnerUp || 0) !== calculated.runnerUp;
            const earningsChanged = (u.totalEarnings || 0) !== calculated.totalEarnings;

            if (matchesChanged || tournamentsChanged || runnerUpChanged || earningsChanged) {
                updatedCount++;
                return databases.updateDocument(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    u.$id,
                    calculated
                );
            }
        });

        await Promise.all(updatePromises);
        
        return {
            success: true,
            totalUsersAnalyzed: users.length,
            usersUpdated: updatedCount
        };

    } catch (error) {
        console.error("Leaderboard sync failed:", error);
        throw error;
    }
}
