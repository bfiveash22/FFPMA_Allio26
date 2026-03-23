import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { downloadFile, getFileMetadata } from './google-drive-full';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ExtractedPdfContent {
  title: string;
  text: string;
  numPages: number;
  fileId: string;
}

export interface ExtractedFileContent {
  title: string;
  text: string;
  fileId: string;
  mimeType: string;
}

export async function extractPdfFromDrive(fileId: string): Promise<ExtractedPdfContent> {
  console.log(`[PDF Extractor] Fetching PDF from Drive: ${fileId}`);
  
  const metadata = await getFileMetadata(fileId);
  console.log(`[PDF Extractor] File name: ${metadata.name}`);
  
  const buffer = await downloadFile(fileId);
  console.log(`[PDF Extractor] Downloaded ${buffer.length} bytes`);
  
  const uint8Array = new Uint8Array(buffer);
  const pdf = await getDocument({ 
    data: uint8Array, 
    useWorkerFetch: false, 
    isEvalSupported: false, 
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;
  
  let text = '';
  const numPages = pdf.numPages;
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    text += pageText + '\n\n';
  }
  
  console.log(`[PDF Extractor] Extracted ${numPages} pages, ${text.length} characters`);
  
  return {
    title: metadata.name?.replace('.pdf', '') || 'Untitled',
    text,
    numPages,
    fileId,
  };
}

export async function extractFileFromDrive(fileId: string): Promise<ExtractedFileContent> {
  const metadata = await getFileMetadata(fileId);
  const mimeType = metadata.mimeType || '';
  const name = metadata.name || 'Untitled';

  if (mimeType === 'application/pdf') {
    const result = await extractPdfFromDrive(fileId);
    return { title: result.title, text: result.text, fileId, mimeType };
  }

  const textTypes = [
    'text/plain', 'text/csv', 'text/markdown', 'text/html',
    'application/json', 'application/xml',
  ];

  const isTextType = textTypes.some(t => mimeType.startsWith(t)) ||
    name.endsWith('.txt') || name.endsWith('.csv') || name.endsWith('.md');

  if (isTextType) {
    const buffer = await downloadFile(fileId);
    const text = buffer.toString('utf-8');
    return { title: name, text, fileId, mimeType };
  }

  const isGoogleDoc = mimeType === 'application/vnd.google-apps.document';
  const isGoogleSheet = mimeType === 'application/vnd.google-apps.spreadsheet';

  if (isGoogleDoc || isGoogleSheet) {
    const { getGoogleDriveClient } = await import('./google-drive-full');
    const drive = await getGoogleDriveClient();
    const exportMime = isGoogleSheet ? 'text/csv' : 'text/plain';
    const response = await drive.files.export({ fileId, mimeType: exportMime });
    return { title: name, text: response.data as string, fileId, mimeType };
  }

  const wordTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
  ];

  if (wordTypes.some(t => mimeType.includes(t)) || name.endsWith('.doc') || name.endsWith('.docx')) {
    const buffer = await downloadFile(fileId);
    const rawText = buffer.toString('utf-8');
    const cleaned = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
    return { title: name, text: cleaned.slice(0, 50000), fileId, mimeType };
  }

  throw new Error(`Unsupported file type: ${mimeType} for file "${name}"`);
}

export async function summarizeDocumentForContext(
  text: string,
  documentTitle: string,
  maxTokens: number = 500
): Promise<string> {
  if (text.length <= 2000) return text;

  try {
    const truncated = text.slice(0, 20000);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a concise document summarizer. Extract the key information, protocols, facts, and actionable content from documents. Respond with a structured summary in 200-400 words.',
        },
        {
          role: 'user',
          content: `Summarize this document titled "${documentTitle}" for use as agent knowledge context:\n\n${truncated}`,
        },
      ],
      max_completion_tokens: maxTokens,
    });
    return completion.choices[0]?.message?.content || truncateText(text, 3000);
  } catch (err) {
    console.warn('[PDF Extractor] Summarization failed, falling back to truncation:', err);
    return truncateText(text, 3000);
  }
}

export function truncateText(text: string, maxChars: number = 30000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n[Content truncated for processing...]';
}
