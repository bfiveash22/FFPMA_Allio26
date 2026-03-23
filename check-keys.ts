import 'dotenv/config';
import { db } from './server/db';
import { apiKeys } from '@shared/schema';

async function check() {
  try {
    const keys = await db.select().from(apiKeys);
    console.log('Total keys in DB:', keys.length);
    for (const key of keys) {
      console.log(`Key ID: ${key.id}`);
      console.log(`Key Name: ${key.name}`);
      console.log(`Hash in DB: ${key.keyHash}`);
      console.log(`Active: ${key.isActive}`);
      console.log('---');
    }
  } catch(e: any) { console.error('Error:', e.message); }
  process.exit();
}
check();
