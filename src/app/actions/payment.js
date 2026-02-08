"use server";

import {
  createPaymentOrder,
  checkOrderStatus,
  generateClientTxnId,
} from "@/lib/edgegateway";

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
 * Create a UPI payment order via EdgeGateway
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

    // Create order via EdgeGateway API
    const orderData = await createPaymentOrder({
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
        ekqrOrderId: String(orderData.order_id || ""),
        amount: String(amount),
      }
    );

    return {
      success: true,
      paymentUrl: orderData.payment_url,
      orderId: orderData.order_id,
      clientTxnId,
      // EdgeGateway provides deep links directly
      intentLinks: {
        upiLink: orderData.upi_intent?.bhim_link || orderData.payment_url, // Fallback for QR generation
        bhimLink: orderData.upi_intent?.bhim_link,
        gpayLink: orderData.upi_intent?.gpay_link,
        phonepeLink: orderData.upi_intent?.phonepe_link,
        paytmLink: orderData.upi_intent?.paytm_link,
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
 * Check payment status via EdgeGateway
 * 
 * @param {string} clientTxnId - The transaction ID
 * @returns {Promise<{success: boolean, status?: string, data?: Object, error?: string}>}
 */
export async function checkPaymentStatusAction(clientTxnId) {
  try {
    const result = await checkOrderStatus(clientTxnId);

    // EdgeGateway Response Analysis:
    // Root 'status': "success" means the API call worked.
    // Transaction status is inside 'data'.
    const txnStatus = result.data?.status || result.data?.order_status || "pending";

    return {
      success: true,
      status: txnStatus.toLowerCase(),
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
  const client = getAppwriteClient();
  const databases = new sdk.Databases(client);
  const sdkQueries = sdk.Query;

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PAYMENT_REQUESTS_COLLECTION_ID,
      [sdkQueries.equal("transactionId", clientTxnId)]
    );

    if (response.documents.length === 0) {
      return { success: false, error: "Payment request not found" };
    }

    const docId = response.documents[0].$id;

    try {
      await databases.updateDocument(
        DATABASE_ID,
        PAYMENT_REQUESTS_COLLECTION_ID,
        docId,
        { paymentStatus: targetStatus }
      );
      return { success: true, status: targetStatus };
    } catch (updateError) {
      if (updateError.type === 'document_invalid_structure' && targetStatus !== 'rejected') {
        await databases.updateDocument(
          DATABASE_ID,
          PAYMENT_REQUESTS_COLLECTION_ID,
          docId,
          { paymentStatus: 'rejected' }
        );
        return { success: true, status: 'rejected' };
      }
      throw updateError;
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Submit UTR/Transaction ID manually for a payment request
 */
export async function submitUtrAction(clientTxnId, utr) {
  const client = getAppwriteClient();
  const databases = new sdk.Databases(client);
  const sdkQueries = sdk.Query;

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PAYMENT_REQUESTS_COLLECTION_ID,
      [sdkQueries.equal("transactionId", clientTxnId)]
    );

    if (response.documents.length === 0) {
      return { success: false, error: "Payment request not found" };
    }

    const docId = response.documents[0].$id;

    await databases.updateDocument(
      DATABASE_ID,
      PAYMENT_REQUESTS_COLLECTION_ID,
      docId,
      { 
        upiTxnId: utr,
        metadata: JSON.stringify({ 
          ...JSON.parse(response.documents[0].metadata || "{}"),
          manuallySubmittedUtr: utr,
          manuallySubmittedAt: new Date().toISOString()
        })
      }
    );

    return { success: true };
  } catch (error) {
    console.error("[submitUtrAction] Error:", error);
    return { success: false, error: error.message };
  }
}
