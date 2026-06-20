/**
 * routes/compliance.js
 * REST API for Compliance & Legal Document Management (Issue #1757)
 *
 * Public endpoints (no auth):
 *   GET  /api/compliance/documents                - list active documents
 *   GET  /api/compliance/documents/:id            - get single document
 *   GET  /api/compliance/documents/type/:type     - get active doc by type
 *   POST /api/compliance/acceptances              - record user acceptance
 *   GET  /api/compliance/acceptances/user/:userId - user's acceptances
 *   GET  /api/compliance/acceptances/check        - check if user accepted type
 *   POST /api/compliance/gdpr                     - submit GDPR request
 *
 * Admin endpoints (require adminAuth):
 *   GET    /api/admin/compliance/documents           - all docs (incl. archived)
 *   POST   /api/admin/compliance/documents           - create new version
 *   PATCH  /api/admin/compliance/documents/:id       - update document
 *   DELETE /api/admin/compliance/documents/:id       - archive document
 *   GET    /api/admin/compliance/acceptances         - all acceptances
 *   GET    /api/admin/compliance/gdpr                - all GDPR requests
 *   PATCH  /api/admin/compliance/gdpr/:id            - process GDPR request
 *   GET    /api/admin/compliance/audit               - audit log
 *   GET    /api/admin/compliance/stats               - stats overview
 */

import { Router } from 'express';
import complianceService from '../services/complianceService.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';

const router = Router();
const adminAuth = adminAuthMiddleware.requireAdmin || adminAuthMiddleware;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safePagination(query) {
  const limit  = Math.min(parseInt(query.limit,  10) || 50, 200);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limit, offset };
}

function sanitizeId(id) {
  return /^[a-zA-Z0-9_-]+$/.test(String(id || ''));
}

// ─── Public: Documents ────────────────────────────────────────────────────────

router.get('/documents', async (req, res) => {
  try {
    const { type } = req.query;
    const docs = await complianceService.listDocuments({ type });
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/documents/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    if (!complianceService.DOCUMENT_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }
    const doc = await complianceService.getActiveDocument(type);
    if (!doc) return res.status(404).json({ error: 'No active document found for this type' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/documents/:id', async (req, res) => {
  try {
    if (!sanitizeId(req.params.id)) return res.status(400).json({ error: 'Invalid document id' });
    const doc = await complianceService.getDocument(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Public: Acceptances ──────────────────────────────────────────────────────

router.post('/acceptances', async (req, res) => {
  try {
    const { userId, documentId, ipAddress } = req.body || {};
    if (!userId || !documentId) {
      return res.status(400).json({ error: 'userId and documentId are required' });
    }
    const acceptance = await complianceService.recordAcceptance({
      userId,
      documentId,
      ipAddress: ipAddress || req.ip || null,
    });
    res.status(201).json(acceptance);
  } catch (err) {
    if (err.message === 'Document not found') return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.get('/acceptances/user/:userId', async (req, res) => {
  try {
    const acceptances = await complianceService.getUserAcceptances(req.params.userId);
    res.json({ acceptances });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/acceptances/check', async (req, res) => {
  try {
    const { userId, type } = req.query;
    if (!userId || !type) return res.status(400).json({ error: 'userId and type are required' });
    const accepted = await complianceService.hasUserAccepted(userId, type);
    res.json({ accepted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Public: GDPR requests ────────────────────────────────────────────────────

router.post('/gdpr', async (req, res) => {
  try {
    const { userId, type, notes } = req.body || {};
    if (!userId || !type) return res.status(400).json({ error: 'userId and type are required' });
    const gdprReq = await complianceService.createGdprRequest({ userId, type, notes });
    res.status(201).json(gdprReq);
  } catch (err) {
    if (err.message.includes('Invalid GDPR') || err.message.includes('already exists')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Documents ─────────────────────────────────────────────────────────

router.get('/admin/documents', adminAuth, async (req, res) => {
  try {
    const { type, includeArchived } = req.query;
    const docs = await complianceService.listDocuments({
      type,
      includeArchived: includeArchived === 'true',
    });
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/documents', adminAuth, async (req, res) => {
  try {
    const { type, title, version, effectiveDate, content, summary } = req.body || {};
    if (!type || !title || !content) {
      return res.status(400).json({ error: 'type, title, and content are required' });
    }
    const actorId = req.adminSession?.username || 'admin';
    const doc = await complianceService.createDocument(
      { type, title, version, effectiveDate, content, summary },
      actorId
    );
    res.status(201).json(doc);
  } catch (err) {
    if (err.message.includes('Invalid document type')) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/documents/:id', adminAuth, async (req, res) => {
  try {
    if (!sanitizeId(req.params.id)) return res.status(400).json({ error: 'Invalid document id' });
    const actorId = req.adminSession?.username || 'admin';
    const doc = await complianceService.updateDocument(req.params.id, req.body, actorId);
    res.json(doc);
  } catch (err) {
    if (err.message === 'Document not found') return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/documents/:id', adminAuth, async (req, res) => {
  try {
    if (!sanitizeId(req.params.id)) return res.status(400).json({ error: 'Invalid document id' });
    const actorId = req.adminSession?.username || 'admin';
    const doc = await complianceService.archiveDocument(req.params.id, actorId);
    res.json({ message: 'Document archived', document: doc });
  } catch (err) {
    if (err.message === 'Document not found') return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Acceptances ───────────────────────────────────────────────────────

router.get('/admin/acceptances', adminAuth, async (req, res) => {
  try {
    const { documentId, documentType } = req.query;
    const { limit, offset } = safePagination(req.query);
    const result = await complianceService.listAcceptances({ documentId, documentType, limit, offset });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: GDPR ──────────────────────────────────────────────────────────────

router.get('/admin/gdpr', adminAuth, async (req, res) => {
  try {
    const { status, userId } = req.query;
    const { limit, offset } = safePagination(req.query);
    const result = await complianceService.listGdprRequests({ status, userId, limit, offset });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/gdpr/:id', adminAuth, async (req, res) => {
  try {
    if (!sanitizeId(req.params.id)) return res.status(400).json({ error: 'Invalid request id' });
    const { status, notes } = req.body || {};
    if (!['completed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be completed or rejected' });
    }
    const actorId = req.adminSession?.username || 'admin';
    const gdprReq = await complianceService.processGdprRequest(req.params.id, { status, notes }, actorId);
    res.json(gdprReq);
  } catch (err) {
    if (err.message === 'GDPR request not found') return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Audit + Stats ─────────────────────────────────────────────────────

router.get('/admin/audit', adminAuth, async (req, res) => {
  try {
    const { action, actorId } = req.query;
    const { limit, offset } = safePagination(req.query);
    const result = await complianceService.getAuditLog({ action, actorId, limit, offset });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    res.json(await complianceService.getStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
