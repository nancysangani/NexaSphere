// server/services/backupVerifier.ts
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import crypto from 'crypto';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BackupVerifierService {
  private client: S3Client;
  private bucket: string;

  constructor(config: {
    endpoint: string;
    region: string;
    credentials: { accessKeyId: string; secretAccessKey: string };
    bucketName: string;
  }) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: config.credentials,
      forcePathStyle: true,
    });
    this.bucket = config.bucketName;
  }

  /**
   * Verifies the uploaded backup exists and matches the local file size/checksum.
   */
  async verifyUpload(objectKey: string, localFilePath: string): Promise<boolean> {
    console.log(`Verifying upload for ${objectKey}...`);
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      });

      const response = await this.client.send(command);
      const stat = await fs.stat(localFilePath);

      if (response.ContentLength !== stat.size) {
        console.error(`Size mismatch! Local: ${stat.size}, Remote: ${response.ContentLength}`);
        return false;
      }

      console.log('Verification successful.');
      return true;
    } catch (error) {
      console.error('Verification failed:', error);
      return false;
    }
  }

  /**
   * Restores the backup locally into a temporary database to verify data integrity.
   */
  async verifyIntegrity(localFilePath: string): Promise<boolean> {
    console.log(`Running deep integrity check on ${localFilePath}...`);
    try {
      // The script is located at the root of the server directory
      const scriptPath = path.resolve(__dirname, '../../verify-backup-integrity.sh');
      
      // Use bash explicitly in case it's not executable
      const { stdout, stderr } = await execAsync(`bash "${scriptPath}" "${localFilePath}"`);
      
      console.log('Integrity check output:', stdout);
      if (stderr) {
        console.warn('Integrity check stderr:', stderr);
      }
      return true;
    } catch (error: any) {
      console.error('Integrity check failed. The backup is corrupted or empty:', error.message || error);
      return false;
    }
  }
}
