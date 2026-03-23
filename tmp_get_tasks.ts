import { db } from './server/db';
import { agentTasks } from './shared/schema';
import { desc } from 'drizzle-orm';

async function main() {
  const allTasks = await db.select().from(agentTasks).orderBy(desc(agentTasks.updatedAt)).limit(500);
  
  const blocked = allTasks.filter(t => t.status === 'blocked');
  console.log("\n--- BLOCKED TASKS ---");
  console.log(blocked.map(t => ({ id: t.id, agentId: t.agentId, title: t.title, status: t.status, progress: t.progress, description: t.description?.substring(0, 50) })));
  
  const stuck = allTasks.filter(t => t.progress === 100 && t.status === 'in_progress');
  console.log("\n--- STUCK AT 100% IN_PROGRESS ---");
  console.log(stuck.map(t => ({ id: t.id, agentId: t.agentId, title: t.title, status: t.status, progress: t.progress })));

  const stuckOther = allTasks.filter(t => t.status === 'in_progress' && t.agentId === 'SYNTHESIS');
  console.log("\n--- SYNTHESIS TASKS ---");
  console.log(stuckOther.map(t => ({ id: t.id, agentId: t.agentId, title: t.title, status: t.status, progress: t.progress, updatedAt: t.updatedAt })));

  process.exit(0);
}
main();
