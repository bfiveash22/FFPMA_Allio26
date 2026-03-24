import { db } from "../db";
import { agentTasks } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function clean() {
  console.log("Fetching all tasks...");
  const tasks = await db.select().from(agentTasks);
  
  const toDelete = new Set<string>();
  const seen = new Set<string>();
  
  for (const task of tasks) {
    if (task.status === 'pending' || task.status === 'in_progress') {
       const key = `${task.agentId}-${task.title}-${task.parentTaskId || ''}`;
       if (seen.has(key)) {
         toDelete.add(task.id);
       } else {
         seen.add(key);
       }
    }
  }
  
  if (toDelete.size > 0) {
    console.log(`Found ${toDelete.size} duplicate tasks to delete.`);
    for (const id of Array.from(toDelete)) {
      await db.delete(agentTasks).where(eq(agentTasks.id, id));
    }
    console.log("Cleanup complete.");
  } else {
    console.log("No duplicates found.");
  }
  process.exit(0);
}

clean().catch(console.error);
