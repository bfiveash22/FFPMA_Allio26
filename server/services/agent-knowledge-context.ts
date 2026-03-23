import { db } from '../db';
import { agentKnowledge } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export async function getAgentKnowledgeContext(agentId: string): Promise<string> {
  try {
    const items = await db.select().from(agentKnowledge)
      .where(and(eq(agentKnowledge.agentId, agentId.toUpperCase()), eq(agentKnowledge.isActive, true)));

    if (!items.length) return '';

    const lines: string[] = ['--- AGENT KNOWLEDGE RESOURCES ---'];
    for (const item of items) {
      const typeLabel = item.knowledgeType === 'file' ? 'File'
        : item.knowledgeType === 'api' ? 'API Endpoint'
        : item.knowledgeType === 'url' ? 'Reference URL'
        : 'ML Capability Note';
      lines.push(`[${typeLabel}] ${item.displayName}${item.referencePath ? ` — ${item.referencePath}` : ''}`);

      let existingMeta: Record<string, any> = {};
      if (item.metadata) {
        try { existingMeta = JSON.parse(item.metadata); } catch {}
      }

      if (existingMeta.notes) lines.push(`  Notes: ${existingMeta.notes}`);

      if (item.knowledgeType === 'file' && item.driveFileId) {
        try {
          let summary: string | undefined;
          if (existingMeta.cachedSummary) {
            summary = existingMeta.cachedSummary;
          } else {
            const { extractFileFromDrive, summarizeDocumentForContext } = await import('./pdf-extractor');
            const extracted = await extractFileFromDrive(item.driveFileId);
            summary = await summarizeDocumentForContext(extracted.text, extracted.title);
            if (summary) {
              const updatedMeta = { ...existingMeta, cachedSummary: summary };
              await db.update(agentKnowledge)
                .set({ metadata: JSON.stringify(updatedMeta) })
                .where(eq(agentKnowledge.id, item.id));
            }
          }
          if (summary?.trim()) {
            lines.push(`  Summary/Content from "${item.displayName}":`);
            lines.push(`  ${summary.replace(/\n/g, '\n  ')}`);
          }
        } catch (fileErr) {
          console.warn(`[KnowledgeContext] Could not extract file content for item ${item.id}:`, fileErr);
          lines.push(`  (File content unavailable for extraction)`);
        }
      }
    }
    lines.push('--- END KNOWLEDGE RESOURCES ---');
    return lines.join('\n');
  } catch (error) {
    console.warn('[KnowledgeContext] Could not load agent knowledge:', error);
    return '';
  }
}
