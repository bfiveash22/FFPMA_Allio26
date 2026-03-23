import { SearchServiceClient } from '@google-cloud/discoveryengine';

let client: SearchServiceClient | null = null;
try {
  // Only initialize if the project is configured
  if (process.env.GCP_PROJECT_ID && process.env.GCP_DATA_STORE_ID) {
    client = new SearchServiceClient(); 
  }
} catch (e) {
  console.log("Vertex AI Search Client not initialized. Missing credentials.");
}

export async function searchDriveKnowledgeBase(query: string): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || 'global';
  const dataStoreId = process.env.GCP_DATA_STORE_ID;

  // If the user hasn't set up the Google Cloud Project yet, silently fallback
  // so the agent can still work normally using its base prompt.
  if (!client || !projectId || !dataStoreId) {
    return ""; 
  }

  try {
    const servingConfig = client.projectLocationCollectionDataStoreServingConfigPath(
      projectId,
      location,
      'default_collection',
      dataStoreId,
      'default_search'
    );

    const request = {
      servingConfig,
      query,
      pageSize: 3, // Get the top 3 most relevant paragraphs from the Drive library
      contentSearchSpec: {
        snippetSpec: { returnSnippet: true },
        extractiveContentSpec: { maxExtractiveAnswerCount: 1 },
      },
    };

    const response = await client.search(request, { autoPaginate: false });
    const results = response[0];
    
    if (!results || results.length === 0) return "";

    let contextText = "\n\n--- RELEVANT KNOWLEDGE FROM DRIVE LIBRARY ---\n";
    contextText += "Please use the following facts to answer the user's question explicitly:\n\n";

    for (const result of results) {
      const structData = result.document?.derivedStructData as any;
      if (structData?.extractive_answers) {
         const answers = structData.extractive_answers as any[];
         if (answers.length > 0 && answers[0].content) {
           contextText += `- "${answers[0].content}"\n`;
         }
      } else if (structData?.snippets) {
        const snippets = structData.snippets as any[];
        if (snippets.length > 0 && snippets[0].snippet) {
           // Strip HTML tags from Vertex AI snippets
           const cleanSnippet = snippets[0].snippet.replace(/<[^>]*>?/gm, '');
           contextText += `- "${cleanSnippet}"\n`;
         }
      }
    }
    contextText += "----------------------------------------------\n";
    return contextText;

  } catch (error) {
    console.error("Error searching Vertex AI Knowledge Base:", error);
    return ""; // Fail gracefully on API errors
  }
}
