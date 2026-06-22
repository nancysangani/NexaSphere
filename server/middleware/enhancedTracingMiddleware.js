import crypto from 'crypto';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { appContext } from '../config/appContext.js';
import { logSlowRequest, createQueryPerformanceTracker } from '../utils/performanceLogger.js';
import { trackError } from '../utils/errorTracker.js';
import { maskSensitiveData } from '../utils/sensitiveDataMasking.js';

export const activeTraces = new Map();
export const traceSummaries = [];
const tracer = trace.getTracer('nexasphere-api');
const queryTracker = createQueryPerformanceTracker();

function generateTraceId() {
  return crypto.randomBytes(16).toString('hex');
}

function generateSpanId() {
  return crypto.randomBytes(8).toString('hex');
}

function parseTraceparent(header) {
  if (!header) return null;
  const parts = header.split('-');
  if (parts.length === 4 && parts[0] === '00' && parts[1].length === 32 && parts[2].length === 16) {
    return { version: parts[0], traceId: parts[1], spanId: parts[2], flags: parts[3] };
  }
  return null;
}

export function enhancedTracingMiddleware(req, res, next) {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  const startTime = Date.now();

  req.reqId = reqId;
  res.setHeader('X-Request-ID', reqId);

  // Extract or generate W3C trace context
  const incomingTraceparent = req.headers['traceparent'];
  let traceId;
  let spanId;

  if (incomingTraceparent) {
    const parsed = parseTraceparent(incomingTraceparent);
    if (parsed) {
      traceId = parsed.traceId;
      spanId = generateSpanId();
      // Propagate trace context to downstream services
      const tracestate = req.headers['tracestate'] || '';
      const outgoingTraceparent = `00-${traceId}-${spanId}-01`;
      res.setHeader('traceparent', outgoingTraceparent);
      if (tracestate) {
        res.setHeader('tracestate', tracestate);
      }
    }
  }

  if (!traceId) {
    traceId = generateTraceId();
    spanId = generateSpanId();
    const outgoingTraceparent = `00-${traceId}-${spanId}-01`;
    res.setHeader('traceparent', outgoingTraceparent);
  }

  const baggage = req.headers['baggage'] || '';

  const traceEntry = {
    reqId,
    traceId,
    spanId,
    method: req.method,
    url: req.originalUrl || req.url,
    startTime,
    queries: [],
    duration: 0,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection?.remoteAddress,
    baggage,
  };

  activeTraces.set(reqId, traceEntry);

  const span = tracer.startSpan(`${req.method} ${req.path}`, {
    attributes: {
      'http.method': req.method,
      'http.url': req.originalUrl || req.url,
      'http.route': req.path,
      'nexasphere.request_id': reqId,
      'nexasphere.trace_id': traceId,
      'http.user_agent': req.headers['user-agent'] || '',
    },
  });

  const spanContext = trace.setSpan(context.active(), span);

  context.with(spanContext, () => {
    const store = { reqId, traceId, spanId, traceEntry };
    const activeSpan = trace.getSpan(context.active());
    if (activeSpan) {
      const sc = activeSpan.spanContext();
      store.traceId = sc.traceId;
    }

    appContext.run(store, () => {
      const originalEnd = res.end;
      res.end = function (...args) {
        const duration = Date.now() - startTime;
        traceEntry.duration = duration;

        logSlowRequest(req.method, req.originalUrl || req.url, duration, res.statusCode, {
          reqId,
          traceId: store.traceId,
        });

        if (res.statusCode >= 500) {
          trackError(new Error(`HTTP ${res.statusCode}`), {
            reqId,
            traceId: store.traceId,
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode: res.statusCode,
          });
        }

        // Keep trace summaries for the last 1000 requests
        traceSummaries.push({
          traceId: store.traceId,
          spanId,
          method: req.method,
          path: req.originalUrl || req.url,
          status: res.statusCode,
          duration,
          timestamp: new Date().toISOString(),
        });
        if (traceSummaries.length > 1000) traceSummaries.shift();

        if (activeTraces.size > 500) {
          const oldestKey = activeTraces.keys().next().value;
          activeTraces.delete(oldestKey);
        }

        span.setAttribute('http.status_code', res.statusCode);
        span.setAttribute('http.response_time_ms', duration);

        if (res.statusCode >= 500) {
          span.setStatus({ code: SpanStatusCode.ERROR });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }
        span.end();

        originalEnd.apply(this, args);
      };

      next();
    });
  });
}

export function trackQuery(query, meta = {}) {
  const tracker = queryTracker.track(query, meta);
  return {
    end: (error = null) => tracker.end(error),
  };
}

export function getActiveTraceInfo(reqId) {
  return activeTraces.get(reqId) || null;
}

export function getAllActiveTraces() {
  return Array.from(activeTraces.values());
}
