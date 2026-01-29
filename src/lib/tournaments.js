import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const TOURNAMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TOURNAMENTS_COLLECTION_ID || "tournaments";
const REGISTRATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID || "registrations";

export async function getTournaments() {
  const response = await databases.listDocuments(
    DATABASE_ID,
    TOURNAMENTS_COLLECTION_ID,
    [Query.orderDesc("$createdAt")]
  );
  return response.documents;
}

export async function getTournament(id) {
  if (!id || typeof id !== 'string') {
    console.error("Invalid tournament ID passed to getTournament:", id);
    throw new Error("Invalid tournament ID");
  }
  
  try {
    return await databases.getDocument(
      DATABASE_ID,
      TOURNAMENTS_COLLECTION_ID,
      id
    );
  } catch (error) {
    console.error(`Failed to fetch tournament with ID: ${id}`, error);
    throw error;
  }
}

// Discord Bot Logic removed - Moved to Server Action to prevent 500 Error
// (createTournament runs in browser, discord.js runs in Node)

export async function createTournament(data) {
  return await databases.createDocument(
    DATABASE_ID,
    TOURNAMENTS_COLLECTION_ID,
    ID.unique(),
    data
  );
}

export async function updateTournament(id, data) {
    return await databases.updateDocument(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        id,
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

    const registration = await databases.createDocument(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        ID.unique(),
        {
            tournamentId,
            userId,
            teamName,
            metadata: data.metadata || null,
            registeredAt: new Date().toISOString(),
            checkedIn: false,
            transactionId: data.transactionId || null,
            paymentStatus: data.paymentStatus || "free",
        }
    );

    // Increment registeredTeams count on the tournament document (optional cache update)
    try {
        await databases.updateDocument(
            DATABASE_ID,
            TOURNAMENTS_COLLECTION_ID,
            tournamentId,
            {
                registeredTeams: (tournament.registeredTeams || 0) + 1
            }
        );
    } catch (e) {
        // Log but don't fail registration if this cache update fails
        console.warn("Failed to update tournament cache field:", e.message);
    }

    return registration;
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

export async function checkUserRegistration(tournamentId, userId) {
    if (!userId) return false;
    const response = await databases.listDocuments(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        [
            Query.equal("tournamentId", tournamentId),
            Query.equal("userId", userId)
        ]
    );
    return response.total > 0;
}

export async function getRegistration(registrationId) {
    return await databases.getDocument(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        registrationId
    );
}

export async function updateRegistrationPaymentStatus(registrationId, status, transactionId = null) {
    const data = {
        paymentStatus: status
    };
    if (transactionId) {
        data.transactionId = transactionId;
    }

    return await databases.updateDocument(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        registrationId,
        data
    );
}

import { deleteMatches, getMatches } from "./brackets";

export async function deleteTournament(id) {
    try {
        // 1. Delete all associated registrations
        try {
            const regs = await getRegistrations(id);
            if (regs.total > 0) {
                await Promise.all(
                    regs.documents.map(reg => 
                        databases.deleteDocument(DATABASE_ID, REGISTRATIONS_COLLECTION_ID, reg.$id)
                    )
                );
            }
        } catch (e) {
            console.warn("Failed to clean up registrations, might be empty or missing collection:", e.message);
        }

        // 2. Delete all associated matches
        try {
            await deleteMatches(id);
        } catch (e) {
            console.warn("Failed to clean up matches:", e.message);
        }

        // 3. Finally delete the tournament document
        return await databases.deleteDocument(
            DATABASE_ID,
            TOURNAMENTS_COLLECTION_ID,
            id
        );
    } catch (error) {
        console.error("Critical failure during tournament deletion:", error);
        throw error;
    }
}

export async function deleteRegistration(registrationId, tournamentId) {
    try {
        const tournament = await getTournament(tournamentId);
        
        // 1. Delete the registration
        await databases.deleteDocument(
            DATABASE_ID,
            REGISTRATIONS_COLLECTION_ID,
            registrationId
        );

        // 2. Decrement registeredTeams count
        await databases.updateDocument(
            DATABASE_ID,
            TOURNAMENTS_COLLECTION_ID,
            tournamentId,
            {
                registeredTeams: Math.max(0, (tournament.registeredTeams || 0) - 1)
            }
        );

        return true;
    } catch (error) {
        console.error("Delete registration error", error);
        throw error;
    }
}
