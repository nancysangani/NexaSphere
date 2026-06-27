// Placeholder QR generator.

export function buildVerificationPayload({ code }) {
  return {
    type: 'certificate_verification',
    code,
  };
}

export function buildVerificationUrl({ baseUrl, code }) {
  return `${baseUrl || ''}/certificates/verify/${encodeURIComponent(code)}`;
}
