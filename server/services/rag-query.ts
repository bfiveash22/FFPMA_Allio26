import { OpenAI } from "openai";
import { db } from "../db";
import { knowledgeDocuments, knowledgeEmbeddings } from "@shared/schema";
import { cosineDistance, desc, sql, eq } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getRagContext(query: string): Promise<string> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query.replace(/\n/g, ' '),
      dimensions: 1536,
    });
    
    const embedding = response.data[0].embedding;

    // Use drizzle vector functions to get closest 3 chunks
    const similarity = sql<number>`1 - (${cosineDistance(knowledgeEmbeddings.embedding, embedding)})`;
    
    const closestChunks = await db.select({
      content: knowledgeEmbeddings.content,
      title: knowledgeDocuments.title,
      similarity: similarity
    })
    .from(knowledgeEmbeddings)
    .innerJoin(knowledgeDocuments, eq(knowledgeEmbeddings.documentId, knowledgeDocuments.id))
    .orderBy(desc(similarity))
    .limit(3);

    if (!closestChunks || closestChunks.length === 0) return "";

    let contextText = "\n\n--- RELEVANT KNOWLEDGE FROM DRIVE LIBRARY ---\n";
    contextText += "Please use the following facts to answer the user's question explicitly:\n\n";

    let hasValidChunks = false;
    for (const chunk of closestChunks) {
      if ((chunk.similarity as number) > 0.3) {
        hasValidChunks = true;
        contextText += `- From "${chunk.title}":\n"${chunk.content}"\n\n`;
      }
    }
    
    if (!hasValidChunks) return "";

    contextText += "----------------------------------------------\n";
    return contextText;

  } catch (error) {
    console.error("Failed to fetch Native RAG context:", error);
    return "";
  }
}
