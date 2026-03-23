import { db } from "./db";
import { agentTasks } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Cleaning up duplicate agent tasks...");
  
  // Find duplicates
  const allTasks = await db.select().from(agentTasks);
  
  const titleCounts = new Map<string, string[]>();
  for (const t of allTasks) {
    if (!titleCounts.has(t.title)) {
      titleCounts.set(t.title, []);
    }
    titleCounts.get(t.title)!.push(t.id);
  }

  let deleted = 0;
  for (const [title, ids] of titleCounts.entries()) {
    if (ids.length > 1) {
      // keep the first one (most recently updated or just first one)
      const toDelete = ids.slice(1);
      for (const id of toDelete) {
        await db.delete(agentTasks).where(eq(agentTasks.id, id));
        deleted++;
      }
    }
  }

  console.log(`Deleted ${deleted} duplicate tasks.`);
  process.exit(0);
}
main().catch(console.error);
