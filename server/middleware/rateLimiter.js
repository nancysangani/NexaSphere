import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

// Convert env vars or use fallbacks
const WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS 
  ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) 
  : 10 * 60 * 1000; // 10 minutes

const MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS 
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) 
  : 5;

/**
 * Reusable rate limiter middleware for public form endpoints.
 * Provides protection against spam and abuse, with logging for exceeded limits.
 */
export const formRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    // Log abuse attempt before sending response
    logger.warn('Rate limit exceeded for public form API', {
      ip: req.ip,
      path: req.originalUrl || req.path,
      method: req.method,
      limit: options.max,
      windowMs: options.windowMs
    });

    res.status(options.statusCode).json({
      error: 'Too many form submissions from this IP, please try again later.'
    });
  }
});
