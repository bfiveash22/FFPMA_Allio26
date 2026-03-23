const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../../shared/schema.ts');
let content = fs.readFileSync(schemaPath, 'utf-8');
const searchMatch = `// AI Knowledge Base Tables (RAG)
export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: varchar("id").primaryKey().default(sql\`gen_random_uuid()\`),
  driveFileId: varchar("drive_file_id").notNull().unique(),
  title: varchar("title").notNull(),
  mimeType: varchar("mime_type"),
  hash: varchar("hash"), // To detect if file changed
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
content = content.replace(searchMatch, '');
fs.writeFileSync(schemaPath, content);
console.log('Fixed the final duplicate block!');
