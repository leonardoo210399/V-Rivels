import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
// Using the ID we defined in appwrite.config.json
const PAYMENT_REQUESTS_COLLECTION_ID = "payment_requests"; 

export async function createPaymentRequest(tournamentId, userId, teamName, metadata, transactionId) {
  // Check for duplicate transaction ID
  const existing = await databases.listDocuments(
    DATABASE_ID,
    PAYMENT_REQUESTS_COLLECTION_ID,
    [
        Query.equal("transactionId", transactionId)
    ]
  );

  if (existing.total > 0) {
      throw new Error("This Transaction ID has already been used. Please check your details.");
  }

  return await databases.createDocument(
    DATABASE_ID,
    PAYMENT_REQUESTS_COLLECTION_ID,
    ID.unique(),
    {
      tournamentId,
      userId,
      teamName,
      metadata: JSON.stringify(metadata),
      requestedAt: new Date().toISOString(),
      paymentStatus: "pending",
      transactionId,
    }
  );
}

export async function getPaymentRequestsForUser(tournamentId, userId) {
  const response = await databases.listDocuments(
    DATABASE_ID,
    PAYMENT_REQUESTS_COLLECTION_ID,
    [
      Query.equal("tournamentId", tournamentId),
      Query.equal("userId", userId),
      Query.orderDesc("requestedAt"), // Get latest first
      Query.limit(1)
    ]
  );
  return response.documents[0] || null;
}

export async function getTournamentPaymentRequests(tournamentId) {
  const response = await databases.listDocuments(
    DATABASE_ID,
    PAYMENT_REQUESTS_COLLECTION_ID,
    [
      Query.equal("tournamentId", tournamentId),
      Query.orderDesc("requestedAt"),
      Query.limit(100) // Adjust limit as needed
    ]
  );
  return response.documents;
}

export async function updatePaymentRequestStatus(requestId, status, rejectionReason = null) {
  return await databases.updateDocument(
    DATABASE_ID,
    PAYMENT_REQUESTS_COLLECTION_ID,
    requestId,
    {
      paymentStatus: status,
      rejectionReason: rejectionReason
    }
  );
}

export async function getAllPendingPaymentRequests() {
    const response = await databases.listDocuments(
        DATABASE_ID,
        PAYMENT_REQUESTS_COLLECTION_ID,
        [
            Query.equal("paymentStatus", "pending"),
            Query.limit(5000) // Adjust limit as needed, max for Appwrite is usually restricted but we try high
        ]
    );
    return response.documents;
}
