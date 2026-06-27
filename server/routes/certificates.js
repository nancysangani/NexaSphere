import express from 'express';

import {
  issueCertificates,
  getMyCertificates,
  verifyCertificate,
  downloadCertificatePdf,
  getOpenBadge,
  getCertificateVerificationShare,
} from '../controllers/certificatesController.js';

import {
  adminVerifyCertificate,
  adminRevokeCertificate,
  adminGetCertificateById,
} from '../controllers/certificatesAdminController.js';

import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// Public verification data (used by QR)
router.get('/certificates/verify/:code', verifyCertificate);

// Badge/OpenBadges JSON (public)
router.get('/certificates/:id/badge', getOpenBadge);

// Share URLs / metadata
router.get('/certificates/:id/share', getCertificateVerificationShare);

// Certificate download
router.get('/certificates/:id/download', requireStudentAuth, downloadCertificatePdf);

// User gallery
router.get('/certificates/me', requireStudentAuth, getMyCertificates);

// Admin issuance trigger (placeholder until event-completion wiring exists)
router.post('/certificates/issue', adminAuthMiddleware.requireAdmin, issueCertificates);

// Admin verification controls
router.get('/admin/certificates/:id', adminAuthMiddleware.requireAdmin, adminGetCertificateById);
router.post(
  '/admin/certificates/:id/verify',
  adminAuthMiddleware.requireAdmin,
  adminVerifyCertificate
);
router.post(
  '/admin/certificates/:id/revoke',
  adminAuthMiddleware.requireAdmin,
  adminRevokeCertificate
);

export default router;
