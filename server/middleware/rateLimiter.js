import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../utils/redis.js"; // Adjust path if your redis utility is elsewhere
import logger from "../utils/logger.js";
// ---------------------------------------------------------------------------
// SECURITY WARNING: Upstream Proxy Dependency
// These rate limiters rely entirely on `req.ip` mapping to individual clients.
// For this security perimeter to operate safely without spoofing vulnerabilities
// or accidental self-inflicted DoS, ensure `app.set('trust proxy', 1)` (or your
// specific proxy hop count) is explicitly initialized in the main server app entry file.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Shared env-var config for the general API limiter
// Override via API_RATE_LIMIT_WINDOW_MS and API_RATE_LIMIT_MAX in .env
// ---------------------------------------------------------------------------
const API_WINDOW_MS = parsePositiveInt(process.env.API_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000);

const API_MAX_REQUESTS = parsePositiveInt(process.env.API_RATE_LIMIT_MAX, 100);

// Shared env-var config for the form limiter
const FORM_WINDOW_MS = parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000);

const FORM_MAX_REQUESTS = parsePositiveInt(process.env.RATE_LIMIT_MAX_REQUESTS, 5);

// ---------------------------------------------------------------------------
// Global API rate limiter — applied to every /api route
// Protects against request flooding and database connection pool exhaustion.
// Previously missing: the export did not exist, so app.use("/api", apiRateLimiter)
// received undefined and Express silently skipped the middleware entirely.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Reusable Factory Function for Consistent Error Responses & Logging
// ---------------------------------------------------------------------------
const createLimiterHandler = (logMessage, clientErrorMessage) => {
  return (req, res, _next, options) => {
    logger.warn(logMessage, {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
      limit: options.max,
      windowMs: options.windowMs,
    });

    res.status(options.statusCode).json({
      error: clientErrorMessage,
    });
  };
};

export const apiRateLimiter = rateLimit({
  windowMs: API_WINDOW_MS,
  max: API_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: true,
  store: createRateLimitStore('rate-limit:api:'),
  handler: (req, res, _next, options) => {
    logger.warn('Global API rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
      limit: options.max,
      windowMs: options.windowMs,
    });

    const currentCount = (suspiciousIPs.get(req.ip) || 0) + 1;
    suspiciousIPs.set(req.ip, currentCount);

    if (currentCount >= 5) {
      logger.error('Suspicious activity detected', {
        ip: req.ip,
        attempts: currentCount,
        path: req.originalUrl || req.path,
        detectedAt: new Date().toISOString(),
      });
    }

    const riskScore = calculateRiskScore(req);

    if (riskScore > 80) {
      return res.status(429).json({
        error: 'Suspicious activity detected',
      });
    }

    res.status(options.statusCode).json({
      error: 'Too many requests from this IP, please try again later.',
    });
  },
});

// ---------------------------------------------------------------------------
// Form submission rate limiter — applied to membership, recruitment, core-team
// ---------------------------------------------------------------------------
export const formRateLimiter = rateLimit({
  windowMs: FORM_WINDOW_MS,
  max: FORM_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: true,
  store: createRateLimitStore('rate-limit:form:'),
  handler: (req, res, _next, options) => {
    logger.warn('Rate limit exceeded for public form API', {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
      limit: options.max,
      windowMs: options.windowMs,
    });
    res.status(options.statusCode).json({
      error: 'Too many form submissions from this IP, please try again later.',
    });
  },
});

// Authentication rate limiter — 10 requests per IP per minute
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: true,
  handler: createLimiterHandler(
    'Authentication rate limit exceeded',
    'Too many login attempts, please try again after a minute.'
  ),
});

// Notification mutation rate limiter — 60 requests per IP per 15 minutes
export const notificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: true,
  handler: createLimiterHandler(
    'Notification mutation rate limit exceeded',
    'Too many notification requests, please try again later.'
  ),
});

// Activity-event auth rate limiter: 10 requests per IP per 15 minutes.
// Applied to the publicly reachable POST/DELETE activity-event endpoints that
// require a shared password. Backs up the in-process lockout so that even
// when the server restarts the IP-level window survives in the rate-limit
// store.
export const activityAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(args[0], ...args.slice(1)),
    prefix: "rl:activity:",
  }),
  handler: (req, res, next, options) => {
    logger.warn('Sync batch rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    res.status(options.statusCode).json({
      error: 'Too many sync requests from this IP, please try again later.',
    });
  },
});

// Portfolio update rate limiter — 10 requests per IP per 15 minutes
export const portfolioRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: true,
  handler: createLimiterHandler(
    'Portfolio update rate limit exceeded',
    'Too many portfolio update attempts from this IP, please try again after 15 minutes.'
  ),
});

// Event registration rate limiter — 10 requests per IP per hour
export const eventRegistrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: true,
  store: createRateLimitStore('rate-limit:event-reg:'),
  handler: (req, res, _next, options) => {
    logger.warn('Event registration rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
    });
    res.status(options.statusCode).json({
      error: 'Too many registration attempts. Please try again later.',
    });
  },
});

// Search rate limiter: 30 requests per minute per IP.
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: true,
  store: createRateLimitStore('rate-limit:search:'),
  handler: (req, res, next, options) => {
    logger.warn('Search rate limit exceeded', {
      ip: req.ip,
      path: req.originalUrl || req.path,
    });
    res.status(options.statusCode).json({
      error: 'Too many search requests. Please slow down.',
    });
  },
});

// ---------------------------------------------------------------------------
// Startup guard — call once during server boot to catch missing exports early.
// Throws immediately if any limiter failed to initialise, preventing the silent
// "undefined middleware" failure mode that this issue was created to fix.
// ---------------------------------------------------------------------------
export function validateLimiters() {
  const limiters = {
    apiRateLimiter,
    formRateLimiter,
    authRateLimiter,
    notificationRateLimiter,
    activityAuthRateLimiter,
    syncRateLimiter,
    portfolioRateLimiter,
    eventRegistrationLimiter,
    searchRateLimiter,
  };

  for (const [name, limiter] of Object.entries(limiters)) {
    if (typeof limiter !== 'function') {
      throw new Error(
        `Rate limiter misconfiguration: "${name}" is not a function. Check rateLimiter.js exports.`
      );
    }
  }
}
