import axios from 'axios';

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('🧪 Starting E2E Webhook Tests...');

  // Test 1: WooCommerce
  console.log('\n[Test 1] Simulating WooCommerce Order Completion...');
  try {
    const wooRes = await axios.post(`${BASE_URL}/api/woocommerce/webhooks/orders`, {
      id: 99999,
      status: 'completed',
      billing: { email: 'testing@allioffpma.com' },
      line_items: [{ name: 'Test Product', quantity: 1, total: "100.00" }]
    });
    console.log('✅ WooCommerce Webhook Response:', wooRes.status, wooRes.data);
  } catch (error: any) {
    console.error('❌ WooCommerce Webhook Error:', error.response?.data || error.message);
  }

  // Test 2: Stripe
  console.log('\n[Test 2] Simulating Stripe Checkout Session...');
  try {
    const stripeRes = await axios.post(`${BASE_URL}/api/stripe/webhooks`, {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_mock123456789',
          metadata: { userId: '1' } // Using user id 1 mapping
        }
      }
    }, {
      headers: { 
        'stripe-signature': 'mock_signature_for_local_testing' 
      }
    });

    console.log('✅ Stripe Webhook Response:', stripeRes.status, stripeRes.data);
  } catch (error: any) {
    if (error.response?.status === 200 && error.response?.data.includes('Dev Mode')) {
      console.log('✅ Stripe Webhook Response (Dev Mode Bypassed):', error.response.status, error.response.data);
    } else {
      console.error('❌ Stripe Webhook Error:', error.response?.data || error.message);
    }
  }

  // Test 3: SignNow 
  console.log('\n[Test 3] Simulating SignNow Document Completion...');
  try {
    const snRes = await axios.post(`${BASE_URL}/api/signnow/webhook`, {
      meta: { event: 'document.complete' },
      content: { id: 'mock_document_signature_123' },
      document_id: 'mock_document_signature_123'
    });
    console.log('✅ SignNow Webhook Response:', snRes.status, snRes.data);
  } catch (error: any) {
    console.error('❌ SignNow Webhook Error:', error.response?.data || error.message);
  }

  console.log('\n🎉 E2E Tests Finished.');
}

runTests().catch(console.error);
