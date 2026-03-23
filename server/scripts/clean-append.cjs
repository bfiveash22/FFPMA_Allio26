const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../../shared/schema.ts');
let content = fs.readFileSync(schemaPath, 'utf-8');

// Update imports
content = content.replace(
  'import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum, jsonb } from "drizzle-orm/pg-core";',
  'import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum, jsonb, vector, index } from "drizzle-orm/pg-core";'
);

// Append tables safely
const newTables = `

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

if (!content.includes('knowledgeDocuments = pgTable(')) {
  fs.writeFileSync(schemaPath, content + newTables);
  console.log('Successfully updated schema with pgvector tables!');
} else {
  console.log('Tables already exist, skipping append.');
}
