import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const DEFAULT_PERIOD_SECONDS = 30;
const DEFAULT_DIGITS = 6;

function base32Encode(buffer) {
  let bits = '';
  let output = '';

  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0');
  }

  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    output += BASE32_ALPHABET[parseInt(chunk, 2)];
  }

  return output;
}

function base32Decode(value) {
  const clean = String(value || '')
    .replace(/=+$/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();
  let bits = '';

  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error('Invalid base32 secret');
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

export function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

export function buildOtpAuthUrl({ issuer = 'NexaSphere Admin', username, secret }) {
  const label = `${issuer}:${username}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(DEFAULT_DIGITS),
    period: String(DEFAULT_PERIOD_SECONDS),
  });

  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

export function generateTotpCode(secret, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 1000 / DEFAULT_PERIOD_SECONDS);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', base32Decode(secret)).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 10 ** DEFAULT_DIGITS).padStart(DEFAULT_DIGITS, '0');
}

export function verifyTotpCode(secret, code, { window = 1, timestamp = Date.now() } = {}) {
  const cleanCode = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanCode)) return false;

  for (let step = -window; step <= window; step += 1) {
    const stepTime = timestamp + step * DEFAULT_PERIOD_SECONDS * 1000;
    const expected = generateTotpCode(secret, stepTime);
    if (crypto.timingSafeEqual(Buffer.from(cleanCode), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}

export function hashSecurityValue(value, salt = process.env.ADMIN_SECURITY_PEPPER || '') {
  return crypto
    .createHash('sha256')
    .update(`${salt}:${String(value)}`)
    .digest('hex');
}

export function generateBackupCodes(count = 8) {
  return Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}
