import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '..', 'logs');
const SLOW_QUERY_LOG = path.join(LOG_DIR, 'slow-queries.log');

const SLOW_QUERY_THRESHOLD_MS = 100;

const queryPatterns = new Map();
const MAX_PATTERNS = 500;

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

const logStream = (() => {
  ensureLogDir();
  return fs.createWriteStream(SLOW_QUERY_LOG, { flags: 'a' });
})();

function normalizeQuery(text) {
  if (!text || typeof text !== 'string') return 'unknown';
  return text
    .replace(/\b\d+\b/g, '?')
    .replace(/'[^']*'/g, "'?'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

export function recordSlowQuery(queryText, durationMs, meta = {}) {
  const normalized = normalizeQuery(queryText);

  // Track pattern
  if (!queryPatterns.has(normalized)) {
    if (queryPatterns.size >= MAX_PATTERNS) {
      const oldest = queryPatterns.keys().next().value;
      queryPatterns.delete(oldest);
    }
    queryPatterns.set(normalized, { count: 0, totalDuration: 0, maxDuration: 0, lastSeen: null });
  }
  const pattern = queryPatterns.get(normalized);
  pattern.count += 1;
  pattern.totalDuration += durationMs;
  pattern.maxDuration = Math.max(pattern.maxDuration, durationMs);
  pattern.lastSeen = new Date().toISOString();

  // Log slow queries
  if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
    const entry = {
      timestamp: new Date().toISOString(),
      query: normalized,
      durationMs,
      rawQuery: queryText.slice(0, 500),
      meta,
    };
    logStream.write(JSON.stringify(entry) + '\n');
  }
}

export function getQueryPatterns() {
  const result = [];
  for (const [query, data] of queryPatterns) {
    result.push({
      query,
      count: data.count,
      avgDurationMs: data.totalDuration / data.count,
      maxDurationMs: data.maxDuration,
      lastSeen: data.lastSeen,
    });
  }
  result.sort((a, b) => b.avgDurationMs - a.avgDurationMs);
  return result;
}

export function getSlowQueryAnalysis() {
  const patterns = getQueryPatterns();
  const totalQueries = patterns.reduce((sum, p) => sum + p.count, 0);
  const slowQueries = patterns.filter((p) => p.avgDurationMs >= SLOW_QUERY_THRESHOLD_MS);
  return {
    totalQueries,
    slowQueryCount: slowQueries.length,
    slowQueryPercentage: totalQueries > 0 ? (slowQueries.length / totalQueries) * 100 : 0,
    patterns: patterns.slice(0, 50),
  };
}
