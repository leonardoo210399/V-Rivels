/**
 * EdgeGateway API Client
 * Documentation: https://docs.edgegateway.in/introduction
 */

const API_URL = process.env.EDGEGATEWAY_API_URL || "https://merchant.edgegateway.in/api";
const API_KEY = process.env.EDGEGATEWAY_API_KEY;

/**
 * Create a payment order via EdgeGateway
 * @param {Object} params - Order parameters
 * @param {string} params.clientTxnId - Your unique transaction ID
 * @param {string} params.amount - Amount in INR
 * @param {string} params.productInfo - Product/tournament name
 * @param {string} params.customerName - Customer name
 * @param {string} params.customerEmail - Customer email
 * @param {string} params.customerMobile - Customer mobile number (required)
 * @param {string} params.redirectUrl - URL to redirect after payment
 * @param {string} [params.udf1] - User defined field 1 (tournamentId)
 * @param {string} [params.udf2] - User defined field 2 (userId)
 * @param {string} [params.udf3] - User defined field 3 (extra data)
 * @returns {Promise<{payment_url: string, order_id: string, upi_intent: {bhim_link: string, gpay_link: string, ...}}>}
 */
export async function createPaymentOrder({
  clientTxnId,
  amount,
  productInfo,
  customerName,
  customerEmail,
  customerMobile,
  redirectUrl,
  udf1 = "",
  udf2 = "",
  udf3 = "",
}) {
  if (!API_KEY) {
    throw new Error("EDGEGATEWAY_API_KEY is not configured");
  }

  const response = await fetch(`${API_URL}/create_order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: API_KEY,
      client_txn_id: clientTxnId,
      amount: String(amount),
      p_info: productInfo,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_mobile: customerMobile,
      redirect_url: redirectUrl,
      udf1: udf1,
      udf2: udf2,
      udf3: udf3,
    }),
  });

  const result = await response.json();

  if (result.status !== "success" && result.status !== true) {
    throw new Error(result.msg || result.message || "Failed to create payment order");
  }

  return result.data;
}

/**
 * Check order status via EdgeGateway
 * @param {string} clientTxnId - The transaction ID
 * @returns {Promise<{status: string, ...}>}
 */
export async function checkOrderStatus(clientTxnId) {
  if (!API_KEY) {
    throw new Error("EDGEGATEWAY_API_KEY is not configured");
  }

  const response = await fetch(`${API_URL}/check_order_status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: API_KEY,
      client_txn_id: clientTxnId,
    }),
  });

  const result = await response.json();
  
  // Normalize response
  // EdgeGateway usually returns { status: "success", data: { ... } } or similar
  return result;
}

/**
 * Generate a unique client transaction ID
 * Format: VRA-{timestamp}-{random}
 * @returns {string}
 */
export function generateClientTxnId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `VRA-${timestamp}-${random}`.toUpperCase().slice(0, 30);
}
