"use server";

import {
  createPaymentOrder as createEkqrOrder,
  checkOrderStatus as checkEkqrStatus,
  generateClientTxnId,
  formatDateForEkqr,
} from "@/lib/upigateway";

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
 * Create a UPI payment order via ekQR API
 * This is a server action to keep the API key secure
 * 
 * @param {Object} params
 * @param {string} params.tournamentId
 * @param {string} params.tournamentName
 * @param {string} params.userId
 * @param {string} params.amount
 * @param {string} params.customerName
 * @param {string} params.customerEmail
 * @param {string} params.customerMobile
 * @param {string} params.teamName - For team tournaments
 * @param {Object} params.metadata - Additional registration data
 * @returns {Promise<{success: boolean, paymentUrl?: string, orderId?: string, clientTxnId?: string, error?: string}>}
 */
export async function createPaymentOrderAction({
  tournamentId,
  tournamentName,
  userId,
  amount,
  customerName,
  customerEmail,
  customerMobile,
  teamName = "",
  metadata = {},
}) {
  try {
    const clientTxnId = generateClientTxnId();
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL}/tournaments/${tournamentId}?payment=complete`;

    // Create order via ekQR API
    const orderResponse = await createEkqrOrder({
      clientTxnId,
      amount: String(amount),
      productInfo: `${tournamentName} - Entry Fee`,
      customerName: customerName || "Player",
      customerEmail: customerEmail || "player@vrivalsarena.com",
      customerMobile: customerMobile || "9999999999",
      redirectUrl,
      udf1: tournamentId.slice(0, 25), // Max 25 chars
      udf2: userId.slice(0, 25),
      udf3: "", // Can store additional data if needed
    });

    console.log("[createPaymentOrderAction] ekQR Response:", JSON.stringify(orderResponse, null, 2));

    // Store payment request in database
    const client = getAppwriteClient();
    const databases = new sdk.Databases(client);

    await databases.createDocument(
      DATABASE_ID,
      PAYMENT_REQUESTS_COLLECTION_ID,
      sdk.ID.unique(),
      {
        tournamentId,
        userId,
        teamName: teamName || "Player",
        metadata: JSON.stringify(metadata),
        requestedAt: new Date().toISOString(),
        paymentStatus: "pending",
        transactionId: clientTxnId,
        ekqrOrderId: String(orderResponse.order_id || ""),
        amount: String(amount),
      }
    );

    return {
      success: true,
      paymentUrl: orderResponse.payment_url,
      orderId: orderResponse.order_id,
      clientTxnId,
      // Enterprise plan features - deep links for UPI apps
      intentLinks: {
        upiLink: orderResponse.upi_intent?.upi_link,
        bhimLink: orderResponse.upi_intent?.bhim_link,
        gpayLink: orderResponse.upi_intent?.gpay_link,
        phonepeLink: orderResponse.upi_intent?.phonepe_link,
        paytmLink: orderResponse.upi_intent?.paytm_link,
      },
    };
  } catch (error) {
    console.error("[createPaymentOrderAction] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to create payment order",
    };
  }
}

/**
 * Check payment status via ekQR API
 * 
 * @param {string} clientTxnId - The transaction ID
 * @param {Date} [txnDate] - Transaction date (defaults to today)
 * @returns {Promise<{success: boolean, status?: string, data?: Object, error?: string}>}
 */
export async function checkPaymentStatusAction(clientTxnId, txnDate = new Date()) {
  try {
    const formattedDate = formatDateForEkqr(txnDate);
    const result = await checkEkqrStatus(clientTxnId, formattedDate);

    // Log the full response for debugging
    console.log("[checkPaymentStatusAction] Full response:", JSON.stringify(result, null, 2));

    // Status could be in different locations depending on API response
    const status = result.data?.status || result.status || "unknown";

    console.log("[checkPaymentStatusAction] Extracted status:", status);

    return {
      success: true,
      status: status.toLowerCase(), // Normalize to lowercase
      data: result.data || result,
    };
  } catch (error) {
    console.error("[checkPaymentStatusAction] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to check payment status",
    };
  }
}

/**
 * Update payment request status in Appwrite
 * Used to mark as expired or failed
 */
/**
 * Update payment request status in Appwrite
 * Used to mark as expired or failed
 * Robust implementation: Tries 'failed', falls back to 'rejected' if schema restricts it
 */
export async function updatePaymentStatusAction(clientTxnId, targetStatus) {
  console.log(`[updatePaymentStatusAction] Called for txn: ${clientTxnId} with target status: ${targetStatus}`);
  
  const client = getAppwriteClient();
  const databases = new sdk.Databases(client);
  const sdkQueries = sdk.Query;

  try {
    // 1. Find the document
    console.log(`[updatePaymentStatusAction] Searching for txn: ${clientTxnId}`);
    const response = await databases.listDocuments(
      DATABASE_ID,
      PAYMENT_REQUESTS_COLLECTION_ID,
      [sdkQueries.equal("transactionId", clientTxnId)]
    );

    if (response.documents.length === 0) {
      console.warn(`[updatePaymentStatusAction] Transaction not found: ${clientTxnId}`);
      return { success: false, error: "Payment request not found" };
    }

    const docId = response.documents[0].$id;
    console.log(`[updatePaymentStatusAction] Found doc: ${docId}`);

    // 2. Try updating with the requested status (e.g., 'failed')
    try {
      await databases.updateDocument(
        DATABASE_ID,
        PAYMENT_REQUESTS_COLLECTION_ID,
        docId,
        { paymentStatus: targetStatus }
      );
      console.log(`[updatePaymentStatusAction] Successfully updated to '${targetStatus}'`);
      return { success: true, status: targetStatus };
    } catch (updateError) {
      // 3. Fallback: If schema validation fails, try 'rejected'
      if (updateError.type === 'document_invalid_structure' && targetStatus !== 'rejected') {
        console.warn(`[updatePaymentStatusAction] Schema rejected '${targetStatus}'. Retrying with 'rejected'...`);
        await databases.updateDocument(
          DATABASE_ID,
          PAYMENT_REQUESTS_COLLECTION_ID,
          docId,
          { paymentStatus: 'rejected' }
        );
        console.log(`[updatePaymentStatusAction] Fallback update to 'rejected' successful`);
        return { success: true, status: 'rejected' };
      }
      throw updateError; // Rethrow other errors
    }
  } catch (error) {
    console.error("[updatePaymentStatusAction] Final Error:", error);
    return { success: false, error: error.message };
  }
}
