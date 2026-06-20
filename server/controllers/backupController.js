import { backupService } from '../services/backupService.js';
import logger from '../utils/logger.js';

export const getBackups = async (req, res) => {
  try {
    const backups = await backupService.getBackupHistory();
    const stats = await backupService.getStorageStats();
    res.json({ backups, stats });
  } catch (err) {
    logger.error('[BackupController] Failed to get backups:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const runManualBackup = async (req, res) => {
  try {
    const { type } = req.body;
    let key;
    if (type === 'files') {
      await backupService.runFileStorageBackup();
      key = 'uploads/';
    } else {
      key = await backupService.performBackup(type || 'full');
    }
    res.json({ message: 'Backup triggered successfully', key });
  } catch (err) {
    logger.error('[BackupController] Manual backup failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const runRestore = async (req, res) => {
  try {
    const { backupKey, targetTime } = req.body;
    let result;
    if (targetTime) {
      result = await backupService.runPITR(targetTime);
    } else if (backupKey) {
      result = await backupService.runRestore(backupKey);
    } else {
      return res.status(400).json({ error: 'Either backupKey or targetTime must be provided' });
    }
    res.json({ message: 'Restore completed successfully', result });
  } catch (err) {
    logger.error('[BackupController] Restore failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getRestoreHistory = async (req, res) => {
  try {
    const history = await backupService.getRecoveryTestHistory();
    res.json({ history });
  } catch (err) {
    logger.error('[BackupController] Failed to get restore history:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const deleteBackup = async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Backup key is required' });
    }
    await backupService.deleteBackupFile(key);
    res.json({ message: 'Backup deleted successfully' });
  } catch (err) {
    logger.error('[BackupController] Delete backup failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};
