import { Router } from 'express';
import multer from 'multer';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { bulkOperationsService } from '../services/bulkOperationsService.js';

const router = Router();
const adminAuth = [apiRateLimiter, adminAuthMiddleware.requireAdmin];

// Helper to support both mounted and unmounted path prefix styles
const paths = (subPath) => [`${subPath}`, `/api/admin${subPath}`];

const bulkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
});

// ---------------------------------------------------------------------------
// Job Management
// ---------------------------------------------------------------------------
router.get(paths('/bulk/jobs/:id'), adminAuth, (req, res) => {
  const job = bulkOperationsService.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  return res.json(job);
});

// ---------------------------------------------------------------------------
// User Operations
// ---------------------------------------------------------------------------
router.post(paths('/bulk/users/preview'), adminAuth, (req, res) => {
  const { csv } = req.body;
  if (!csv) {
    return res.status(400).json({ error: 'CSV data is required' });
  }
  const result = bulkOperationsService.previewImportUsers(csv);
  return res.json(result);
});

router.post(paths('/bulk/users/import'), adminAuth, async (req, res) => {
  const { csv } = req.body;
  if (!csv) {
    return res.status(400).json({ error: 'CSV data is required' });
  }
  const adminId = req.adminSession.username;
  const job = await bulkOperationsService.importUsers(csv, adminId);
  return res.status(202).json(job);
});

router.post(paths('/bulk/users/upload'), adminAuth, bulkUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file is required' });
  }
  const csv = req.file.buffer.toString('utf-8');
  const adminId = req.adminSession.username;
  const job = await bulkOperationsService.importUsers(csv, adminId);
  return res.status(202).json(job);
});

router.get(paths('/bulk/users/export'), adminAuth, async (req, res) => {
  const { fields, role, status, major, year } = req.query;
  const selectedFields = fields ? fields.split(',') : null;
  const csv = await bulkOperationsService.exportUsers(selectedFields, {
    role,
    status,
    major,
    year,
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
  return res.send(csv);
});

router.post(paths('/bulk/users/role'), adminAuth, async (req, res) => {
  const { userIds, role } = req.body;
  if (!Array.isArray(userIds) || !role) {
    return res.status(400).json({ error: 'userIds array and role are required' });
  }
  const adminId = req.adminSession.username;
  const job = await bulkOperationsService.bulkRoleAssignment(userIds, role, adminId);
  return res.status(202).json(job);
});

router.post(paths('/bulk/users/status'), adminAuth, async (req, res) => {
  const { userIds, status } = req.body;
  if (!Array.isArray(userIds) || !status) {
    return res.status(400).json({ error: 'userIds array and status are required' });
  }
  const adminId = req.adminSession.username;
  const job = await bulkOperationsService.bulkStatusChange(userIds, status, adminId);
  return res.status(202).json(job);
});

router.post(paths('/bulk/users/tags'), adminAuth, async (req, res) => {
  const { userIds, tags } = req.body;
  if (!Array.isArray(userIds) || !Array.isArray(tags)) {
    return res.status(400).json({ error: 'userIds array and tags array are required' });
  }
  const adminId = req.adminSession.username;
  const job = await bulkOperationsService.bulkTagAssignment(userIds, tags, adminId);
  return res.status(202).json(job);
});

router.post(paths('/bulk/users/email'), adminAuth, async (req, res) => {
  const { userIds, subject, message } = req.body;
  if (!Array.isArray(userIds) || !subject || !message) {
    return res.status(400).json({ error: 'userIds array, subject, and message are required' });
  }
  const adminId = req.adminSession.username;
  const job = await bulkOperationsService.bulkEmail(userIds, subject, message, adminId);
  return res.status(202).json(job);
});

// ---------------------------------------------------------------------------
// Event Operations
// ---------------------------------------------------------------------------
router.post(paths('/bulk/events/preview'), adminAuth, (req, res) => {
  const { csv } = req.body;
  if (!csv) {
    return res.status(400).json({ error: 'CSV data is required' });
  }
  const result = bulkOperationsService.previewImportEvents(csv);
  return res.json(result);
});

router.post(paths('/bulk/events/import'), adminAuth, async (req, res) => {
  const { csv } = req.body;
  if (!csv) {
    return res.status(400).json({ error: 'CSV data is required' });
  }
  const adminId = req.adminSession.username;
  const job = await bulkOperationsService.importEvents(csv, adminId);
  return res.status(202).json(job);
});

router.post(paths('/bulk/events/upload'), adminAuth, bulkUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file is required' });
  }
  const csv = req.file.buffer.toString('utf-8');
  const adminId = req.adminSession.username;
  const job = await bulkOperationsService.importEvents(csv, adminId);
  return res.status(202).json(job);
});

router.post(paths('/bulk/events/status'), adminAuth, async (req, res) => {
  const { eventIds, status } = req.body;
  if (!Array.isArray(eventIds) || !status) {
    return res.status(400).json({ error: 'eventIds array and status are required' });
  }
  const adminId = req.adminSession.username;
  const job = await bulkOperationsService.bulkUpdateEventStatus(eventIds, status, adminId);
  return res.status(202).json(job);
});

router.post(paths('/bulk/events/clone'), adminAuth, async (req, res) => {
  const { eventIds, offsetDays } = req.body;
  if (!Array.isArray(eventIds) || typeof offsetDays !== 'number') {
    return res.status(400).json({ error: 'eventIds array and numeric offsetDays are required' });
  }
  const adminId = req.adminSession.username;
  const job = await bulkOperationsService.bulkEventCloning(eventIds, offsetDays, adminId);
  return res.status(202).json(job);
});

router.get(paths('/bulk/events/export'), adminAuth, async (req, res) => {
  const { eventIds } = req.query;
  if (!eventIds) {
    return res
      .status(400)
      .json({ error: 'eventIds query parameter is required (comma-separated)' });
  }
  const ids = eventIds.split(',');
  const csv = await bulkOperationsService.exportEventData(ids);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=events_export.csv');
  return res.send(csv);
});

router.post(paths('/bulk/events/remind'), adminAuth, async (req, res) => {
  const { eventIds } = req.body;
  if (!Array.isArray(eventIds)) {
    return res.status(400).json({ error: 'eventIds array is required' });
  }
  const adminId = req.adminSession.username;
  const job = await bulkOperationsService.bulkSendReminders(eventIds, adminId);
  return res.status(202).json(job);
});

// ---------------------------------------------------------------------------
// Rollback System
// ---------------------------------------------------------------------------
router.post(paths('/bulk/rollback/:id'), adminAuth, async (req, res) => {
  const auditLogId = req.params.id;
  const adminId = req.adminSession.username;
  try {
    const result = await bulkOperationsService.rollback(auditLogId, adminId);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
