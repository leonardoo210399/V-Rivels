 import { NextResponse } from "next/server";

// Import Appwrite server SDK for webhook processing
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
 * Webhook handler for UPI Gateway (ekQR) payment callbacks
 * 
 * Receives POST with Content-Type: application/x-www-form-urlencoded
 * 
 * Payload fields:
 * - status: "success" | "failure"
 * - client_txn_id: Our transaction ID
 * - amount: Payment amount
 * - upi_txn_id: UPI reference number
 * - customer_vpa: Customer's UPI ID
 * - udf1: tournamentId
 * - udf2: userId
 * - udf3: extra data (JSON string with teamName, metadata)
 */
export async function POST(request) {
  try {
    // Parse form data (application/x-www-form-urlencoded)
    const formData = await request.formData();
    
    const status = formData.get("status");
    const clientTxnId = formData.get("client_txn_id");
    const amount = formData.get("amount");
    const upiTxnId = formData.get("upi_txn_id");
    const customerVpa = formData.get("customer_vpa");
    const tournamentId = formData.get("udf1");
    const userId = formData.get("udf2");
    const extraDataStr = formData.get("udf3");

    // Validate required fields
    if (!clientTxnId || !status) {
      console.error("[UPI Webhook] Missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = getAppwriteClient();
    const databases = new sdk.Databases(client);

    // Find the payment request by client_txn_id
    const paymentRequests = await databases.listDocuments(
      DATABASE_ID,
      PAYMENT_REQUESTS_COLLECTION_ID,
      [sdk.Query.equal("transactionId", clientTxnId)]
    );

    if (paymentRequests.total === 0) {
      console.error("[UPI Webhook] Payment request not found:", clientTxnId);
      return NextResponse.json(
        { success: false, error: "Payment request not found" },
        { status: 404 }
      );
    }

    const paymentRequest = paymentRequests.documents[0];

    if (paymentRequest.paymentStatus === "verified") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    if (status === "success") {
      // Update payment request to verified with all tracking info
      await databases.updateDocument(
        DATABASE_ID,
        PAYMENT_REQUESTS_COLLECTION_ID,
        paymentRequest.$id,
        {
          paymentStatus: "verified",
          upiTxnId: upiTxnId || "",
          customerVpa: customerVpa || "",
          webhookReceivedAt: new Date().toISOString(),
        }
      );

      // Create the tournament registration
      try {
        const metadata = paymentRequest.metadata ? JSON.parse(paymentRequest.metadata) : {};
        
        await databases.createDocument(
          DATABASE_ID,
          REGISTRATIONS_COLLECTION_ID,
          sdk.ID.unique(),
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

        // Send Discord notifications
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
              console.warn("[UPI Webhook] Discord role assignment failed:", roleResult.error);
            }
          }

          // Send registration announcement
          await announceRegistrationApprovedAction(
            tournament?.name || "Tournament",
            registrantName,
            clientTxnId,
            userProfile?.discordId || null
          );
        } catch (discordError) {
          console.warn("[UPI Webhook] Discord notification failed:", discordError);
          // Don't fail the webhook if Discord fails
        }
        
      } catch (regError) {
        console.error("[UPI Webhook] Failed to create registration:", regError);
        // Payment is still marked as verified, admin can manually create registration
      }

    } else {
      // Payment failed - use 'failed' (new enum value)
      await databases.updateDocument(
        DATABASE_ID,
        PAYMENT_REQUESTS_COLLECTION_ID,
        paymentRequest.$id,
        {
          paymentStatus: "failed",
          rejectionReason: `Payment failed via UPI. Status: ${status}`,
        }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[UPI Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook URL verification)
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "UPI Gateway webhook endpoint is active" 
  });
}
