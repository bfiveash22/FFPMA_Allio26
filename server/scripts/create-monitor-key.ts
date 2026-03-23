import { db } from "../db";
import { apiKeys } from "../../shared/schema";
import crypto from "crypto";

async function main() {
  try {
    // Generate raw key
    const rawKey = crypto.randomBytes(32).toString('hex');
    const fullKey = `allio_${rawKey}`;
    
    // Create hash
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 8); // Store first 8 chars for identification
    
    console.log("=== NEW API KEY GENERATED ===");
    console.log("Please copy this key immediately, it will not be shown again:");
    console.log(fullKey);
    console.log("===============================");
    
    await db.insert(apiKeys).values({
      name: "OpenClaw Network Monitor",
      keyPrefix,
      keyHash,
      permissions: ["read", "write"],
      createdBy: "system"
    });
    
    console.log("API Key successfully inserted into database.");
    process.exit(0);
  } catch (error) {
    console.error("Error creating API key:", error);
    process.exit(1);
  }
}

main();
