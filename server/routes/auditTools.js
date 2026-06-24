/**
 * routes/auditTools.js
 * Compliance & Accessibility Audit Tools API (#1801)
 */

import { Router } from 'express';
import adminAuthMiddleware from '../middleware/adminAuthMiddleware.js';
import { auditToolsRepository } from '../repositories/auditToolsRepository.js';
import { runComplianceAudit } from '../services/complianceAuditEngine.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { generateCSV } from '../utils/csvParser.js';
import { generateCompliancePdfReport } from '../services/auditReportGenerator.js';

const router = Router();

const adminAuth = [apiRateLimiter, adminAuthMiddleware.requireAdmin];

function safePagination(query) {
  const limit = Math.min(parseInt(query.limit, 10) || 50, 200);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limit, offset };
}

function parseRunType(x) {
  const allowed = ['wcag', 'gdpr', 'pci', 'weekly'];
  return allowed.includes(x) ? x : null;
}

// ─── Audit Runs ────────────────────────────────────────────────────────────

router.post('/audit/run', adminAuth, async (req, res) => {
  try {
    const { runType, targetScope = {}, metadata = {} } = req.body || {};
    const parsedRunType = parseRunType(runType);
    if (!parsedRunType) return res.status(400).json({ error: 'Invalid runType' });

    const actorId = req.adminSession?.username || req.adminSession?.userId || 'admin';

    // For now, runs synchronously. Later we can move to a worker/queue.
    const result = await runComplianceAudit({
      runType: parsedRunType,
      createdByAdminId: actorId,
      targetScope,
      metadata,
    });

    return res.status(201).json({ run: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/admin/audit/runs', adminAuth, async (req, res) => {
  try {
    const { runType, status } = req.query;
    const { limit, offset } = safePagination(req.query);
    const runs = await auditToolsRepository.listAuditRuns({
      runType: runType || null,
      status: status || null,
      limit,
      offset,
    });
    return res.json({ runs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/admin/audit/runs/:runId', adminAuth, async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await auditToolsRepository.getAuditRun(runId);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    const issues = await auditToolsRepository.listIssues({ runId, limit: 2000, offset: 0 });
    return res.json({ run, issues });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Download PDF report for a run
router.get('/admin/audit/runs/:runId/report/pdf', adminAuth, async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await auditToolsRepository.getAuditRun(runId);
    if (!run) return res.status(404).json({ error: 'Run not found' });

    const issues = await auditToolsRepository.listIssues({ runId, limit: 2000, offset: 0 });
    const pdfBuffer = await generateCompliancePdfReport({
      run,
      runIssues: issues,
      summary: run.summary || {},
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=compliance_audit_${runId}.pdf`);
    return res.send(pdfBuffer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Issues ────────────────────────────────────────────────────────────────

router.get('/admin/audit/issues', adminAuth, async (req, res) => {
  try {
    const { runId, issueType, severity } = req.query;
    const { limit, offset } = safePagination(req.query);
    const issues = await auditToolsRepository.listIssues({
      runId: runId || null,
      issueType: issueType || null,
      severity: severity || null,
      limit,
      offset,
    });
    return res.json({ issues });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Export issues from a run as CSV for external tooling.
router.get('/admin/audit/issues/export/csv', adminAuth, async (req, res) => {
  try {
    const { runId } = req.query;
    if (!runId) return res.status(400).json({ error: 'runId is required' });

    const issues = await auditToolsRepository.listIssues({
      runId,
      limit: 2000,
      offset: 0,
    });

    const fields = [
      'id',
      'run_id',
      'issue_type',
      'severity',
      'title',
      'description',
      'page_url',
      'selector',
      'recommended_fix',
      'fingerprint',
      'created_at',
    ];

    const records = issues.map((i) => ({
      id: i.id,
      run_id: i.run_id,
      issue_type: i.issue_type,
      severity: i.severity,
      title: i.title,
      description: i.description,
      page_url: i.page_url || '',
      selector: i.selector || '',
      recommended_fix: i.recommended_fix || '',
      fingerprint: i.fingerprint,
      created_at: i.created_at,
    }));

    const csv = generateCSV(records, fields);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit_issues_${runId}.csv`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Remediations (assignment/progress) ─────────────────────────────────────

router.post('/admin/audit/remediations', adminAuth, async (req, res) => {
  try {
    const { issueId, assignedTo, deadline, notes } = req.body || {};
    if (!issueId) return res.status(400).json({ error: 'issueId is required' });

    const rem = await auditToolsRepository.createRemediationForIssue({
      issueId,
      assignedTo,
      deadline,
      notes,
    });
    return res.status(201).json({ remediation: rem });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/audit/remediations/:remediationId', adminAuth, async (req, res) => {
  try {
    const { remediationId } = req.params;
    const { remediationStatus, assignedTo, deadline, notes, completedAt, auditNotes } =
      req.body || {};

    if (!remediationStatus) {
      return res.status(400).json({ error: 'remediationStatus is required' });
    }

    const rem = await auditToolsRepository.updateRemediation(remediationId, {
      remediationStatus,
      assignedTo,
      deadline,
      notes,
      completedAt,
      auditNotes,
    });
    if (!rem) return res.status(404).json({ error: 'Remediation not found' });

    return res.json({ remediation: rem });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/admin/audit/remediations', adminAuth, async (req, res) => {
  try {
    const { runId, status, assignedTo } = req.query;
    const { limit, offset } = safePagination(req.query);
    const remediations = await auditToolsRepository.listRemediations({
      runId: runId || null,
      status: status || null,
      assignedTo: assignedTo || null,
      limit,
      offset,
    });
    return res.json({ remediations });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Trends ────────────────────────────────────────────────────────────────

router.get('/admin/audit/trends', adminAuth, async (req, res) => {
  try {
    const { runType, limit } = req.query;
    const trends = await auditToolsRepository.getTrends({
      runType: runType || null,
      limit: limit ? parseInt(limit, 10) : 12,
    });
    return res.json({ trends });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
