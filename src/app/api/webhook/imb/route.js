import { NextResponse } from "next/server";

const sdk = require("node-appwrite");

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const PAYMENT_REQUESTS_COLLECTION_ID = "payment_requests";

function getAppwriteClient() {
  const client = new sdk.Client();
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  return client;
}

/**
 * Webhook handler for IMB Payment Gateway
 * 
 * Payload (example):
 * {
 *   "status": "SUCCESS",
 *   "order_id": "TXN007...",
 *   "message": "Transaction Successfully",
 *   "result": {
 *      "txnStatus": "COMPLETED",
 *      "orderId": "TXN007...",
 *      "amount": 100,
 *      "utr": 4356...,
 *      "customer_mobile": 98765...,
 *      "remark1": "email",
 *      "remark2": "tournament info",
 *   }
 * }
 */
export async function POST(request) {
  try {
    const rawBody = await request.text();
    let payload;
    
    // IMB might send as JSON or Form Encoded.
    // The example in docs shows JSON structure but often webhooks are form-encoded.
    // We'll try to parse as JSON first.
    try {
        payload = JSON.parse(rawBody);
    } catch (e) {
        // If JSON parse fails, try to parse as query params (if form encoded)
        const params = new URLSearchParams(rawBody);
        payload = Object.fromEntries(params.entries());
    }

    console.log("[IMB Webhook] Received:", payload);

    const status = payload.status; 
    const orderId = payload.order_id || payload.orderId;
    
    // The inner result object might be present
    const resultData = payload.result || {};
    const txnStatus = resultData.txnStatus || payload.txnStatus; // Check both places just in case
    const utr = resultData.utr || payload.utr;
    
    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing order_id" }, { status: 400 });
    }

    const client = getAppwriteClient();
    const databases = new sdk.Databases(client);

    // Find payment request
    const paymentRequests = await databases.listDocuments(
      DATABASE_ID,
      PAYMENT_REQUESTS_COLLECTION_ID,
      [sdk.Query.equal("transactionId", orderId)]
    );

    if (paymentRequests.total === 0) {
      console.error("[IMB Webhook] Payment request not found:", orderId);
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    const paymentRequest = paymentRequests.documents[0];

    if (paymentRequest.paymentStatus === "verified") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Check for success
    // Status can be "SUCCESS" or "COMPLETED" or true (boolean/string)
    const isSuccess = 
        String(status).toUpperCase() === "SUCCESS" || 
        String(status).toUpperCase() === "COMPLETED" ||
        String(txnStatus).toUpperCase() === "SUCCESS" || 
        String(txnStatus).toUpperCase() === "COMPLETED";

    if (isSuccess) {
      const { processSuccessfulPayment } = await import("@/lib/payment_processor");
      
      const result = await processSuccessfulPayment(paymentRequest, {
        upiTxnId: utr,
        customerVpa: "" // IMB doesn't seem to return VPA in webhook
      });

      if (!result.success) {
        throw new Error(result.error);
      }
    } else {
       await databases.updateDocument(
        DATABASE_ID,
        PAYMENT_REQUESTS_COLLECTION_ID,
        paymentRequest.$id,
        {
          paymentStatus: "rejected",
          rejectionReason: `Payment failed via IMB. Status: ${status} / ${txnStatus}`,
        }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[IMB Webhook] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "IMB Webhook Active" });
}
