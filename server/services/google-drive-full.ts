// Google Drive Integration for Forgotten Formula PMA
// Used to sync training materials like Seminar Handouts and IV Guidelines

import { google, drive_v3 } from 'googleapis';

let connectionSettings: any;

async function getAccessToken(): Promise<string> {
  if (connectionSettings && connectionSettings.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

// Get a fresh Google Drive client (never cache - tokens expire)
export async function getGoogleDriveClient(): Promise<drive_v3.Drive> {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  description?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  parents?: string[];
}

export interface DriveFolder {
  id: string;
  name: string;
  files: DriveFile[];
  subfolders: DriveFolder[];
}

// List files in a folder
export async function listFilesInFolder(folderId: string): Promise<DriveFile[]> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, description, createdTime, modifiedTime, size, parents)',
    pageSize: 100,
  });

  return (response.data.files || []) as DriveFile[];
}

// Search for folders by name
export async function searchFoldersByName(folderName: string): Promise<DriveFile[]> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `name contains '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name, mimeType, webViewLink, description, createdTime, modifiedTime, parents)',
    pageSize: 50,
  });

  return (response.data.files || []) as DriveFile[];
}

// Search for files by name (all file types, not just folders)
export async function searchFilesByName(fileName: string): Promise<DriveFile[]> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `name contains '${fileName}' and trashed = false`,
    fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, description, createdTime, modifiedTime, size, parents)',
    pageSize: 100,
  });

  return (response.data.files || []) as DriveFile[];
}

// List all folders the user has access to
export async function listAllFolders(): Promise<DriveFile[]> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name, mimeType, webViewLink, description, createdTime, modifiedTime, parents)',
    pageSize: 100,
  });

  return (response.data.files || []) as DriveFile[];
}

// Get folder contents recursively
export async function getFolderContents(folderId: string, depth: number = 1): Promise<DriveFolder> {
  const drive = await getGoogleDriveClient();
  
  // Get folder metadata
  const folderMeta = await drive.files.get({
    fileId: folderId,
    fields: 'id, name, mimeType',
  });

  // Get all items in folder
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, description, createdTime, modifiedTime, size, parents)',
    pageSize: 100,
  });

  const files: DriveFile[] = [];
  const subfolders: DriveFolder[] = [];

  for (const file of response.data.files || []) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      if (depth > 0) {
        const subfolder = await getFolderContents(file.id!, depth - 1);
        subfolders.push(subfolder);
      } else {
        subfolders.push({
          id: file.id!,
          name: file.name!,
          files: [],
          subfolders: [],
        });
      }
    } else {
      files.push(file as DriveFile);
    }
  }

  return {
    id: folderMeta.data.id!,
    name: folderMeta.data.name!,
    files,
    subfolders,
  };
}

// Get file content as text (for Google Docs)
export async function getDocumentContent(fileId: string): Promise<string> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.export({
    fileId,
    mimeType: 'text/html',
  });

  return response.data as string;
}

// Get file metadata
export async function getFileMetadata(fileId: string): Promise<DriveFile> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, webViewLink, webContentLink, thumbnailLink, description, createdTime, modifiedTime, size, parents',
  });

  return response.data as DriveFile;
}

// Download file content
export async function downloadFile(fileId: string): Promise<Buffer> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.get({
    fileId,
    alt: 'media',
  }, {
    responseType: 'arraybuffer',
  });

  return Buffer.from(response.data as ArrayBuffer);
}

// Get content type category from MIME type
export function getContentTypeFromMime(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('video')) return 'video';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('text')) return 'text';
  return 'file';
}
