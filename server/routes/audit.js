import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { auditMonitoringService } from '../services/auditMonitoringService.js';
import { generateCSV } from '../utils/csvParser.js';

const router = Router();
const adminAuth = [apiRateLimiter, adminAuthMiddleware.requireAdmin];

// Support both mounted and unmounted path prefix styles
const paths = (subPath) => [`${subPath}`, `/api/admin${subPath}`];

// Query audit logs with search, filtering, and paging
router.get(paths('/audit/logs'), adminAuth, async (req, res) => {
  const { actor, action, resourceType, startDate, endDate, searchText, limit, offset } = req.query;
  try {
    const logs = await auditLogRepository.queryAuditLogs({
      actor,
      action,
      resourceType,
      startDate,
      endDate,
      searchText,
      limit,
      offset,
    });
    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Export filtered logs to CSV
router.get(paths('/audit/export'), adminAuth, async (req, res) => {
  const { actor, action, resourceType, startDate, endDate, searchText } = req.query;
  try {
    const logs = await auditLogRepository.queryAuditLogs({
      actor,
      action,
      resourceType,
      startDate,
      endDate,
      searchText,
    });

    const fields = [
      'id',
      'admin_id',
      'action',
      'ip_address',
      'user_agent',
      'resource_type',
      'resource_id',
      'session_id',
      'timestamp',
    ];

    // Normalize logs for CSV format
    const records = logs.map((log) => ({
      id: log.id,
      admin_id: log.admin_id,
      action: log.action,
      ip_address: log.ip_address || '',
      user_agent: log.user_agent || '',
      resource_type: log.resource_type || '',
      resource_id: log.resource_id || '',
      session_id: log.session_id || '',
      timestamp: log.timestamp,
    }));

    const csv = generateCSV(records, fields);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Active sessions tracking
router.get(paths('/audit/sessions'), adminAuth, async (req, res) => {
  try {
    const sessions = await auditMonitoringService.getActiveSessions();
    return res.json({ sessions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Verify log tampering / integrity check
router.post(paths('/audit/tamper-check'), adminAuth, async (req, res) => {
  try {
    const corruptedIds = await auditLogRepository.verifyLogTampering();
    return res.json({
      status: corruptedIds.length === 0 ? 'SECURE' : 'COMPROMISED',
      corruptedCount: corruptedIds.length,
      corruptedIds,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Activity Report
router.get(paths('/audit/reports/activity'), adminAuth, async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  try {
    const report = await auditMonitoringService.generateActivityReport(start, end);
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Security Incident Report
router.get(paths('/audit/reports/security'), adminAuth, async (req, res) => {
  try {
    const report = await auditMonitoringService.generateSecurityIncidentReport();
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Compliance Audit Report
router.get(paths('/audit/reports/compliance'), adminAuth, async (req, res) => {
  try {
    const report = await auditMonitoringService.generateComplianceReport();
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Enforce retention policy manual trigger
router.post(paths('/audit/retention'), adminAuth, async (req, res) => {
  const { retentionDays } = req.body;
  const days = retentionDays !== undefined ? parseInt(retentionDays, 10) : 90;

  try {
    const result = await auditMonitoringService.runRetentionCleanup(days);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Suspicious login alert check
router.post(paths('/audit/alerts/check'), adminAuth, async (req, res) => {
  const { username, ipAddress } = req.body;
  if (!username || !ipAddress) {
    return res.status(400).json({ error: 'username and ipAddress are required' });
  }

  try {
    const alerts = await auditMonitoringService.checkSuspiciousActivity(username, ipAddress);
    return res.json({ alerts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
