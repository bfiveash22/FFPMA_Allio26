import { db } from '../db';
import { openclawMessages } from '../../shared/schema';

export async function delegateToOpenClaw(message: string, target?: string): Promise<{ success: boolean; output: string }> {
  try {
    const finalTarget = target || '+194059701117';
    // Format message to ensure OpenClaw knows who to send it to if needed
    const bridgedMessage = `[TARGET: ${finalTarget}] ${message}`;

    console.log(`[OPENCLAW] Directing message to database bridge for OpenClaw to poll...`);
    
    await db.insert(openclawMessages).values({
      agentId: 'SENTINEL',
      message: bridgedMessage,
      priority: 'high',
      status: 'pending'
    });

    console.log(`[OPENCLAW] Successfully inserted task into openclaw_messages table!`);
    return { success: true, output: 'Task queued in database bridge successfully' };
  } catch (error: any) {
    console.error('[OPENCLAW] Database Bridge Error:', error);
    return { success: false, output: error.message || String(error) };
  }
}
