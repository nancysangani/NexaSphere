// server/scripts/dr-drill.ts
import { BackupStorageService } from '../services/backupStorage.js';
import { BackupVerifierService } from '../services/backupVerifier.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runDrDrill() {
  console.log('==========================================');
  console.log('INITIATING AUTOMATED DISASTER RECOVERY DRILL');
  console.log('==========================================\n');

  const { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET_NAME } = process.env;

  if (!S3_ENDPOINT || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_BUCKET_NAME) {
    console.error('Error: Missing S3 configuration environment variables.');
    process.exit(1);
  }

  const config = {
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
    bucketName: S3_BUCKET_NAME,
  };

  const storageService = new BackupStorageService(config);
  const verifierService = new BackupVerifierService(config);

  const startTime = Date.now();

  try {
    // 1. Fetch list of backups to find the latest one
    console.log('[1/3] Fetching latest backup from S3...');
    const backups = await storageService.listBackups();
    if (backups.length === 0) {
      throw new Error('No backups found in S3 bucket.');
    }

    // Backups are usually sorted, but we'll sort them by date to be sure (assuming ISO strings in keys or LastModified)
    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const latestBackup = backups[0];
    console.log(`Found latest backup: ${latestBackup.key} (created at ${latestBackup.createdAt.toISOString()})`);

    // 2. Download the backup
    console.log('\n[2/3] Downloading encrypted backup...');
    const downloadPath = path.resolve(__dirname, `../../dr-test-backup-${Date.now()}.enc`);
    await storageService.downloadBackup(latestBackup.key, downloadPath);
    console.log(`Download complete: ${downloadPath}`);

    // 3. Verify integrity (restore to temp DB and run sanity queries)
    console.log('\n[3/3] Restoring and verifying integrity...');
    const isIntegrityValid = await verifierService.verifyIntegrity(downloadPath);

    // Cleanup downloaded file
    await fs.unlink(downloadPath).catch(() => {});

    if (!isIntegrityValid) {
      throw new Error('DR Drill Failed: Integrity check failed on the restored database.');
    }

    const endTime = Date.now();
    const rtoSeconds = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n==========================================');
    console.log('DR DRILL COMPLETED SUCCESSFULLY');
    console.log('==========================================');
    console.log(`Recovery Time Objective (RTO) achieved: ${rtoSeconds} seconds`);
    console.log('Status: PASS');
    
    // In the future, this can be hooked up to `notificationsService` to alert the team.
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n==========================================');
    console.error('DR DRILL FAILED');
    console.error('==========================================');
    console.error(error.message || error);
    process.exit(1);
  }
}

runDrDrill();
