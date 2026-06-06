import 'dotenv/config';
import helmet from 'helmet';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminAuthMiddleware } from './middleware/adminAuthMiddleware.js';
import analyticsRouter from './routes/analytics.js';
import apiRouter from './routes/api.js';
import { initializeSocketIO } from './config/socket.js';
import adminStreamRouter from './routes/adminStream.js';
import documentationRouter from './routes/documentation.js';
import monitoringRouter from './routes/monitoring.js';
import healthRouter from './routes/health.js';
import coreTeamRouter from './routes/coreTeam.js';
import formsRouter from './routes/forms.js';
import portfolioRouter from './routes/portfolio.js';
import notificationsRouter from './routes/notifications.js';
import adminRouter from './routes/admin.js';
import { performanceMonitor } from './middleware/performanceMonitor.js';
import { tracingMiddleware } from './middleware/tracingMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { initializeSentry, addSentryErrorHandler } from './utils/sentry.js';
import { apiRateLimiter, validateLimiters } from './middleware/rateLimiter.js';
import { getPublicAppUrl } from './utils/publicAppUrl.js';
import { HAS_SUPABASE } from './storage/supabaseClient.js';

validateLimiters();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_FILE = path.join(__dirname, 'data', 'content.json');

const app = express();

// Trust the first reverse proxy hop (e.g., Vercel, Render, Nginx, Cloudflare)
// to correctly populate req.ip and securely discard spoofed X-Forwarded-For headers
const proxyTrust = process.env.TRUST_PROXY || 1;
app.set(
  'trust proxy',
  proxyTrust === 'true'
    ? true
    : proxyTrust === 'false'
      ? false
      : !isNaN(proxyTrust)
        ? parseInt(proxyTrust, 10)
        : proxyTrust
);

initializeSentry(app);

if (!process.env.CORS_ORIGIN) {
  throw new Error('CORS_ORIGIN environment variable must be set.');
}

const allowedOrigins = process.env.CORS_ORIGIN.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          process.env.FRONTEND_URL || 'http://localhost:5173',
          `wss://${process.env.DOMAIN || 'localhost'}`,
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(tracingMiddleware);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan('combined'));
app.use(performanceMonitor);

// Global API rate limiter — protects all /api routes from request flooding
app.use('/api', apiRateLimiter);

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const { method, path, reqId } = req;

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    const status = res.statusCode;
    const prefix = reqId ? `[${reqId}] ` : '';
    const message = `${prefix}[${method}] ${path} → ${status} (${Math.round(duration)}ms)`;

    if (status >= 500) {
      console.error(message);
    } else if (status >= 400) {
      console.warn(message);
    } else {
      console.log(message);
    }
  });

  next();
}

app.use(requestLogger);

// Mount route modules
app.use('/api/monitoring', monitoringRouter);
app.use('/api', documentationRouter);
app.use('/', apiRouter);
app.use('/', healthRouter);
app.use('/', coreTeamRouter);
app.use('/api', formsRouter);
app.use('/api', portfolioRouter);
app.use('/api', notificationsRouter);
app.use('/api/admin', adminRouter);

const adminAuth = adminAuthMiddleware.requireAdmin;

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

getPublicAppUrl();

async function ensureContentFile() {
  const dir = path.dirname(CONTENT_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(CONTENT_FILE);
  } catch {
    await fs.writeFile(CONTENT_FILE, JSON.stringify(defaultContent, null, 2), 'utf8');
  }
}

// Admin Analytics & Metrics (mounted with admin auth)
app.use('/api/admin/analytics', adminAuth, analyticsRouter);
app.use('/api/admin/metrics', adminAuth, adminStreamRouter);

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
    const boot = HAS_SUPABASE ? Promise.resolve() : ensureContentFile();
    boot.then(() => {
      server = app.listen(port, () => {
        console.log(`NexaSphere server listening on http://localhost:${port}`);
      });
      initializeSocketIO(server);
    });
  } else {
    server = app.listen(port, () => {
      console.log(`NexaSphere server listening on http://localhost:${port}`);
    });
    initializeSocketIO(server);
  }
}

export default app;
