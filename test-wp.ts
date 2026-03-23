import { checkWooCommerceConnection } from './server/services/woocommerce';

async function runTest() {
  try {
    console.log("Checking WooCommerce Sync Connection...");
    const status = await checkWooCommerceConnection();
    console.log("Status:", JSON.stringify(status, null, 2));
  } catch (error: any) {
    console.error("Failed:", error.message);
  }
  process.exit(0);
}

runTest();
