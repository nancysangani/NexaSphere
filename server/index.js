import { getRedisClient } from './utils/redis.js';
import 'dotenv/config';
import { tracedFetch } from './config/appContext.js';
import { initObservability } from './observability/index.js';
import { setTraceIdResolver } from './utils/logContext.js';
import { getActiveTraceId } from './observability/tracing.js';
import helmet from 'helmet';
import express from 'express';
import cors from 'cors';
import csrf from 'csurf';
import fs, { promises as fsp } from 'fs';
import { body, validationResult } from 'express-validator';
import { EventEmitter } from 'events';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { adminAuthMiddleware } from './middleware/adminAuthMiddleware.js';
import analyticsRouter from './routes/analytics.js';
import customEventsRouter from './routes/customEvents.js';
import apiRouter from './routes/api.js';
import { initializeSocketIO } from './config/socket.js';
import adminStreamRouter from './routes/adminStream.js';
import documentationRouter from './routes/documentation.js';
import monitoringRouter from './routes/monitoring.js';
import healthRouter from './routes/health.js';
import dashboardRouter from './routes/dashboard.js';
import coreTeamRouter from './routes/coreTeam.js';
import formsRouter from './routes/forms.js';
import portfolioRouter from './routes/portfolio.js';
import healthDashboardRouter from './routes/healthDashboard.js';
import complianceRouter from './routes/compliance.js';
import auditToolsRouter from './routes/auditTools.js';
import certificatesRouter from './routes/certificates.js';

import { logEvent } from './controllers/analyticsController.js';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { eventRemindersQueue } from './services/queueService.js';
import './workers/reminderWorker.js';
import portfolioExportRouter from './routes/portfolioExport.js';
import userGroupsRouter from './routes/userGroups.js';
import notificationsRouter from './routes/notifications.js';
import adminRouter from './routes/admin.js';
import announcementsRouter from './routes/announcements.js';
import bulkRouter from './routes/bulk.js';
import { validateEnvironment } from './utils/envValidator.js';
import { performanceMonitor } from './middleware/performanceMonitor.js';
import { enhancedTracingMiddleware } from './middleware/enhancedTracingMiddleware.js';
import { apiLogger } from './middleware/apiLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { notificationAnalyticsRepository } from './repositories/notificationAnalyticsRepository.js';
import { notificationPreferencesRepository } from './repositories/notificationPreferencesRepository.js';
import notificationsService from './services/notificationsService.js';
import { studentAuthService } from './services/studentAuthService.js';
import { slackIntegrationService } from './services/slackIntegrationService.js';
import { initializeSentry, addSentryErrorHandler } from './utils/sentry.js';
import {
  apiRateLimiter,
  formRateLimiter,
  notificationRateLimiter,
  activityAuthRateLimiter,
  portfolioRateLimiter,
  searchRateLimiter,
  validateLimiters,
} from './middleware/rateLimiter.js';
import {
  authRateLimiter,
  protectedActionRateLimiter,
  passwordResetRateLimiter,
} from './middleware/authRateLimiter.js';
import { portfolioRepository } from './repositories/portfolioRepository.js';
import { portfolioContentSchema, portfolioPutSchema } from './validators/portfolioSchemas.js';
import { searchController } from './controllers/searchController.js';
import { Mutex } from 'async-mutex';
import { CircuitBreaker, circuitBreakerRegistry } from './utils/circuitBreaker.js';
import { getPublicAppUrl } from './utils/publicAppUrl.js';
import * as eventsController from './controllers/eventsController.js';
import './workers/bulkWorker.js';
import * as activityEventsController from './controllers/activityEventsController.js';
import * as streamController from './controllers/streamController.js';
import * as coreTeamController from './controllers/coreTeamController.js';
import { coreTeamService } from './services/coreTeamService.js';
import { HAS_SUPABASE, SUPABASE_URL, SUPABASE_SERVICE_KEY } from './storage/supabaseClient.js';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const RedisStore = require('connect-redis').default || require('connect-redis');
import Redis from 'ioredis';
import passport from './config/studentOAuth.js';
import { studentUsersRepository } from './repositories/studentUsersRepository.js';
import { slackRepository } from './repositories/slackRepository.js';
import * as studentAuthController from './controllers/studentAuthController.js';
import * as forumController from './controllers/forumController.js';
import { requireStudentAuth } from './middleware/studentAuthMiddleware.js';
import { loadPersistedPushSubscriptions } from './routes/notifications.js';
import * as mentorshipController from './controllers/mentorshipController.js';
import { xssSanitizer } from './middleware/xssSanitizer.js';
import { sqlInjectionGuard } from './middleware/sqlInjectionGuard.js';
import { tierRateLimiter } from './middleware/tierRateLimiter.js';
import { startWebhookRetryProcessor } from './services/webhookRetryProcessor.js';
import { csrfProtection } from './middleware/csrfMiddleware.js';
import compression from 'compression';
import syncRouter from './routes/sync.js';
import multer from 'multer';
import learningPathRouter from './routes/learningPaths.js';
import { learningPathService } from './services/learningPathService.js';
import * as resourcesController from './controllers/resourcesController.js';
import * as backupController from './controllers/backupController.js';
import scheduledTasksRouter from './routes/scheduledTasks.js';
import financialsRouter from './routes/financials.js';
import { schedulerService } from './services/schedulerService.js';
import feedbackRouter from './routes/feedbackRoutes.js';
import * as slackController from './controllers/slackController.js';
import { startStreamingWorkers } from './streaming/startStreamingWorkers.js';

import {
  listEventsStore,
  createEventStore,
  updateEventStore,
  deleteEventStore,
  listActivityEventsStore,
  createActivityEventStore,
  deleteActivityEventStore,
  listCoreTeamStore,
  createCoreTeamStore,
  deleteCoreTeamStore,
  appendToSupabaseForms,
  timingSafeStringEqual,
  toSafeString,
  validateWhatsApp,
  validateSection,
  sanitizeEvent,
  normalizePhone
} from './repositories/contentStore.js';

import { checkPasskeyLockout, recordFailedPasskeyAttempt, clearPasskeyAttempts } from './middleware/auth/passkeyLockout.js';
import { checkActivityAuthLockout, recordFailedActivityAuth, clearActivityAuthAttempts, canManageActivityEvent } from './middleware/auth/activityAuth.js';
import { requireNotificationPrefAuth, requireMentorshipAuth } from './middleware/auth/customAuth.js';
import { uploadWithMagicCheck, validateMagicBytes, UPLOADS_DIR } from './middleware/uploadMiddleware.js';

import circuitBreakerRouter from './routes/circuitBreaker.js';

validateLimiters();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_FILE = path.join(__dirname, 'data', 'content.json');

validateEnvironment();

const app = express();

// RECTIFIED: Enable 'trust proxy' to correctly extract client IPs from X-Forwarded-For headers when behind ALBs/Serverless layers
app.set('trust proxy', 1);

initializeSentry(app);
app.use(compression());

const corsOrigin =
  process.env.CORS_ORIGIN ||
  (process.env.NODE_ENV === 'test' ? 'http://localhost,http://127.0.0.1' : '');
if (!corsOrigin) {
  throw new Error('CORS_ORIGIN environment variable must be set.');
}

const allowedOrigins = corsOrigin
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  helmet({
    // Prevent MIME sniffing
    noSniff: true,

    // Prevent clickjacking
    frameguard: {
      action: 'deny',
    },

    // Hide X-Powered-By
    hidePoweredBy: true,

    // Enable XSS filter (legacy IE/Edge protection)
    xssFilter: true,

    // Restrict referrer leakage
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },

    // Enforce HTTPS in production
    hsts:
      process.env.NODE_ENV === 'production'
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,

    // Strict Content Security Policy
    contentSecurityPolicy: {
      useDefaults: false,

      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: ["'self'", 'https://challenges.cloudflare.com'],

        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],

        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://api.dicebear.com',
          'https://images.unsplash.com',
        ],

        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],

        connectSrc: [
          "'self'",
          'https://challenges.cloudflare.com',
          'https://*.ingest.sentry.io',
          'https://*.ingest.us.sentry.io',
          process.env.FRONTEND_URL || 'http://localhost:5173',
          `wss://${process.env.DOMAIN || 'localhost'}`,
        ],

        objectSrc: ["'none'"],

        baseUri: ["'self'"],

        frameAncestors: ["'none'"],

        formAction: ["'self'"],

        upgradeInsecureRequests: [],

        workerSrc: ["'self'", 'blob:'],

        manifestSrc: ["'self'"],

        mediaSrc: ["'self'"],

        frameSrc: [
          "'self'",
          'https://challenges.cloudflare.com',
          'https://maps.google.com',
          'https://www.google.com',
          'https://www.google.co.in',
        ],

        childSrc: ["'none'"],

        reportUri: '/api/v1/csp-violation',
      },
    },

    // Safer cross-origin behavior
    crossOriginEmbedderPolicy: false,

    crossOriginOpenerPolicy: {
      policy: 'same-origin',
    },

    crossOriginResourcePolicy: {
      policy: 'same-origin',
    },

    // Disable DNS prefetching
    dnsPrefetchControl: {
      allow: false,
    },

    // Prevent browser feature abuse
    permissionsPolicy: {
      features: {
        geolocation: [],
        microphone: [],
        camera: [],
        payment: [],
        usb: [],
        magnetometer: [],
        gyroscope: [],
      },
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (origin && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV === 'test') {
        try {
          const url = new URL(origin);
          if (
            url.hostname === 'localhost' ||
            url.hostname === '127.0.0.1' ||
            url.hostname === '[::1]' ||
            url.hostname === '::1'
          ) {
            return callback(null, true);
          }
        } catch {}
      }
      return callback(new Error('CORS Policy: Origin not allowed.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  })
);
app.options('*', cors());

app.use(enhancedTracingMiddleware);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(xssSanitizer);
app.use(sqlInjectionGuard);
if (!useStructuredHttpLog) {
  app.use(morgan('combined'));
}
app.use(apiLogger);
app.use(performanceMonitor);
app.use(cookieParser());

// Verify Redis URL protocol in production
const redisSessionUrl = process.env.REDIS_URL || '';
if (process.env.NODE_ENV === 'production' && !redisSessionUrl.startsWith('rediss://')) {
  console.warn('Security Warning: Redis URL should use rediss:// for TLS in production.');
}

// Reuse the existing getRedisClient if possible, else create a new one
let sessionClient = getRedisClient();
if (!sessionClient) {
  sessionClient = new Redis(redisSessionUrl);
}

app.use(session({
  store: new RedisStore({ client: sessionClient, prefix: 'session:express:' }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'ns_session',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: process.env.NODE_ENV === 'production' ? 8 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  }
}));

// Session logging middleware
app.use((req, res, next) => {
  if (req.session && !req.session.created_at) {
    req.session.created_at = Date.now();
    req.session.ip = req.ip || req.connection?.remoteAddress || 'unknown';
    console.log('[Session] New session created:', req.sessionID, 'IP:', req.session.ip);
  } else if (req.session && req.session.ip && req.session.ip !== (req.ip || req.connection?.remoteAddress)) {
    console.warn('[Session] Suspicious activity: Session accessed from different IP. Original:', req.session.ip, 'New:', req.ip || req.connection?.remoteAddress);
  }
  next();
});

// Idle timeout middleware (30 mins)
app.use((req, res, next) => {
  if (req.session) {
    const now = Date.now();
    if (req.session.lastActive && now - req.session.lastActive > 30 * 60 * 1000) {
      console.log('[Session] Destroying idle session:', req.sessionID);
      req.session.destroy((err) => {
        if (err) console.error('[Session] Error destroying idle session:', err);
        return res.status(401).json({ error: 'Session expired due to inactivity' });
      });
      return;
    }
    req.session.lastActive = now;
  }
  next();
});


// Track app activity for smart notification frequency adjustment
app.use((req, res, next) => {
  if (req.studentUser || req.adminSession) {
    const userId = req.studentUser?.id || req.adminSession?.userId;
    if (userId) notificationAnalyticsRepository.trackAppActivity(userId);
  }
  next();
});

// CSRF protection — double-submit cookie pattern for all state-changing endpoints
app.use(csrfProtection);

// Global API rate limiter — protects all /api routes from request flooding
app.use('/api', apiRateLimiter);
app.use('/api', tierRateLimiter());

// Mount route modules
app.post('/api/analytics/track', logEvent);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/health-dashboard', healthDashboardRouter);
app.use('/api', documentationRouter);
app.use('/', dashboardRouter);
app.use('/', apiRouter);
app.use('/', healthRouter);
app.use('/', coreTeamRouter);
app.use('/', announcementsRouter);
app.use('/api', formsRouter);
app.use('/api', portfolioRouter);
app.use('/api', userGroupsRouter);
app.use('/api', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api', learningPathRouter);
app.use('/', syncRouter);
app.use('/api/feedback', feedbackRouter);

const adminAuth = [apiRateLimiter, adminAuthMiddleware.requireAdmin];

// Scheduled Tasks Management
app.use('/api/admin/scheduled-tasks', adminAuth, scheduledTasksRouter);

// Database Backup & Recovery Endpoints
app.get('/api/admin/backups', adminAuth, backupController.getBackups);
app.post('/api/admin/backups/manual', adminAuth, backupController.runManualBackup);
app.post('/api/admin/backups/restore', adminAuth, backupController.runRestore);
app.get('/api/admin/backups/restore-test-history', adminAuth, backupController.getRestoreHistory);
app.delete('/api/admin/backups', adminAuth, backupController.deleteBackup);

const defaultContent = {
  events: [
    {
      id: 'kss-153',
      name: 'KSS #153 — Knowledge Sharing Session',
      shortName: 'KSS #153',
      date: 'March 14, 2025',
      description: "NexaSphere's inaugural Knowledge Sharing Session focused on the impact of AI.",
      status: 'completed',
      icon: 'Brain',
      tags: ['AI', 'Learning', 'Community'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  activityEvents: {},
  coreTeam: [],
};

function requiredStrongPassword(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  if (value.length < 12 || !hasLower || !hasUpper || !hasNumber || !hasSymbol) {
    throw new Error(
      `${name} must be at least 12 characters and include uppercase, lowercase, number, and symbol`
    );
  }

  return value;
}

const ADMIN_EVENT_PASSWORD = requiredStrongPassword('ADMIN_EVENT_PASSWORD');
const SESSION_SECRET = requiredStrongPassword('SESSION_SECRET');

// ── File Upload Configuration ──
app.use('/uploads', express.static(UPLOADS_DIR));

// Compliance & Legal Documents (handles both public and admin routes internally)
app.use('/api/compliance', complianceRouter);

// Compliance & Accessibility Audit Tools (#1801)
app.use('/api', auditToolsRouter);

// Event Certification & Digital Badges (#1787)
app.use('/api', certificatesRouter);

// Admin Analytics & Metrics (mounted with admin auth)
app.use('/api/admin/analytics', adminAuth, analyticsRouter);
app.use('/api/admin/custom-events', adminAuth, customEventsRouter);
app.use('/api/admin/metrics', adminAuth, adminStreamRouter);
app.use('/api/admin/scheduled-tasks', adminAuth, scheduledTasksRouter);

// Setup Bull Board for background job monitoring
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/admin/queues');
createBullBoard({
  queues: eventRemindersQueue ? [new BullMQAdapter(eventRemindersQueue)] : [],
  serverAdapter,
});
app.use('/api/admin/queues', adminAuth, serverAdapter.getRouter());

// OAuth / SSO Student Auth Endpoints
app.get('/api/auth/google', studentAuthController.googleAuth);
app.get('/api/auth/google/callback', studentAuthController.googleCallback);
app.get('/api/auth/github', studentAuthController.githubAuth);
app.get('/api/auth/github/callback', studentAuthController.githubCallback);
app.get('/api/auth/me', requireStudentAuth, studentAuthController.getMe);
app.post('/api/auth/theme', requireStudentAuth, studentAuthController.updateTheme);
app.post('/api/auth/logout', studentAuthController.logout);

// Slack Integration Endpoints
app.post('/api/auth/slack-settings', requireStudentAuth, studentAuthController.updateSlackSettings);
app.get('/api/slack/auth', slackController.startSlackAuth);
app.get('/api/slack/auth/callback', slackController.slackAuthCallback);
app.post(
  '/api/slack/commands',
  express.urlencoded({ extended: true }),
  slackController.handleSlackCommand
);
app.get('/api/admin/slack/config', adminAuth, slackController.getSlackConfig);
app.post('/api/admin/slack/config', adminAuth, slackController.updateSlackConfig);
app.delete('/api/admin/slack/disconnect', adminAuth, slackController.disconnectSlack);

// ── Event Admin Management ──
app.get('/api/admin/events', adminAuth, eventsController.adminListEvents);
app.post('/api/admin/events', adminAuth, eventsController.adminCreateEvent);
app.put('/api/admin/events/:id', adminAuth, eventsController.adminUpdateEvent);
app.delete('/api/admin/events/:id', adminAuth, eventsController.adminDeleteEvent);

// Live Streaming
app.get('/api/streams', streamController.listStreams);
app.get('/api/streams/event/:eventId', streamController.getStreamByEvent);
app.get('/api/streams/:id', streamController.getStream);
app.post('/api/streams', adminAuth, streamController.createStream);
app.put('/api/streams/:id', adminAuth, streamController.updateStream);
app.patch('/api/streams/:id/status', adminAuth, streamController.setStreamStatus);
app.delete('/api/streams/:id', adminAuth, streamController.deleteStream);
app.post('/api/streams/:id/chat', apiRateLimiter, streamController.addChatMessage);
app.get('/api/streams/:id/chat', streamController.listChatMessages);
app.post('/api/streams/:id/ban', adminAuth, streamController.banUser);
app.post('/api/streams/:id/polls', adminAuth, streamController.createPoll);
app.get('/api/streams/:id/polls', streamController.listPolls);
app.post('/api/streams/polls/:pollId/vote', streamController.votePoll);
app.patch('/api/streams/polls/:pollId/close', adminAuth, streamController.closePoll);
app.patch('/api/streams/chat/:messageId/moderate', adminAuth, streamController.moderateChatMessage);
app.get('/api/admin/streams', adminAuth, streamController.adminListAll);
app.post('/api/streams/:id/mod-chat', adminAuth, streamController.addModChatMessage);
app.get('/api/streams/:id/mod-chat', adminAuth, streamController.listModChatMessages);
app.get('/api/streams/:id/analytics', adminAuth, streamController.getStreamAnalytics);

// Streaming Engagement: Q&A and Reactions
app.post('/api/streams/:id/questions', streamController.addQuestion);
app.get('/api/streams/:id/questions', streamController.listQuestions);
app.patch('/api/streams/questions/:qId/answer', adminAuth, streamController.answerQuestion);
app.post('/api/streams/:id/reactions', streamController.addReaction);
app.get('/api/streams/:id/reactions', streamController.getReactions);

// Public listings
// Admin Team Management
app.get(
  '/api/admin/core-team',
  adminAuthMiddleware.requireScope('settings:admin'),
  coreTeamController.adminListCoreTeamMembers
);
app.post(
  '/api/admin/core-team',
  adminAuthMiddleware.requireScope('settings:admin'),
  coreTeamController.adminAddCoreTeamMember
);
app.put(
  '/api/admin/core-team/:id',
  adminAuthMiddleware.requireScope('settings:admin'),
  coreTeamController.adminUpdateCoreTeamMember
);
app.delete(
  '/api/admin/core-team/:id',
  adminAuthMiddleware.requireScope('settings:admin'),
  coreTeamController.adminDeleteCoreTeamMember
);

app.use('/api/admin/circuit-breaker', circuitBreakerRouter);

// ── Forum / Q&A ──
app.get('/api/forum/categories', forumController.listCategories);
app.get('/api/forum/threads', forumController.listThreads);
app.get('/api/forum/threads/:id', forumController.getThread);
app.post('/api/forum/threads', requireStudentAuth, forumController.createThread);
app.put('/api/forum/threads/:id', requireStudentAuth, forumController.updateThread);
app.delete('/api/forum/threads/:id', requireStudentAuth, forumController.deleteThread);
app.get('/api/forum/threads/:id/replies', forumController.listReplies);
app.post('/api/forum/threads/:id/replies', requireStudentAuth, forumController.createReply);
app.put('/api/forum/replies/:replyId', requireStudentAuth, forumController.updateReply);
app.delete('/api/forum/replies/:replyId', requireStudentAuth, forumController.deleteReply);
app.post('/api/forum/threads/:id/vote', requireStudentAuth, forumController.voteThread);
app.post('/api/forum/replies/:replyId/vote', requireStudentAuth, forumController.voteReply);
app.post('/api/forum/threads/:id/accept/:replyId', requireStudentAuth, forumController.acceptReply);
app.patch('/api/admin/forum/threads/:id/moderate', adminAuth, forumController.moderateThread);
app.patch('/api/admin/forum/replies/:replyId/moderate', adminAuth, forumController.moderateReply);
app.get('/api/admin/forum/threads', adminAuth, forumController.adminListThreads);


// ── Mentorship & Buddy System ──
app.get('/api/mentorship/mentors', mentorshipController.listMentors);
app.get('/api/mentorship/mentors/:id', mentorshipController.getMentor);
app.post('/api/mentorship/mentors', requireStudentAuth, mentorshipController.registerMentor);
app.put('/api/mentorship/mentors/:id', requireMentorshipAuth, mentorshipController.updateMentor);
app.post('/api/mentorship/requests', requireStudentAuth, mentorshipController.requestMentorship);
app.get('/api/mentorship/requests', requireMentorshipAuth, mentorshipController.listMentorships);
app.get('/api/mentorship/requests/:id', requireMentorshipAuth, mentorshipController.getMentorship);
app.put(
  '/api/mentorship/requests/:id/status',
  requireMentorshipAuth,
  mentorshipController.updateMentorshipStatus
);
app.post(
  '/api/mentorship/requests/:id/sessions',
  requireStudentAuth,
  mentorshipController.logSession
);
app.get(
  '/api/mentorship/requests/:id/sessions',
  requireStudentAuth,
  mentorshipController.listSessions
);
app.post('/api/mentorship/buddy-pairs', requireStudentAuth, mentorshipController.createBuddyPair);
app.get('/api/mentorship/buddy-pairs', requireStudentAuth, mentorshipController.listBuddyPairs);
app.get('/api/admin/mentorships', adminAuth, mentorshipController.adminListAll);
app.get('/api/admin/mentors', adminAuth, mentorshipController.adminListMentors);

// ── Search, Discovery & Recommendation Engine ──
app.get('/api/search', searchRateLimiter, searchController.search);
app.get('/api/search/trending', searchRateLimiter, searchController.trending);
app.get('/api/recommendations', searchRateLimiter, searchController.recommendations);
// ── Resource Library Routes ──
// Public resource endpoints
app.get('/api/resources', resourcesController.listResources);
app.get('/api/resources/:id', resourcesController.getResource);
app.post('/api/resources', resourcesController.createResource);
app.post('/api/resources/:id/vote', resourcesController.voteResource);
app.post('/api/resources/:id/download', resourcesController.downloadResource);
app.post('/api/resources/:id/download-track', resourcesController.downloadResource);

// Student resource upload (authenticated)
app.post(
  '/api/resources/upload',
  requireStudentAuth,
  uploadWithMagicCheck,
  resourcesController.uploadFile
);

// Admin resource management
app.get('/api/admin/resources', adminAuth, resourcesController.listResources);
app.post('/api/admin/resources', adminAuth, resourcesController.createResource);
app.put('/api/admin/resources/:id', adminAuth, resourcesController.updateResource);
app.delete('/api/admin/resources/:id', adminAuth, resourcesController.deleteResource);
app.patch('/api/admin/resources/:id/moderate', adminAuth, resourcesController.moderateResource);
// Must be registered after all routes.
app.use(notFoundHandler);
addSentryErrorHandler(app);
app.use(errorHandler);

process.on('unhandledRejection', (reason) => {
  console.error(
    '[Process] Unhandled rejection:',
    reason instanceof Error ? reason.message : reason
  );
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception:', err instanceof Error ? err.message : err);
  if (err && err.stack) console.error(err.stack);
  process.exit(1);
});

const port = Number(process.env.PORT || 8787);
let server;

if (process.env.NODE_ENV !== 'test') {
  if (!process.env.VERCEL) {
    const boot = HAS_SUPABASE
      ? Promise.all([studentUsersRepository.ensureSchema(), slackRepository.ensureSchema()])
      : ensureContentFile();
    boot.then(async () => {
      loadPersistedPushSubscriptions();

      // Start background streaming workers (outbox dispatcher)
      try {
        await startStreamingWorkers();
      } catch (err) {
        console.error('[streamingWorkers] failed to start', err?.message || err);
      }
      slackIntegrationService.init();
      server = app.listen(port, () => {
        console.log(`NexaSphere server listening on http://localhost:${port}`);
        schedulerService.init();

        // Register Learning Path Nudges (Runs daily)
        schedulerService.schedule('0 10 * * *', async () => {
          await learningPathService.runNudgeJob();
        });
      });
      initializeSocketIO(server);
    });
  } else {
    loadPersistedPushSubscriptions();
    slackIntegrationService.init();
    server = app.listen(port, () => {
      console.log(`NexaSphere server listening on http://localhost:${port}`);
      schedulerService.init();
      startWebhookRetryProcessor();
    });
    initializeSocketIO(server);
  }
}

export default app;
