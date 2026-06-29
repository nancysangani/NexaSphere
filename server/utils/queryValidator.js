export function validateQueryInput(value, fieldName) {
  if (typeof value !== 'string') return { valid: true };

  // Reject null bytes
  if (value.includes('\0')) {
    return { valid: false, error: `${fieldName} contains null byte` };
  }

  // Reject overly long inputs (likely injection attempts)
  if (value.length > 2000) {
    return { valid: false, error: `${fieldName} exceeds maximum length` };
  }

  return { valid: true };
}

export function sanitizeIdentifier(identifier) {
  if (typeof identifier !== 'string') return '';
  // Only allow alphanumeric and underscores for SQL identifiers
  return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}
