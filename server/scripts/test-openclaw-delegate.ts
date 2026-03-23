import { delegateToOpenClaw } from '../services/openclaw-delegate';

async function main() {
  console.log('Testing openclaw delegation...');
  // Passing a default target so the agent command doesn't fail
  const result = await delegateToOpenClaw('Message the user the word "test 123" on WhatsApp', '+194059701117');
  console.log('Result:', result);
  process.exit(result.success ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
