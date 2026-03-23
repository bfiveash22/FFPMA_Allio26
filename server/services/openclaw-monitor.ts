import { db } from '../db';
import { openclawMessages } from '../../shared/schema';
import { and, eq, lte } from 'drizzle-orm';
import { sentinel } from './sentinel';

let isRunning = false;

export function startOpenClawMonitor() {
  if (isRunning) return;
  isRunning = true;
  console.log('[OPENCLAW MONITOR] Starting DB Bridge staleness checker daemon...');
  
  // Run every 5 minutes (300,000 ms)
  setInterval(async () => {
    try {
      // Find messages that are 'pending' and older than 5 minutes
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const staleMessages = await db.select().from(openclawMessages)
        .where(
          and(
            eq(openclawMessages.status, 'pending'),
            lte(openclawMessages.createdAt, fiveMinsAgo)
          )
        );
        
      if (staleMessages.length > 0) {
        console.warn(`[OPENCLAW MONITOR] Detected ${staleMessages.length} stale messages!`);
        
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@forgottenformula.com';
        const body = `CRITICAL ALERT:
The OpenClaw database bridge is experiencing a bottleneck.
There are ${staleMessages.length} messages that have been stuck in 'pending' status for over 5 minutes.

This means the Linux VPS running OpenClaw is likely offline, disconnected from the internet, or the WhatsApp session was dropped.

Please check the Trustee Dashboard Communications Queue or SSH into the Linux VPS.`;
        
        try {
           const { sendEmail } = await import('./email');
           await sendEmail(adminEmail, "🚨 URGENT: OpenClaw Bridge Bottleneck Detected", body);
        } catch (e) {
           console.error("[OPENCLAW MONITOR] Failed to send alert email - ensure ADMIN_EMAIL and mail server are configured", e);
        }
        
        try {
           // Also broadcast to the sentinel system log
           await sentinel.broadcastSystemStatus(`🚨 OPENCLAW BOTTLENECK: ${staleMessages.length} pending tasks are stale. Check Linux VPS.`, 1);
        } catch(e) {}
      }
    } catch (error) {
      console.error('[OPENCLAW MONITOR] Error running staleness check:', error);
    }
  }, 5 * 60 * 1000);
}
