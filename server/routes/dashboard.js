import express from 'express';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';
import { dashboardController } from '../controllers/dashboardController.js';

const router = express.Router();

import { apiRateLimiter } from '../middleware/rateLimiter.js';

router.get(
  '/api/dashboard/stats',
  apiRateLimiter,
  requireStudentAuth,
  dashboardController.getStats
);

router.get(
  '/api/dashboard/quests',
  apiRateLimiter,
  requireStudentAuth,
  dashboardController.getQuests
);

router.get(
  '/api/dashboard/leaderboard',
  apiRateLimiter,
  requireStudentAuth,
  dashboardController.getLeaderboard
);
export default router;
