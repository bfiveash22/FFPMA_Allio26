import crypto from 'crypto';

async function generateOpenClawApiKey() {
  const { db } = await import('../db');
  const { apiKeys } = await import('../../shared/schema');
  const { eq } = await import('drizzle-orm');

  const name = 'OPENCLAW_Agent_4';

  const existing = await db.select().from(apiKeys).where(eq(apiKeys.name, name));
  if (existing.length > 0) {
    console.log(`\n[KEY EXISTS] An API key for "${name}" already exists.`);
    console.log(`Key prefix: ${existing[0].keyPrefix}`);
    console.log(`Active: ${existing[0].isActive}`);
    console.log(`\nNOTE: The raw key is not recoverable. Deactivate and re-run to issue a new key.\n`);
    process.exit(0);
  }

  const rawKey = `allio_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.substring(0, 12);

  const [created] = await db.insert(apiKeys).values({
    name,
    keyPrefix,
    keyHash,
    permissions: ['read', 'write'],
    createdBy: 'system-script',
    isActive: true,
  }).returning();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('              OPENCLAW API KEY GENERATED                      ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Name:        ${created.name}`);
  console.log(`ID:          ${created.id}`);
  console.log(`Permissions: read, write`);
  console.log(`Created:     ${created.createdAt}`);
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`RAW KEY (deliver to Agent 4 — not stored, one-time display):`);
  console.log(`\n  ${rawKey}\n`);
  console.log('Usage: Add to Authorization header as Bearer token:');
  console.log(`  Authorization: Bearer ${rawKey}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  process.exit(0);
}

generateOpenClawApiKey().catch((err) => {
  console.error('[ERROR] Failed to generate API key:', err.message);
  process.exit(1);
});
