import { google } from 'googleapis';
import { Readable } from 'stream';
import { storage } from '../storage';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
}

export class GoogleDriveService {
  private static constructDriveClient(token: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      '/auth/google/callback'
    );
    
    oauth2Client.setCredentials({
      access_token: token
    });
    
    return google.drive({ version: 'v3', auth: oauth2Client });
  }
  
  // List files in Google Drive
  static async listFiles(accessToken: string, mimeFilter?: string): Promise<DriveFile[]> {
    try {
      const drive = this.constructDriveClient(accessToken);
      
      const query = mimeFilter ? 
        `mimeType='${mimeFilter}' and trashed=false` : 
        'trashed=false';
      
      const response = await drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, createdTime, modifiedTime, size)',
        orderBy: 'modifiedTime desc'
      });
      
      return response.data.files as DriveFile[] || [];
    } catch (error) {
      console.error('Error listing files from Google Drive:', error);
      throw error;
    }
  }
  
  // List PDF and text files in Google Drive
  static async listDocuments(accessToken: string): Promise<DriveFile[]> {
    try {
      const pdfFiles = await this.listFiles(accessToken, 'application/pdf');
      const textFiles = await this.listFiles(accessToken, 'text/plain');
      
      return [...pdfFiles, ...textFiles];
    } catch (error) {
      console.error('Error listing documents from Google Drive:', error);
      throw error;
    }
  }
  
  // Download a file from Google Drive
  static async downloadFile(accessToken: string, fileId: string, fileName: string): Promise<string> {
    try {
      const drive = this.constructDriveClient(accessToken);
      
      // Create temp file path
      const tempDir = path.join(os.tmpdir(), 'rag-explorer-downloads');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const filePath = path.join(tempDir, fileName);
      const dest = fs.createWriteStream(filePath);
      
      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );
      
      return new Promise((resolve, reject) => {
        (response.data as Readable)
          .pipe(dest)
          .on('finish', () => {
            resolve(filePath);
          })
          .on('error', (err) => {
            reject(err);
          });
      });
    } catch (error) {
      console.error('Error downloading file from Google Drive:', error);
      throw error;
    }
  }
}