import { Router } from "express";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import * as waitlistController from "../controllers/waitlistController.js";

const router = Router();

/**
 * Join waitlist
 */
router.post(
  "/join",
  adminAuthMiddleware.requireAdmin,
  waitlistController.joinWaitlist
);

/**
 * Get user's waitlist position
 * Example:
 * /position?eventId=123&userId=456
 */
router.get(
  "/position",
  adminAuthMiddleware.requireAdmin,
  waitlistController.getPosition
);

/**
 * Auto-enroll next user
 */
router.post(
  "/auto-enroll",
  adminAuthMiddleware.requireAdmin,
  waitlistController.autoEnroll
);

/**
 * Get notification list
 */
router.get(
  "/notifications",
  adminAuthMiddleware.requireAdmin,
  waitlistController.getNotifications
);

/**
 * Waitlist analytics
 */
router.get(
  "/analytics",
  adminAuthMiddleware.requireAdmin,
  waitlistController.getAnalytics
);

/**
 * Set registration deadline
 */
router.post(
  "/deadline",
  adminAuthMiddleware.requireAdmin,
  waitlistController.setDeadline
);

export default router;