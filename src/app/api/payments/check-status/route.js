import { NextResponse } from "next/server";
import { databases as adminDatabases } from "@/lib/server/appwrite";
import { Query } from "node-appwrite";
import { announceRegistrationApprovedAction } from "@/app/actions/discord";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const PAYMENT_REQUESTS_COLLECTION_ID = "payment_requests";
const REGISTRATIONS_COLLECTION_ID = "registrations";
const TOURNAMENTS_COLLECTION_ID = "tournaments";

export async function POST(request) {
  try {
    const { orderId } = await request.json(); // Our Appwrite Doc ID

    // 1. Get the document to find the IMB internal order ID
    let payReq;
    try {
        payReq = await adminDatabases.getDocument(
            DATABASE_ID,
            PAYMENT_REQUESTS_COLLECTION_ID,
            orderId
        );
    } catch (e) {
        return NextResponse.json({ success: false, message: "Payment request not found" }, { status: 404 });
    }

    const imbOrderId = payReq.imbOrderId || orderId; // Fallback to our ID if not stored yet
    const user_token = process.env.IMB_USER_TOKEN;
    const base_url = process.env.IMB_API_BASE_URL || "https://secure-stage.imb.org.in/";
    
    const endpoint = `${base_url.endsWith('/') ? base_url : base_url + '/'}api/check-order-status`;

    const formData = new URLSearchParams();
    formData.append("user_token", user_token);
    formData.append("order_id", imbOrderId);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await response.json();
    console.log("IMB Check Status Response:", JSON.stringify(data, null, 2));

    // 2. PROPER SUCCESS CHECK (Based on docs and observed variations)
    const statusTop = String(data.status || "").toUpperCase();
    const statusNested = String(data.result?.status || "").toUpperCase();
    const txnStatus = String(data.result?.txnStatus || "").toUpperCase();
    const paymentStatusNested = String(data.result?.paymentStatus || "").toUpperCase();
    
    const isSuccess = 
        statusTop === "COMPLETED" || 
        statusTop === "SUCCESS" || 
        data.status === true ||
        statusNested === "SUCCESS" ||
        statusNested === "COMPLETED" ||
        txnStatus === "COMPLETED" ||
        txnStatus === "SUCCESS" ||
        paymentStatusNested === "SUCCESS" ||
        paymentStatusNested === "COMPLETED";

    // 3. FALLBACK: If status is success but our database isn't updated yet, update it now.
    // This handles cases where webhooks are delayed or missed.
    if (isSuccess && payReq.paymentStatus !== "verified") {
        console.log(`Fallback Verification for Order: ${orderId}`);
        const utr = data.result?.utr || data.result?.txn_id || "IMB_AUTO_VERIFIED";
        
        try {
            // Update Payment Request
            await adminDatabases.updateDocument(
                DATABASE_ID,
                PAYMENT_REQUESTS_COLLECTION_ID,
                orderId,
                { 
                    paymentStatus: "verified",
                    utr,
                    verifiedAt: new Date().toISOString(),
                    verificationMethod: "auto",
                    metadata: JSON.stringify({
                        ...payReq.metadata ? JSON.parse(payReq.metadata) : {},
                        verifiedVia: "check-status-direct"
                    })
                }
            );

            // Update/Create Registration
            const { tournamentId, userId, teamName } = payReq;
            const registrations = await adminDatabases.listDocuments(
                DATABASE_ID,
                REGISTRATIONS_COLLECTION_ID,
                [
                    Query.equal("tournamentId", tournamentId),
                    Query.equal("userId", userId)
                ]
            );

            let regDoc = registrations.total > 0 ? registrations.documents[0] : null;

            if (regDoc) {
                // Update existing registration
                await adminDatabases.updateDocument(
                    DATABASE_ID,
                    REGISTRATIONS_COLLECTION_ID,
                    regDoc.$id,
                    { 
                        paymentStatus: "verified",
                        transactionId: utr
                    }
                );
            } else {
                // Create New Registration if missing
                await adminDatabases.createDocument(
                    DATABASE_ID,
                    REGISTRATIONS_COLLECTION_ID,
                    "unique()",
                    {
                        tournamentId,
                        userId,
                        teamName,
                        metadata: payReq.metadata,
                        registeredAt: new Date().toISOString(),
                        checkedIn: false,
                        transactionId: utr,
                        paymentStatus: "verified",
                    }
                );

                // Increment tournament registration count
                try {
                    const tournament = await adminDatabases.getDocument(DATABASE_ID, TOURNAMENTS_COLLECTION_ID, tournamentId);
                    await adminDatabases.updateDocument(DATABASE_ID, TOURNAMENTS_COLLECTION_ID, tournamentId, {
                        registeredTeams: (tournament.registeredTeams || 0) + 1
                    });
                } catch (countErr) {
                    console.warn("Failed to increment tournament count:", countErr);
                }
            }

            // Trigger Discord Notification
            try {
                const tournament = await adminDatabases.getDocument(DATABASE_ID, TOURNAMENTS_COLLECTION_ID, tournamentId);
                
                // Fetch user profile using document ID (userId)
                let userProfile = null;
                try {
                    userProfile = await adminDatabases.getDocument(DATABASE_ID, "users", userId);
                } catch (uErr) {
                    console.warn(`Could not find user profile for ID: ${userId}`);
                }

                const discordId = userProfile ? userProfile.discordId : null;
                const meta = typeof payReq.metadata === 'string' ? JSON.parse(payReq.metadata) : payReq.metadata;
                const registrantName = teamName || meta?.playerName || "A Player";

                await announceRegistrationApprovedAction(tournament.name, registrantName, utr, discordId);
            } catch (discordErr) {
                console.warn("Discord announcement failed during check-status:", discordErr);
            }
        } catch (dbErr) {
            console.error("Failed to complete registration in check-status:", dbErr);
        }
    }

    // Determine final status for UI
    let finalStatus = "PENDING";
    if (isSuccess) {
        finalStatus = "SUCCESS";
    } else if (statusTop === "ERROR" || statusTop === "FAILED" || txnStatus === "FAILED" || paymentStatusNested === "FAILED") {
        finalStatus = "FAILURE";
    }

    return NextResponse.json({
      success: true,
      status: finalStatus,
      message: data.message,
      utr: data.result?.utr || data.result?.txn_id
    });
  } catch (error) {
    console.error("IMB Check Status Error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to check status",
    }, { status: 500 });
  }
}
