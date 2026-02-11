const fetch = require('node-fetch');

async function testCheckStatus() {
  const url = 'http://localhost:3000/api/payments/check-status';
  const orderId = 'REPLACE_WITH_ACTUAL_APPWRITE_DOC_ID'; 

  console.log(`Checking status for order: ${orderId}...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId })
    });

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Status check completed successfully');
      console.log(`Mapped Status: ${data.status}`);
      if (data.utr) console.log(`UTR: ${data.utr}`);
    } else {
      console.log('❌ Status check failed');
    }
  } catch (err) {
    console.error('Error connecting to API:', err.message);
  }
}

// To run: node test-check-status.js
testCheckStatus();
