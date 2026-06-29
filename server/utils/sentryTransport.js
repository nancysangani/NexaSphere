import Transport from 'winston-transport';
import { Sentry } from './sentry.js';

/**
 * Custom Winston transport to forward logs to Sentry.
 */
export default class SentryTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.name = 'sentry';
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // We only forward 'error' and 'warn' levels to Sentry to avoid noise.
    if (info.level === 'error' || info.level === 'warn') {
      const level = info.level === 'error' ? 'error' : 'warning';
      
      const { message, level: _level, timestamp, stack, reqId, userId, ...extra } = info;
      const context = {
        level,
        extra,
        tags: {}
      };

      if (reqId) context.tags.reqId = reqId;
      if (userId) context.tags.userId = userId;

      // Extract error object if present
      const errorObj = info.error || info.err || info[Symbol.for('error')];

      if (errorObj instanceof Error) {
        Sentry.captureException(errorObj, context);
      } else if (stack) {
        // Construct an Error if we have a stack but no explicit Error object
        const err = new Error(message);
        err.stack = stack;
        Sentry.captureException(err, context);
      } else {
        Sentry.captureMessage(message || 'Unknown error', context);
      }
    }

    if (callback) {
      callback();
    }
  }
}
