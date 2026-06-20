import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

// 1. Mock postgres environment variables so database routines are enabled and tested
process.env.DATABASE_URL = 'postgresql://localhost/dummy_test_db';
process.env.SUPABASE_URL = 'https://supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

// 2. Mock PG Pool to prevent actual database connections in CI/test environments
import pg from 'pg';
pg.Pool = class MockPool {
  on() {}
  async connect() {
    return {
      query: async (sql, params) => {
        const sqlLower = sql.toLowerCase();
        if (sqlLower.includes('information_schema.tables')) {
          return { rows: [{ table_name: 'student_users' }, { table_name: 'events' }] };
        }
        if (sqlLower.includes('select * from "student_users"')) {
          return { rows: [{ id: 1, email: 'test@example.com' }] };
        }
        if (sqlLower.includes('select * from "events"')) {
          return { rows: [{ id: 1, name: 'Event 1' }] };
        }
        if (sqlLower.includes('select * from backup_restore_logs')) {
          return {
            rows: [
              {
                id: 1,
                backup_key: 'test-key',
                restore_type: 'automated_test',
                status: 'success',
                duration_ms: 100,
                verified_at: new Date().toISOString(),
                error_message: null,
              },
            ],
          };
        }
        return { rows: [], rowCount: 1 };
      },
      release: () => {},
    };
  }
};

import { backupService } from '../services/backupService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_LOCAL_DIR = path.resolve(__dirname, '../../backups');

test('Data Backup & Disaster Recovery Tests', async (t) => {
  // Setup: clear local backup directory
  t.beforeEach(async () => {
    try {
      await fs.rm(BACKUP_LOCAL_DIR, { recursive: true, force: true });
    } catch (_) {}
  });

  // Cleanup after all tests
  t.after(async () => {
    try {
      await fs.rm(BACKUP_LOCAL_DIR, { recursive: true, force: true });
    } catch (_) {}
  });

  await t.test('database dump JSON structure generation (mock/fallback)', async () => {
    const dumpStr = await backupService.generateDatabaseDump();
    const data = JSON.parse(dumpStr);
    assert.ok(data);
    if (data.note) {
      assert.equal(data.note, 'Mock data dump when database is disabled');
    } else {
      assert.ok(data.timestamp);
      assert.ok(data.tables);
    }
  });

  await t.test('performBackup writes encrypted files locally in fallback mode', async () => {
    const key = await backupService.performBackup('full');
    assert.ok(key);
    assert.ok(key.startsWith('backups/backup-full-'));
    assert.ok(key.endsWith('.enc'));

    const filename = path.basename(key);
    const localPath = path.join(BACKUP_LOCAL_DIR, filename);

    // Verify file exists
    const stats = await fs.stat(localPath);
    assert.ok(stats.isFile());
    assert.ok(stats.size > 0);
  });

  await t.test('runRestore can decrypt and restore from a valid local backup file', async () => {
    const key = await backupService.performBackup('full');
    const restoreResult = await backupService.runRestore(key);
    assert.ok(restoreResult.success);
    assert.ok(restoreResult.durationMs >= 0);
  });

  await t.test('backup history and storage stats lists local files', async () => {
    await backupService.performBackup('full');
    await backupService.performBackup('incremental');

    const history = await backupService.getBackupHistory();
    assert.equal(history.length, 2);

    const fullBackup = history.find((b) => b.type === 'full');
    const incBackup = history.find((b) => b.type === 'incremental');

    assert.ok(fullBackup);
    assert.ok(incBackup);
    assert.equal(fullBackup.location, 'local');

    const stats = await backupService.getStorageStats();
    assert.equal(stats.totalCount, 2);
    assert.equal(stats.storageType, 'Local File Redundancy');
  });

  await t.test(
    'immutability policy blocks deletion of backups within retention window',
    async () => {
      const key = await backupService.performBackup('full');

      // Attempting to delete a newly created backup file should throw an error due to immutability
      await assert.rejects(
        async () => {
          await backupService.deleteBackupFile(key);
        },
        (err) => {
          return err.message.includes('immutable');
        }
      );
    }
  );

  await t.test('automated recovery verification tests run successfully', async () => {
    await backupService.performBackup('full');

    // Perform automated recovery verification test
    await backupService.runAutomatedRecoveryTest();

    const logs = await backupService.getRecoveryTestHistory();
    assert.ok(logs.length > 0);
    assert.equal(logs[0].restore_type, 'automated_test');
    assert.equal(logs[0].status, 'success');
  });
});
