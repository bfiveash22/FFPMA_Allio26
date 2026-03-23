// @ts-nocheck
import { OpenAI } from "openai";
import { db } from "../db";
import { knowledgeDocuments, knowledgeEmbeddings } from "@shared/schema";
import { listFilesInFolder, getFileMetadata } from "./google-drive-full";
import { extractFileFromDrive } from "./pdf-extractor";
import { eq } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The specific Drive link folder provided by the user
const KNOWLEDGE_FOLDER_ID = "1s6EdFtZ7dZY7utr8J843CFxyAjuuwHPX";

/**
 * Splits text into optimally sized chunks for RAG embedding (approx 1000 chars)
 */
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    if (currentLength + word.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));
      currentChunk = [];
      currentLength = 0;
    }
    currentChunk.push(word);
    currentLength += word.length + 1;
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }
  
  return chunks;
}

/**
 * Gets the vector embeddings for a chunk of text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace(/\n/g, ' '),
    dimensions: 1536,
  });
  return response.data[0].embedding;
}

export async function syncKnowledgeBaseFromDrive() {
  console.log(`[RAG Ingestion] Starting sync from Google Drive Folder: ${KNOWLEDGE_FOLDER_ID}`);
  
  try {
    const files = await listFilesInFolder(KNOWLEDGE_FOLDER_ID);
    console.log(`[RAG Ingestion] Found ${files.length} files in the knowledge base folder.`);
    
    let processedCount = 0;
    
    for (const file of files) {
      if (!file.id) continue;
      
      // Check if document already exists and is up to date
      const [existingDoc] = await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.driveFileId, file.id));
      const fileHash = file.modifiedTime || file.size || "v1";
      
      if (existingDoc) {
        if (existingDoc.hash === fileHash) {
          console.log(`[RAG Ingestion] Skipping ${file.name} - already up to date.`);
          continue;
        } else {
          console.log(`[RAG Ingestion] Updating existing file: ${file.name}`);
          // Delete old embeddings to replace them
          await db.delete(knowledgeEmbeddings).where(eq(knowledgeEmbeddings.documentId, existingDoc.id));
          await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, existingDoc.id));
        }
      }
      
      console.log(`[RAG Ingestion] Extracting content from: ${file.name}`);
      let extracted;
      try {
        extracted = await extractFileFromDrive(file.id);
      } catch (e) {
        console.error(`[RAG Ingestion] Failed to extract ${file.name}:`, e);
        continue;
      }
      
      if (!extracted || !extracted.text || extracted.text.length < 50) {
         console.warn(`[RAG Ingestion] Extracted text from ${file.name} was empty or too small.`);
         continue;
      }

      // Create document record
      const [doc] = await db.insert(knowledgeDocuments).values({
        title: file.name,
        driveFileId: file.id,
        mimeType: file.mimeType,
        hash: fileHash
      }).returning();
      
      // Chunk & Embed
      console.log(`[RAG Ingestion] Chunking and Embedding ${file.name}...`);
      const chunks = chunkText(extracted.text, 1000);
      
      let chunkIndex = 0;
      for (const chunk of chunks) {
        if (chunk.trim().length < 20) continue;
        
        try {
          const vectorArray = await generateEmbedding(chunk);
          await db.insert(knowledgeEmbeddings).values({
            documentId: doc.id,
            content: chunk,
            embedding: vectorArray,
            chunkIndex
          });
          chunkIndex++;
        } catch (embErr) {
           console.error(`[RAG Ingestion] Failed to embed chunk ${chunkIndex} for ${file.name}:`, embErr);
        }
      }
      
      console.log(`[RAG Ingestion] Successfully ingested ${file.name} -> ${chunkIndex} vectors.`);
      processedCount++;
    }
    
    console.log(`[RAG Ingestion] Sync Complete. Successfully processed ${processedCount} new/updated files.`);
    return { success: true, processedCount };
    
  } catch (error) {
    console.error("[RAG Ingestion] Fatal error during Drive sync:", error);
    return { success: false, error };
  }
}
