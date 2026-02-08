/**
 * UPI Gateway (ekQR) API Client
 * Documentation: https://merchant.upigateway.com/user/api_docs
 */

const API_URL = process.env.UPIGATEWAY_API_URL || "https://api.ekqr.in/api";
const API_KEY = process.env.UPIGATEWAY_API_KEY;

/**
 * Create a payment order
 * @param {Object} params - Order parameters
 * @param {string} params.clientTxnId - Your unique transaction ID (max 30 chars)
 * @param {string} params.amount - Amount in INR (e.g., "100")
 * @param {string} params.productInfo - Product/tournament name
 * @param {string} params.customerName - Customer name
 * @param {string} params.customerEmail - Customer email
 * @param {string} params.customerMobile - Customer mobile number
 * @param {string} params.redirectUrl - URL to redirect after payment
 * @param {string} [params.udf1] - User defined field 1 (max 25 chars) - tournamentId
 * @param {string} [params.udf2] - User defined field 2 (max 25 chars) - userId
 * @param {string} [params.udf3] - User defined field 3 (max 25 chars) - extra data
 * @returns {Promise<{status: boolean, order_id: string, payment_url: string, ...}>}
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
    throw new Error("UPIGATEWAY_API_KEY is not configured");
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

  if (!result.status) {
    throw new Error(result.msg || "Failed to create payment order");
  }

  // Return the data object directly (contains order_id, payment_url, upi_intent)
  return result.data;
}

/**
 * Check order status
 * @param {string} clientTxnId - The transaction ID used during order creation
 * @param {string} txnDate - Transaction date in DD-MM-YYYY format
 * @returns {Promise<{status: boolean, data: Object}>}
 */
export async function checkOrderStatus(clientTxnId, txnDate) {
  if (!API_KEY) {
    throw new Error("UPIGATEWAY_API_KEY is not configured");
  }

  const response = await fetch(`${API_URL}/check_order_status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: API_KEY,
      client_txn_id: clientTxnId,
      txn_date: txnDate,
    }),
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.msg || "Failed to check order status");
  }

  return data;
}

/**
 * Format date to DD-MM-YYYY for ekQR API
 * @param {Date} date
 * @returns {string}
 */
export function formatDateForEkqr(date = new Date()) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
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
