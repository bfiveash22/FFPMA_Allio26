import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { agentTasks } from './shared/schema';
import { eq, and, desc } from 'drizzle-orm';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  
  console.log("Fetching all pending and in_progress cross-division tasks...");
  const tasks = await db.select().from(agentTasks)
    .where(eq(agentTasks.status, 'pending'))
    .orderBy(desc(agentTasks.createdAt));

  const seenKeys = new Set<string>();
  let deletedCount = 0;

  for (const task of tasks) {
    if (task.description?.includes("CROSS-DIVISION SUPPORT REQUEST")) {
      const key = `${task.agentId}_${task.parentTaskId}`;
      if (seenKeys.has(key)) {
        // This is a duplicate!
        console.log(`Deleting duplicate task: ${task.id} (Agent: ${task.agentId}, Parent: ${task.parentTaskId})`);
        await db.delete(agentTasks).where(eq(agentTasks.id, task.id));
        deletedCount++;
      } else {
        seenKeys.add(key);
      }
    }
  }

  console.log(`Cleanup complete. Deleted ${deletedCount} duplicate tasks.`);
  process.exit(0);
}

main().catch(console.error);
