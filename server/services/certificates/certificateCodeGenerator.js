import crypto from 'crypto';

export function generateCertificateCode({ userId, eventId }) {
  // Placeholder: final PR should guarantee uniqueness at DB level.
  return crypto
    .createHash('sha256')
    .update(`${userId}:${eventId}:${Date.now()}`)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();
}
