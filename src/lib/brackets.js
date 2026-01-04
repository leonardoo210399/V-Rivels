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

export async function createBracket(tournamentId, registrations) {
    if (!registrations || registrations.length < 2) {
        throw new Error("Need at least 2 teams to generate a bracket.");
    }

    // 1. Generate the match structure in memory
    const matches = generateSingleEliminationBracket(registrations);
    
    // 2. Save each match to the database
    // validation: ensure matches collection exists first in your head/schema
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
                // startTime: match.startTime // Optional feature for later
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
