import { db } from "../server/db";
import { tasks } from "../server/db/schema";
import { desc, eq } from "drizzle-orm";

async function checkTasks() {
  try {
    const recentTasks = await db.query.tasks.findMany({
      orderBy: [desc(tasks.createdAt)],
      limit: 10,
    });
    console.log("Recent Tasks:");
    recentTasks.forEach(t => {
      console.log(`- ID: ${t.id}, Type: ${t.type}, Status: ${t.status}, Priority: ${t.priority || 'N/A'}, Created: ${t.createdAt}, Agent: ${t.assignedTo || 'Unassigned'}`);
    });
    process.exit(0);
  } catch (error) {
    console.error("Error checkTasks:", error);
    process.exit(1);
  }
}

checkTasks();
