import { db } from "../server/db";
import { agentTasks } from "../server/db/schema";
import { desc } from "drizzle-orm";

async function main() {
  const tasks = await db.select().from(agentTasks).orderBy(desc(agentTasks.createdAt)).limit(10);
  console.log(JSON.stringify(tasks, null, 2));
  process.exit(0);
}
main().catch(console.error);
