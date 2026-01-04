import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const TOURNAMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TOURNAMENTS_COLLECTION_ID;
const REGISTRATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID;

export async function getTournaments() {
  const response = await databases.listDocuments(
    DATABASE_ID,
    TOURNAMENTS_COLLECTION_ID,
    [Query.orderDesc("$createdAt")]
  );
  return response.documents;
}

export async function getTournament(id) {
  return await databases.getDocument(
    DATABASE_ID,
    TOURNAMENTS_COLLECTION_ID,
    id
  );
}

export async function createTournament(data) {
  return await databases.createDocument(
    DATABASE_ID,
    TOURNAMENTS_COLLECTION_ID,
    ID.unique(),
    data
  );
}

export async function registerForTournament(tournamentId, userId, teamName, data = {}) {
    // Check for existing registration and tournament capacity
    const [tournament, existing, totalRegs] = await Promise.all([
        getTournament(tournamentId),
        databases.listDocuments(
            DATABASE_ID,
            REGISTRATIONS_COLLECTION_ID,
            [
                Query.equal("tournamentId", tournamentId),
                Query.equal("userId", userId)
            ]
        ),
        getRegistrations(tournamentId)
    ]);

    if (existing.total > 0) {
        throw new Error("Already registered for this tournament");
    }

    if (totalRegs.total >= tournament.maxTeams) {
        throw new Error("Tournament is full");
    }

    return await databases.createDocument(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        ID.unique(),
        {
            tournamentId,
            userId,
            teamName,
            metadata: data.metadata || null,
            registeredAt: new Date().toISOString(),
            checkedIn: false // Default to false
        }
    );
}

export async function checkInForTournament(registrationId) {
    return await databases.updateDocument(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        registrationId,
        {
            checkedIn: true,
            checkedInAt: new Date().toISOString()
        }
    );
}

export async function getRegistrations(tournamentId) {
     return await databases.listDocuments(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        [Query.equal("tournamentId", tournamentId)]
    );
}

export async function deleteTournament(id) {
    // 1. Get all registrations for this tournament
    const regs = await getRegistrations(id);
    
    // 2. Delete all associated registrations in parallel
    if (regs.total > 0) {
        await Promise.all(
            regs.documents.map(reg => 
                databases.deleteDocument(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, reg.$id)
            )
        );
    }

    // 3. Delete the tournament document
    return await databases.deleteDocument(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        id
    );
}
