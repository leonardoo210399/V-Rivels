
import { ID, Query } from "node-appwrite";

// Import Appwrite server SDK
const sdk = require("node-appwrite");

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const PAYMENT_REQUESTS_COLLECTION_ID = "payment_requests";
const REGISTRATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REGISTRATIONS_COLLECTION_ID;

// Initialize Appwrite client for server-side operations
function getAppwriteClient() {
  const client = new sdk.Client();
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  return client;
}

/**
 * Process a successful payment
 * 
 * @param {Object} paymentRequest - The payment request document from Appwrite
 * @param {Object} paymentDetails - Details from the gateway (upiTxnId, customerVpa, etc.)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function processSuccessfulPayment(paymentRequest, paymentDetails = {}) {
  try {
    const client = getAppwriteClient();
    const databases = new sdk.Databases(client);

    console.log(`[PaymentProcessor] Processing payment for ${paymentRequest.$id}`);

    // 1. Update payment request to verified
    await databases.updateDocument(
      DATABASE_ID,
      PAYMENT_REQUESTS_COLLECTION_ID,
      paymentRequest.$id,
      {
        paymentStatus: "verified",
        upiTxnId: paymentDetails.upiTxnId || "",
        customerVpa: paymentDetails.customerVpa || "",
        webhookReceivedAt: new Date().toISOString(), // Keeping the field name consistent, though it might be from polling
      }
    );

    // 2. Create the tournament registration
    try {
      // Check if registration already exists to avoid duplicates
      // (This is a safety check, though Appwrite might handle unique constraints if set)
      const existingRegs = await databases.listDocuments(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        [
          Query.equal("tournamentId", paymentRequest.tournamentId),
          Query.equal("userId", paymentRequest.userId)
        ]
      );

      if (existingRegs.total > 0) {
        console.log(`[PaymentProcessor] Registration already exists for ${paymentRequest.userId} in ${paymentRequest.tournamentId}`);
        return { success: true, message: "Payment verified, registration already existed" };
      }

      await databases.createDocument(
        DATABASE_ID,
        REGISTRATIONS_COLLECTION_ID,
        ID.unique(),
        {
          tournamentId: paymentRequest.tournamentId,
          userId: paymentRequest.userId,
          teamName: paymentRequest.teamName || "",
          metadata: paymentRequest.metadata || "{}",
          registeredAt: new Date().toISOString(),
          paymentStatus: "verified",
          checkedIn: false,
        }
      );

      console.log(`[PaymentProcessor] Registration created for ${paymentRequest.userId}`);

      // 3. Send Discord notifications
      try {
        // Dynamically import the discord actions
        const { announceRegistrationApprovedAction, assignTournamentRoleAction } = await import("@/app/actions/discord");
        const { getUserProfile } = await import("@/lib/users");
        const { getTournament } = await import("@/lib/tournaments");

        // Get tournament info and user profile
        const tournament = await getTournament(paymentRequest.tournamentId);
        const userProfile = await getUserProfile(paymentRequest.userId);

        // Determine registrant name based on game type
        const isTeamMode = ["5v5", "2v2", "3v3"].includes(tournament?.gameType);
        const metadata = paymentRequest.metadata ? JSON.parse(paymentRequest.metadata) : {};
        const registrantName = isTeamMode 
          ? paymentRequest.teamName 
          : metadata?.playerName || paymentRequest.teamName;

        // Assign Discord role if configured
        if (userProfile?.discordId && tournament?.discordRoleId) {
          const roleResult = await assignTournamentRoleAction(
            tournament.discordRoleId,
            userProfile.discordId
          );
          if (roleResult?.error) {
            console.warn("[PaymentProcessor] Discord role assignment failed:", roleResult.error);
          }
        }

        // Send registration announcement
        await announceRegistrationApprovedAction(
          tournament?.name || "Tournament",
          registrantName,
          paymentRequest.transactionId,
          userProfile?.discordId || null
        );
        
        console.log(`[PaymentProcessor] Discord notifications sent for ${paymentRequest.transactionId}`);

      } catch (discordError) {
        console.warn("[PaymentProcessor] Discord notification failed:", discordError);
        // Don't fail the payment processing if Discord fails
      }
      
    } catch (regError) {
      console.error("[PaymentProcessor] Failed to create registration:", regError);
      // We still return success because the payment WAS verified
      return { success: true, warning: "Payment verified but registration creation failed. Please check logs." };
    }

    return { success: true };

  } catch (error) {
    console.error("[PaymentProcessor] Fatal error:", error);
    return { success: false, error: error.message };
  }
}
