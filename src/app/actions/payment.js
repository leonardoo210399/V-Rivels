"use server";

import {
  createPaymentOrder,
  checkOrderStatus,
  generateClientTxnId,
} from "@/lib/imb";

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
 * Create a UPI payment order via IMB Payment Gateway
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

    // Create order via IMB Payment Gateway API
    const orderData = await createPaymentOrder({
      orderId: clientTxnId,
      amount: String(amount),
      customerMobile: customerMobile || "9999999999",
      redirectUrl,
      remark1: customerEmail || "player@vrivalsarena.com", // Storing email in remark1
      remark2: `${tournamentName} | ${userId}`, // Storing tournament & user info in remark2
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
        ekqrOrderId: String(orderData.orderId || ""), // Retaining field name for compatibility, storing IMB orderId
        amount: String(amount),
      }
    );

    return {
      success: true,
      paymentUrl: orderData.payment_url,
      orderId: orderData.orderId,
      clientTxnId,
      // IMB provides direct links at the root of the result object
      intentLinks: {
        upiLink: orderData.bhim_link || orderData.payment_url, // Bhim link is standard UPI string
        bhimLink: orderData.bhim_link,
        paytmLink: orderData.paytm_link,
        checkLink: orderData.check_link,
        // Mapping gpay/phonepe if they become available or we construct them from bhim_link
        gpayLink: null, 
        phonepeLink: null,
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
 * Check payment status via IMB Payment Gateway
 * 
 * @param {string} clientTxnId - The transaction ID
 * @returns {Promise<{success: boolean, status?: string, data?: Object, error?: string}>}
 */
export async function checkPaymentStatusAction(clientTxnId) {
  try {
    const result = await checkOrderStatus(clientTxnId);

    // IMB Response Analysis:
    // { status: "COMPLETED", message: "...", result: { txnStatus: "COMPLETED", status: "SUCCESS", ... } }
    const txnData = result.result || {};
    const mainStatus = result.status; // "COMPLETED" or "PENDING" or "FAILED"
    const innerStatus = txnData.status || txnData.txnStatus; // "SUCCESS" inside result

    const isSuccess = (mainStatus === "COMPLETED" && innerStatus === "SUCCESS") || 
                      (mainStatus === "true" && innerStatus === "SUCCESS");

    const client = getAppwriteClient();
    const databases = new sdk.Databases(client);

    // Locate the payment request in our DB
    const paymentRequests = await databases.listDocuments(
      DATABASE_ID,
      PAYMENT_REQUESTS_COLLECTION_ID,
      [sdk.Query.equal("transactionId", clientTxnId)]
    );

    const paymentRequest = paymentRequests.documents[0];

    if (isSuccess) {
      if (paymentRequest) {
        if (paymentRequest.paymentStatus !== "verified") {
          console.log(`[checkPaymentStatusAction] Payment ${clientTxnId} confirmed at gateway but pending in DB. Processing...`);
          
          const { processSuccessfulPayment } = await import("@/lib/payment_processor");
          
          await processSuccessfulPayment(paymentRequest, {
            upiTxnId: txnData.utr || "",
            customerVpa: "" // IMB might not return VPA in check status, that's okay
          });
        }
      }
    } else if (paymentRequest) {
      const metadata = paymentRequest.metadata ? JSON.parse(paymentRequest.metadata) : {};
      
      if (paymentRequest.upiTxnId || metadata.manuallySubmittedUtr) {
        return {
          success: true,
          status: "manual_verification",
          data: { ...txnData, message: "Under manual verification" }
        };
      }
    }

    return {
      success: true,
      status: isSuccess ? "success" : "pending",
      data: result,
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
      
      const { revalidatePath } = await import("next/cache");
      revalidatePath(`/tournaments/[id]`, "page"); 
      
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

    const paymentRequest = response.documents[0];
    const docId = paymentRequest.$id;

    // EDGE CASE: If already verified/completed, do NOT allow overwrite
    if (["verified", "completed", "success"].includes(paymentRequest.paymentStatus)) {
      return { success: false, error: "Payment is already verified. No need to submit UTR." };
    }
    
    // EDGE CASE: If same UTR is already submitted for THIS request, return success (idempotent)
    const currentMeta = paymentRequest.metadata ? JSON.parse(paymentRequest.metadata || "{}") : {};
    if (currentMeta.manuallySubmittedUtr === utr) {
       return { success: true };
    }

    await databases.updateDocument(
      DATABASE_ID,
      PAYMENT_REQUESTS_COLLECTION_ID,
      docId,
      { 
        upiTxnId: utr,
        paymentStatus: "pending", // Reset to pending so it's not "failed"
        metadata: JSON.stringify({ 
          ...currentMeta,
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
