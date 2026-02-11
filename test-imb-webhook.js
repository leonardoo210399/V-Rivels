const fetch = require('node-fetch');

async function testWebhook() {
  const webhookUrl = 'http://localhost:3000/api/webhook/imb';
  const orderId = 'REPLACE_WITH_ACTUAL_DOC_ID'; // You can get this from creating a test order

  const formData = new URLSearchParams();
  formData.append('status', 'COMPLETED');
  formData.append('order_id', orderId);
  formData.append('result', JSON.stringify({
    utr: '123456789012',
    txnStatus: 'SUCCESS',
    txnAmount: '1.00',
    txnDate: '2026-02-10 16:00:00',
    bank_txn_id: 'BANK123'
  }));

  console.log('Sending mock webhook...');
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  });

  const data = await response.json();
  console.log('Response:', data);
}

// testWebhook();
