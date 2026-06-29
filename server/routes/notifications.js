/**
 * Notification & Push Subscription Routes
 * Manages browser push subscriptions, notification CRUD,
 * read-state tracking, and user preferences with dual auth
 * (admin or student) and optional database persistence.
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';
import { notificationRateLimiter } from '../middleware/rateLimiter.js';
import notificationsService from '../services/notificationsService.js';
import { pushSubscriptionsRepository } from '../repositories/pushSubscriptionsRepository.js';
import { notificationPreferencesRepository } from '../repositories/notificationPreferencesRepository.js';
import { studentAuthService } from '../services/studentAuthService.js';
import { notificationSchema } from '../validators/notificationSchemas.js';

const router = Router();

// ── Constants ───────────────────────────────────────────────────────────────
const PUSH_PERSISTENCE_ENABLED = Boolean(process.env.DATABASE_URL);

// ── In-memory push subscription store with persistence ──────────────────────
const pushSubscriptions = new Set();

async function loadPersistedPushSubscriptions() {
  if (!PUSH_PERSISTENCE_ENABLED) return;
  try {
    const rows = await pushSubscriptionsRepository.list({ limit: 10000 });
    for (const sub of rows) {
      pushSubscriptions.add(JSON.stringify(sub));
    }
    console.log(`Loaded ${rows.length} persisted push subscription(s).`);
  } catch (err) {
    console.error('Failed to load persisted push subscriptions:', err.message);
  }
}

async function persistPushSubscription(subscription) {
  if (!PUSH_PERSISTENCE_ENABLED) return;
  try {
    await pushSubscriptionsRepository.add(subscription);
  } catch (err) {
    console.error('Failed to persist push subscription:', err.message);
  }
}

async function removePersistedPushSubscription(subscription) {
  if (!PUSH_PERSISTENCE_ENABLED) return;
  try {
    await pushSubscriptionsRepository.remove(subscription.endpoint);
  } catch (err) {
    console.error('Failed to remove persisted push subscription:', err.message);
  }
}

export { loadPersistedPushSubscriptions };

// ── Dual auth middleware (admin OR student) ─────────────────────────────────
function requireNotificationAuth(req, res, next) {
  adminAuthMiddleware.requireAdmin(req, res, (err) => {
    if (!err && req.adminSession) {
      return next();
    }
    requireStudentAuth(req, res, (err2) => {
      if (!err2 && req.studentUser) {
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    });
  });
}

// ── Push subscription validation middleware ────────────────────────────────
const validatePushSubscription = [
  body('subscription').isObject().withMessage('subscription must be an object'),
  body('subscription.endpoint')
    .isURL()
    .withMessage('endpoint must be a valid URL')
    .isLength({ max: 2048 }),
  body('subscription.keys').isObject().withMessage('keys must be an object'),
  body('subscription.keys.p256dh')
    .isString()
    .isLength({ max: 256 })
    .withMessage('p256dh must be a string up to 256 chars'),
  body('subscription.keys.auth')
    .isString()
    .isLength({ max: 128 })
    .withMessage('auth must be a string up to 128 chars'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: 'Invalid subscription payload', details: errors.array() });
    }

    // Strict sanitization: reconstruct object to drop malicious properties
    const {
      endpoint,
      keys: { p256dh, auth },
    } = req.body.subscription;
    req.body.subscription = { endpoint, keys: { p256dh, auth } };

    next();
  },
];

// ── Push Subscription Routes ────────────────────────────────────────────────

/**
 * POST /notifications/subscribe — Register a push subscription.
 * Limits total stored subscriptions to 10 000 (FIFO eviction).
 */
router.post(
  '/notifications/subscribe',
  adminAuthMiddleware.requireAdmin,
  notificationRateLimiter,
  validatePushSubscription,
  async (req, res) => {
    try {
      const { subscription } = req.body;
      if (subscription) {
        pushSubscriptions.add(JSON.stringify(subscription));
        if (pushSubscriptions.size > 10000) {
          const oldest = pushSubscriptions.values().next().value;
          pushSubscriptions.delete(oldest);
        }
        await persistPushSubscription(subscription);
      }
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /notifications/unsubscribe — Remove a push subscription.
 */
router.post(
  '/notifications/unsubscribe',
  adminAuthMiddleware.requireAdmin,
  notificationRateLimiter,
  validatePushSubscription,
  async (req, res) => {
    try {
      const { subscription } = req.body;
      if (subscription) {
        pushSubscriptions.delete(JSON.stringify(subscription));
        await removePersistedPushSubscription(subscription);
      }
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// ── Notification CRUD Routes (dual auth) ────────────────────────────────────

/**
 * POST /notifications/mark-read — Mark a single notification as read.
 */
router.post(
  '/notifications/mark-read',
  requireNotificationAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const { id, userId } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      let uid = userId || 'global';
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (userId && userId !== studentId) {
          return res
            .status(403)
            .json({ error: 'Forbidden: Cannot modify other users notifications' });
        }
        uid = studentId;
      }
      const ok = await notificationsService.markAsRead(uid, id);
      return res.json({ success: ok });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /notifications/mark-all-read — Mark all notifications as read.
 */
router.post(
  '/notifications/mark-all-read',
  requireNotificationAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const { userId } = req.body || {};
      let uid = userId || 'global';
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (userId && userId !== studentId) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        uid = studentId;
      }
      await notificationsService.markAllAsRead(uid);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * DELETE /notifications/:id — Remove a specific notification by ID.
 */
router.delete(
  '/notifications/:id',
  requireNotificationAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const id = req.params.id;
      let uid = req.query.userId || 'global';
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (req.query.userId && req.query.userId !== studentId) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        uid = studentId;
      }
      const removed = await notificationsService.removeNotification(uid, id);
      if (!removed) return res.status(404).json({ error: 'Notification not found' });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * DELETE /notifications — Clear all notifications for a user.
 */
router.delete(
  '/notifications',
  requireNotificationAuth,
  notificationRateLimiter,
  async (req, res) => {
    try {
      let uid = req.query.userId || 'global';
      if (req.studentUser) {
        const studentId = req.studentUser.sub || req.studentUser.id;
        if (req.query.userId && req.query.userId !== studentId) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        uid = studentId;
      }
      await notificationsService.clearAll(uid);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /notifications — Create a new notification (admin).
 */
router.post(
  '/notifications',
  adminAuthMiddleware.requireAdmin,
  notificationRateLimiter,
  async (req, res) => {
    try {
      const { userId, title, message, type, link } = req.body || {};
      if (!title || !message) {
        return res.status(400).json({ error: 'title and message are required' });
      }
      const note = await notificationsService.addNotification(userId || 'global', {
        title,
        message,
        type,
        link,
      });
      return res.json({ success: true, notification: note });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// ── Notification Retrieval (dual auth) ─────────────────────────────────────

/**
 * GET /notifications — Retrieve notifications for the authenticated user.
 * Supports ?userId=, ?offset=N, ?limit=N query params.
 * Dual auth: admin session or student token.
 */
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.query.userId || 'global';

    if (userId !== 'global') {
      let authenticated = false;

      // 1. Try Student Auth
      let token = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
      if (!token && req.cookies?.ns_student_token) {
        token = req.cookies.ns_student_token;
      }
      if (token) {
        const payload = studentAuthService.verifyToken(token);
        if (payload && (payload.sub === userId || payload.id === userId)) {
          authenticated = true;
        }
      }

      // 2. Try Admin Auth
      if (!authenticated) {
        let adminToken = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          adminToken = authHeader.slice(7).trim();
        }
        if (!adminToken && req.cookies?.ns_admin_token) {
          adminToken = req.cookies.ns_admin_token;
        }
        if (adminToken) {
          const { getAdminSession } = await import('./repositories/adminSessionsRepository.js');
          const session = await getAdminSession(adminToken);
          if (session) {
            authenticated = true;
          }
        }
      }

      if (!authenticated) {
        return res.status(401).json({ error: 'Unauthorized to view these notifications' });
      }
    }

    const offset = parseInt(req.query.offset, 10) || 0;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const list = await notificationsService.getNotifications(userId, offset, limit);
    return res.json({ notifications: list });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


router.get('/notifications/preferences', requireNotificationPrefAuth, async (req, res) => {
  try {
    const userId = req.query.userId || 'global';
    const prefs = await notificationPreferencesRepository.list(userId);
    return res.json({ preferences: prefs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


router.put('/notifications/preferences', requireNotificationPrefAuth, async (req, res) => {
  try {
    const userId = req.body.userId || 'global';
    const { category, email, push, in_app, sms, frequency, quiet_start, quiet_end, dnd } = req.body;
    if (!category) return res.status(400).json({ error: 'category is required' });
    const pref = await notificationPreferencesRepository.set(userId, category, {
      email,
      push,
      in_app,
      sms,
      frequency,
      quiet_start,
      quiet_end,
      dnd,
    });
    return res.json({ preference: pref });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


router.put('/notifications/preferences/bulk', requireNotificationPrefAuth, async (req, res) => {
  try {
    const userId = req.body.userId || 'global';
    const { preferences } = req.body;
    if (!Array.isArray(preferences) || !preferences.length) {
      return res.status(400).json({ error: 'preferences array is required' });
    }
    const results = await notificationPreferencesRepository.setBulk(userId, preferences);
    return res.json({ preferences: results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// Notification analytics (lightweight collector)
router.post('/notifications/analytics', async (req, res) => {
  try {
    const event = req.body || {};
    // Minimal validation — in future route can forward to analytics pipeline
    console.log('[notification-analytics]', event.type || 'unknown', event);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


export default router;
