import { ID, Query } from "node-appwrite";
import crypto from "crypto";
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

// Helper to generate deterministic ID
const generateRegistrationId = (tournamentId, userId) => {
  return crypto.createHash('md5').update(`${tournamentId}_${userId}`).digest('hex').substring(0, 32);
};

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
        webhookReceivedAt: new Date().toISOString(),
      }
    );

    // 2. Create the tournament registration
    try {
      // Use deterministic ID to prevent race conditions (Webhook vs Polling)
      const registrationId = generateRegistrationId(paymentRequest.tournamentId, paymentRequest.userId);

      try {
        await databases.createDocument(
            DATABASE_ID,
            REGISTRATIONS_COLLECTION_ID,
            registrationId, 
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
      } catch (createError) {
        // If error is 409 (Conflict), it means it already exists - which is fine!
        if (createError.code === 409 || createError.type === 'document_already_exists') {
             console.log(`[PaymentProcessor] Registration already exists (race condition handled) for ${paymentRequest.userId}`);
             return { success: true, message: "Payment verified, registration already existed" };
        }
        throw createError; // Re-throw real errors
      }

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
