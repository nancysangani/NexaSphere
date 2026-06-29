const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|alter|create|truncate|exec|execute)\b[\s\S]*?\b(from|into|set|table|database|procedure)\b)/i,
  /(\b(OR|AND)\b\s+\d+\s*[=<>])/i,
  /([';])\s*(--|#|\/\*)/,
  /(\b(LOAD_FILE|INTO_OUTFILE|INTO_DUMPFILE|BENCHMARK|SLEEP|WAITFOR)\b)/i,
  /(\bINFORMATION_SCHEMA\b)/i,
  /(\b0x[0-9a-fA-F]+\b)/i,
];

function hasSqliPattern(value) {
  if (typeof value === 'string') {
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some(v => hasSqliPattern(v));
  }
  return false;
}

export function sqlInjectionGuard(req, res, next) {
  const suspicious = [];

  // Check query parameters
  if (req.query && hasSqliPattern(req.query)) {
    suspicious.push('query');
  }

  // Check body
  if (req.body && hasSqliPattern(req.body)) {
    suspicious.push('body');
  }

  // Check params
  if (req.params && hasSqliPattern(req.params)) {
    suspicious.push('params');
  }

  if (suspicious.length > 0) {
    console.warn(`[SQLI-GUARD] Blocked request from ${req.ip} - suspicious patterns in: ${suspicious.join(', ')}`);
    return res.status(400).json({ error: 'Request contains invalid patterns' });
  }

  next();
}
