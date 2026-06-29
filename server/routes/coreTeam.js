/**
 * Core Team Routes
 * Public and admin endpoints for managing core team members.
 */

import { Router } from 'express';
import * as coreTeamController from '../controllers/coreTeamController.js';
import { coreTeamService } from '../services/coreTeamService.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';

const router = Router();
const adminAuth = adminAuthMiddleware.requireAdmin;

/**
 * GET /api/content/team — Public core team listing.
 * Filters out non-@glbajajgroup.org emails for privacy.
 */
router.get('/api/content/team', coreTeamController.publicListMembers);

/**
 * GET /api/admin/core-team — List all core team members (admin).
 */
router.get('/api/admin/core-team', adminAuth, coreTeamController.adminListCoreTeamMembers);

/**
 * POST /api/admin/core-team — Add a new core team member (admin).
 */
router.post('/api/admin/core-team', adminAuth, coreTeamController.adminAddCoreTeamMember);

/**
 * DELETE /api/admin/core-team/:id — Remove a core team member (admin).
 */
router.delete('/api/admin/core-team/:id', adminAuth, coreTeamController.adminDeleteCoreTeamMember);

export default router;
