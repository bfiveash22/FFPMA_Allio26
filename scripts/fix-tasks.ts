import { db } from '../server/db';
import { agentTasks } from '@shared/schema';
import { eq, or, and, gte } from 'drizzle-orm';

async function main() {
  try {
    console.log("Fixing stuck tasks...");
    
    // Fix JURIS and MUSE stuck in_progress at 100%
    const stuck = await db.update(agentTasks)
      .set({ status: 'pending', progress: 0 })
      .where(and(
        eq(agentTasks.status, 'in_progress'),
        gte(agentTasks.progress, 100)
      ))
      .returning();
      
    console.log(`Reset ${stuck.length} tasks that were stuck at 100% in_progress.`);
    
    // Fix SYNTHESIS (and any other blocked tasks)
    const blocked = await db.update(agentTasks)
      .set({ status: 'pending', progress: 0 })
      .where(eq(agentTasks.status, 'blocked'))
      .returning();
      
    console.log(`Reset ${blocked.length} blocked tasks.`);
    
    console.log("Done.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}
main();
