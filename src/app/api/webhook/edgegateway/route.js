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
 * Webhook handler for EdgeGateway payment callbacks
 * 
 * Receives POST with JSON payload
 * 
 * Payload structure (example):
 * {
 *   "id": 12345678,
 *   "amount": 100.15,
 *   "client_txn_id": "ORD123456",
 *   "status": "success",
 *   "customer_email": "jondoe@gmail.com",
 *   "customer_vpa": "jondoe@upi",
 *   "utr": "325612458963",
 *   "udf1": "tournamentId",
 *   "udf2": "userId"
 * }
 */
export async function POST(request) {
  try {
    const rawBody = await request.text();
    let payload;
    
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error("[EdgeGateway Webhook] Failed to parse JSON body:", rawBody);
      return NextResponse.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }
    
    // Extract fields
    const status = payload.status;
    const clientTxnId = payload.client_txn_id;
    const upiTxnId = payload.utr || payload.upi_txn_id;
    const customerVpa = payload.customer_vpa;
    
    // udf1, udf2 might be in payload or we might need to fetch from DB if not returned
    // EdgeGateway usually returns them if sent during creation
    const tournamentId = payload.udf1;
    const userId = payload.udf2;

    // Validate required fields
    if (!clientTxnId) {
      console.error("[EdgeGateway Webhook] Missing client_txn_id");
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
      console.error("[EdgeGateway Webhook] Payment request not found:", clientTxnId);
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
              console.warn("[EdgeGateway Webhook] Discord role assignment failed:", roleResult.error);
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
          console.warn("[EdgeGateway Webhook] Discord notification failed:", discordError);
          // Don't fail the webhook if Discord fails
        }
        
      } catch (regError) {
        console.error("[EdgeGateway Webhook] Failed to create registration:", regError);
        // Payment is still marked as verified, admin can manually create registration
      }

    } else {
      // Payment failed
      await databases.updateDocument(
        DATABASE_ID,
        PAYMENT_REQUESTS_COLLECTION_ID,
        paymentRequest.$id,
        {
          paymentStatus: "rejected",
          rejectionReason: `Payment failed via EdgeGateway. Status: ${status}`,
        }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[EdgeGateway Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook URL verification if needed)
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "EdgeGateway webhook endpoint is active" 
  });
}
