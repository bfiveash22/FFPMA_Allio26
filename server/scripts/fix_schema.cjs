const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../../shared/schema.ts');
let content = fs.readFileSync(schemaPath, 'utf-8');
const searchString = 'export const agentKnowledge';
const index = content.indexOf(searchString);

if (index !== -1) {
  content = content.substring(0, index) + 
`export const agentKnowledge = pgTable("agent_knowledge", {
  id: varchar("id").primaryKey().default(sql\`gen_random_uuid()\`),
  agentId: varchar("agent_id").notNull(),
  knowledgeType: varchar("knowledge_type", { length: 20 }).notNull(),
  displayName: varchar("display_name").notNull(),
  referencePath: varchar("reference_path"),
  driveFileId: varchar("drive_file_id"),
  metadata: text("metadata"),
  status: varchar("status", { length: 20 }).default("active"),
  isActive: boolean("is_active").default(true),
  uploadedBy: varchar("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgentKnowledgeSchema = createInsertSchema(agentKnowledge).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAgentKnowledge = z.infer<typeof insertAgentKnowledgeSchema>;
export type AgentKnowledge = typeof agentKnowledge.$inferSelect;

// --- NATIVE RAG VECTOR TABLES ---
export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: varchar("id").primaryKey().default(sql\`gen_random_uuid()\`),
  driveFileId: varchar("drive_file_id").notNull().unique(),
  title: varchar("title").notNull(),
  mimeType: varchar("mime_type"),
  hash: varchar("hash"),
  syncedAt: timestamp("synced_at").defaultNow(),
});

export const knowledgeEmbeddings = pgTable("knowledge_embeddings", {
  id: varchar("id").primaryKey().default(sql\`gen_random_uuid()\`),
  documentId: varchar("document_id").notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  chunkIndex: integer("chunk_index").notNull(),
}, (table) => ({
  embeddingIndex: index("embeddingIndex").using("hnsw", table.embedding.op("vector_cosine_ops")),
}));

export const knowledgeDocumentsRelations = relations(knowledgeDocuments, ({ many }) => ({
  embeddings: many(knowledgeEmbeddings),
}));

export const knowledgeEmbeddingsRelations = relations(knowledgeEmbeddings, ({ one }) => ({
  document: one(knowledgeDocuments, {
    fields: [knowledgeEmbeddings.documentId],
    references: [knowledgeDocuments.id],
  }),
}));
`;
  fs.writeFileSync(schemaPath, content);
  console.log('Fixed schema.ts duplicates successfully!');
} else {
  console.log('Could not find agentKnowledge export in schema.ts');
}

const drizzlePath = path.join(__dirname, '../../drizzle.config.ts');
let dContent = fs.readFileSync(drizzlePath, 'utf-8');
if (!dContent.includes('dotenv')) {
  dContent = `import * as dotenv from 'dotenv';\ndotenv.config({ path: '.env' });\n` + dContent;
  fs.writeFileSync(drizzlePath, dContent);
  console.log('Added dotenv to drizzle.config.ts');
}
