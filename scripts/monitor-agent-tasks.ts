import { db } from "../server/db";
import { agentTasks } from "@shared/schema";
import { desc } from "drizzle-orm";

async function checkAgentTasks() {
  try {
    const recentTasks = await db.select().from(agentTasks).orderBy(desc(agentTasks.createdAt)).limit(15);
    
    console.log("-----------------------------------------------------------------");
    console.log("               AGENT NETWORK TASK MONITOR (RECENT 15)            ");
    console.log("-----------------------------------------------------------------");
    
    for (const t of recentTasks) {
       console.log(`[${t.agentId}] (${t.status.toUpperCase()}) PRIORITY: ${t.priority}`);
       console.log(`Title: ${t.title}`);
       console.log(`Date: ${t.createdAt?.toISOString().replace('T', ' ').substring(0, 19)}`);
       console.log("-----------------------------------------------------------------");
    }
    
    const summary = recentTasks.reduce((acc: any, t) => {
      const key = `${t.agentId} (${t.status})`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    console.log("\nCounts by Agent & Status:", summary);
    process.exit(0);
  } catch (err) {
    console.error("Monitor failed:", err);
    process.exit(1);
  }
}

checkAgentTasks();
