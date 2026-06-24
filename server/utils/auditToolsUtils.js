/**
 * auditToolsUtils.js
 * Utility helpers for audit tools.
 */

import crypto from 'crypto';

export function stableFingerprint(input) {
  const str = JSON.stringify(input ?? {});
  return crypto.createHash('sha256').update(str).digest('hex');
}

export function normaliseSeverity(severity) {
  const s = String(severity || '').toLowerCase();
  if (s === 'critical') return 'Critical';
  if (s === 'serious') return 'Serious';
  if (s === 'minor') return 'Minor';
  // Default to Minor to avoid dropping issues.
  return 'Minor';
}
