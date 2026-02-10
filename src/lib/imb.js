/**
 * IMB Payment Gateway API Client
 * Documentation: https://developer.imb.org.in/Docs/index
 */

const rawApiUrl = process.env.IMB_API_URL || "https://secure-stage.imb.org.in";
const API_URL = rawApiUrl.replace(/\/$/, ""); // Remove trailing slash if present
const USER_TOKEN = process.env.IMB_USER_TOKEN;

/**
 * Create a payment order via IMB Payment Gateway
 * @param {Object} params - Order parameters
 * @param {string} params.orderId - Unique order ID (client_txn_id)
 * @param {string} params.amount - Amount in INR
 * @param {string} params.customerMobile - Customer mobile number (required)
 * @param {string} params.redirectUrl - URL to redirect after payment
 * @param {string} [params.remark1] - Optional remark 1 (e.g. email)
 * @param {string} [params.remark2] - Optional remark 2 (e.g. tournament info)
 * @returns {Promise<{payment_url: string, orderId: string, bhim_link: string, paytm_link: string, check_link: string}>}
 */
export async function createPaymentOrder({
  orderId,
  amount,
  customerMobile,
  redirectUrl,
  remark1 = "",
  remark2 = "",
}) {
  // Fallback to hardcoded values if env var fails (Temporary Fix)
  const USER_TOKEN = process.env.IMB_USER_TOKEN || "b3e9efe20b679a889570fee4d68c0bf2";
  
  if (!USER_TOKEN) {
    throw new Error("IMB_USER_TOKEN is not configured");
  }

  // IMB expects form-encoded payload for some endpoints.
  const payload = new URLSearchParams({
    user_token: USER_TOKEN,
    order_id: orderId,
    amount: String(amount),
    customer_mobile: customerMobile,
    redirect_url: redirectUrl,
    remark1: remark1,
    remark2: remark2,
  });

  console.log("[IMB] Creating order at:", `${API_URL}/api/create-order`);
  
  let response;
  try {
      response = await fetch(`${API_URL}/api/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (compatible; ValolantBot/1.0)",
        },
        body: payload,
      });
  } catch (fetchError) {
      console.error("[IMB] Fetch Error:", fetchError);
      throw new Error(`Network Error: request to IMB failed. ${fetchError.message}`);
  }

  const result = await response.json();

  if (result.status !== true && result.status !== "true") {
      // Log the error for debugging but don't expose full details if sensitive
     console.error("[IMB] Create Order Failed:", result);
    throw new Error(result.message || "Failed to create payment order");
  }

  return result.result;
}

/**
 * Check order status via IMB Payment Gateway
 * @param {string} orderId - The order ID
 * @returns {Promise<{status: string, ...}>}
 */
export async function checkOrderStatus(orderId) {
  if (!USER_TOKEN) {
    throw new Error("IMB_USER_TOKEN is not configured");
  }

  const payload = new URLSearchParams({
    user_token: USER_TOKEN,
    order_id: orderId,
  });

  const response = await fetch(`${API_URL}/api/check-order-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
  });

  const result = await response.json();
  
  return result;
}

/**
 * Generate a unique client transaction ID
 * @returns {string}
 */
export function generateClientTxnId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `VRA-${timestamp}-${random}`.toUpperCase().slice(0, 30);
}
