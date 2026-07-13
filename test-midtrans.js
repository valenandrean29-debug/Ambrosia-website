const fs = require('fs');
const path = require('path');

// Read Xendit key from .env.local
const envPath = path.join(__dirname, '.env.local');
let XENDIT_SECRET_KEY = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^XENDIT_SECRET_KEY\s*=\s*(.+)$/m);
  if (match) {
    XENDIT_SECRET_KEY = match[1].trim();
  }
} catch (e) {
  console.error('Error reading .env.local:', e.message);
}

async function testXendit() {
  console.log('=== Xendit Connection Test ===');
  console.log('Secret Key:', XENDIT_SECRET_KEY.substring(0, 25) + '...');
  console.log('');

  // Xendit uses Basic Auth with secret key as username and empty password
  const authHeader = 'Basic ' + Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

  try {
    // Create a test invoice
    const response = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: 'TEST-' + Date.now(),
        amount: 10000,
        description: 'Xendit Connection Test',
        currency: 'IDR',
      }),
    });

    const data = await response.json();
    console.log('Status Code:', response.status);

    if (response.ok) {
      console.log('');
      console.log('✅ SUCCESS! Xendit is connected!');
      console.log('Invoice ID:', data.id);
      console.log('Invoice URL:', data.invoice_url);
      console.log('Status:', data.status);
    } else {
      console.log('');
      console.log('❌ FAILED!');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Fetch Error:', err.message);
  }
}

testXendit();
