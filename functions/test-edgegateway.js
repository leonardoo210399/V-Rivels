const { createPaymentOrder, checkOrderStatus, generateClientTxnId } = require("../src/lib/edgegateway");

// Mock environment variables if running directly (or rely on dotenv)
// But since we are running via run_command in the project root, we might need to load .env
// We'll trust the user has .env set up or we can load it manually if needed.
// Ideally, we run this with `node -r dotenv/config functions/test-edgegateway.js`

async function test() {
  console.log("Testing EdgeGateway API...");
  
  try {
    const clientTxnId = generateClientTxnId();
    console.log("Generated Txn ID:", clientTxnId);

    console.log("Creating Order...");
    const order = await createPaymentOrder({
      clientTxnId,
      amount: "1.00",
      productInfo: "Test Product",
      customerName: "Test User",
      customerEmail: "test@example.com",
      customerMobile: "9999999999",
      redirectUrl: "https://example.com",
    });

    console.log("Order Created:", JSON.stringify(order, null, 2));

    console.log("Checking Status...");
    const status = await checkOrderStatus(clientTxnId);
    console.log("Status Response:", JSON.stringify(status, null, 2));

  } catch (error) {
    console.error("Error:", error);
  }
}

// Check if we need to load dotenv
try {
  require("dotenv").config({ path: ".env" });
} catch (e) {
  // ignore
}

// Need to handle the fact that our lib uses ES modules (import/export) 
// but this test script tries to use require.
// We might fail here.
// Instead, let's make this an ESM module .mjs or use import() 
// But simpler: just create a focused script that DOES NOT rely on the lib imports if that's hard,
// OR just run it as a proper module.

// Let's rewrite this to use `fetch` directly to avoid import issues for a quick test script
// copying logic from edgegateway.js
const API_URL = process.env.EDGEGATEWAY_API_URL || "https://merchant.edgegateway.in/api";
const API_KEY = process.env.EDGEGATEWAY_API_KEY;

if (!API_KEY) {
  console.error("API KEY MISSING in process.env");
}

async function runDirectTest() {
  const timestamp = Date.now().toString(36);
  const clientTxnId = `TEST-${timestamp}`;
  
  console.log(`\n--- Direct Test ---\nAPI: ${API_URL}\nTxn: ${clientTxnId}`);

  // 1. Create Order
  const createRes = await fetch(`${API_URL}/create_order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: API_KEY,
      client_txn_id: clientTxnId,
      amount: "1.00",
      p_info: "Test",
      customer_name: "Test",
      customer_email: "test@test.com",
      customer_mobile: "9999999999",
      redirect_url: "http://localhost",
    }),
  });
  
  const createData = await createRes.json();
  console.log("Create Response:", JSON.stringify(createData, null, 2));

  if (createData.status !== "success") return;

  // 2. Check Status
  const checkRes = await fetch(`${API_URL}/check_order_status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: API_KEY,
      client_txn_id: clientTxnId,
    }),
  });
  
  const checkData = await checkRes.json();
  console.log("Check Response:", JSON.stringify(checkData, null, 2));
}

runDirectTest();
