import crypto from 'crypto';

import { withDb } from './db.js';
import { hashSecurityValue } from '../utils/adminTotp.js';

let schemaReady = null;

async function ensureSchema(client) {
  await client.query(`
    create table if not exists admin_security_accounts (
      username text primary key,
      totp_secret text,
      backup_code_hashes jsonb not null default '[]'::jsonb,
      two_factor_enabled boolean not null default false,
      grace_ends_at timestamptz not null default (now() + interval '30 days'),
      recovery_email text,
      ip_whitelist jsonb not null default '[]'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  await client.query(`
    create table if not exists admin_login_history (
      id uuid primary key,
      username text not null,
      ip_address text,
      location text,
      user_agent text,
      device text,
      suspicious boolean not null default false,
      reason text,
      success boolean not null default true,
      created_at timestamptz not null default now()
    )
  `);

  await client.query(
    'create index if not exists idx_admin_login_history_username_created on admin_login_history (username, created_at desc)'
  );
}

async function ensureReady() {
  if (!schemaReady) {
    schemaReady = withDb(async (client) => ensureSchema(client)).catch((err) => {
      schemaReady = null;
      throw err;
    });
  }

  return schemaReady;
}

function normalizeUsername(username) {
  return String(username || '')
    .trim()
    .toLowerCase();
}

export function describeDevice(userAgent = '') {
  const ua = String(userAgent || '');
  const browser = /edg/i.test(ua)
    ? 'Edge'
    : /chrome/i.test(ua)
      ? 'Chrome'
      : /firefox/i.test(ua)
        ? 'Firefox'
        : /safari/i.test(ua)
          ? 'Safari'
          : 'Unknown browser';
  const os = /windows/i.test(ua)
    ? 'Windows'
    : /mac os|macintosh/i.test(ua)
      ? 'macOS'
      : /android/i.test(ua)
        ? 'Android'
        : /iphone|ipad/i.test(ua)
          ? 'iOS'
          : /linux/i.test(ua)
            ? 'Linux'
            : 'Unknown OS';

  return `${browser} on ${os}`;
}

export function describeLocation(ip = '') {
  const value = String(ip || '').trim();
  if (!value || value === 'unknown') return 'Unknown location';
  if (
    value === '::1' ||
    value === '127.0.0.1' ||
    value.startsWith('10.') ||
    value.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(value)
  ) {
    return 'Private network';
  }
  return process.env.ADMIN_GEOLOCATION_LABEL || 'External network';
}

export async function getOrCreateAdminSecurityAccount(username, recoveryEmail) {
  const normalized = normalizeUsername(username);
  await ensureReady();

  return withDb(async (client) => {
    await client.query(
      `insert into admin_security_accounts (username, recovery_email)
       values ($1, $2)
       on conflict (username) do nothing`,
      [normalized, recoveryEmail || normalized]
    );

    const { rows } = await client.query(
      `select username, totp_secret, backup_code_hashes, two_factor_enabled, grace_ends_at,
              recovery_email, ip_whitelist, created_at, updated_at
       from admin_security_accounts
       where username = $1`,
      [normalized]
    );

    return rows[0] || null;
  });
}

export async function enableAdminTwoFactor({ username, secret, backupCodes }) {
  const normalized = normalizeUsername(username);
  const hashes = backupCodes.map((code) => hashSecurityValue(code));
  await ensureReady();

  await withDb(async (client) => {
    await client.query(
      `insert into admin_security_accounts
         (username, totp_secret, backup_code_hashes, two_factor_enabled, grace_ends_at, updated_at)
       values ($1, $2, $3, true, now(), now())
       on conflict (username) do update set
         totp_secret = excluded.totp_secret,
         backup_code_hashes = excluded.backup_code_hashes,
         two_factor_enabled = true,
         grace_ends_at = now(),
         updated_at = now()`,
      [normalized, secret, JSON.stringify(hashes)]
    );
  });
}

export async function verifyAndConsumeBackupCode(username, code) {
  const normalized = normalizeUsername(username);
  const codeHash = hashSecurityValue(code);
  await ensureReady();

  return withDb(async (client) => {
    const { rows } = await client.query(
      `select backup_code_hashes from admin_security_accounts
       where username = $1 and two_factor_enabled = true`,
      [normalized]
    );
    const hashes = rows[0]?.backup_code_hashes || [];
    if (!hashes.includes(codeHash)) return false;

    const remaining = hashes.filter((hash) => hash !== codeHash);
    await client.query(
      `update admin_security_accounts
       set backup_code_hashes = $2, updated_at = now()
       where username = $1`,
      [normalized, JSON.stringify(remaining)]
    );
    return true;
  });
}

export async function recordAdminLoginAttempt({
  username,
  ipAddress,
  userAgent,
  success,
  suspicious,
  reason,
}) {
  const normalized = normalizeUsername(username);
  await ensureReady();

  const entry = {
    id: crypto.randomUUID(),
    username: normalized,
    ipAddress,
    userAgent,
    device: describeDevice(userAgent),
    location: describeLocation(ipAddress),
    success: !!success,
    suspicious: !!suspicious,
    reason: reason || null,
  };

  await withDb(async (client) => {
    await client.query(
      `insert into admin_login_history
        (id, username, ip_address, location, user_agent, device, success, suspicious, reason)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        entry.id,
        entry.username,
        entry.ipAddress,
        entry.location,
        entry.userAgent,
        entry.device,
        entry.success,
        entry.suspicious,
        entry.reason,
      ]
    );
  });

  return entry;
}

export async function assessSuspiciousLogin({ username, ipAddress, userAgent }) {
  const normalized = normalizeUsername(username);
  await ensureReady();

  return withDb(async (client) => {
    const { rows } = await client.query(
      `select ip_address, device, extract(hour from created_at) as login_hour
       from admin_login_history
       where username = $1 and success = true
       order by created_at desc
       limit 20`,
      [normalized]
    );

    if (!rows.length) {
      return { suspicious: false, reason: null };
    }

    const device = describeDevice(userAgent);
    const hour = new Date().getHours();
    const knownIp = rows.some((row) => row.ip_address === ipAddress);
    const knownDevice = rows.some((row) => row.device === device);
    const knownHour = rows.some((row) => Math.abs(Number(row.login_hour) - hour) <= 3);

    if (!knownIp) return { suspicious: true, reason: 'new_ip' };
    if (!knownDevice) return { suspicious: true, reason: 'new_device' };
    if (!knownHour) return { suspicious: true, reason: 'unusual_time' };
    return { suspicious: false, reason: null };
  });
}

export async function listAdminLoginHistory(username, limit = 10) {
  const normalized = normalizeUsername(username);
  await ensureReady();

  return withDb(async (client) => {
    const { rows } = await client.query(
      `select id, username, ip_address, location, user_agent, device, success, suspicious, reason, created_at
       from admin_login_history
       where username = $1
       order by created_at desc
       limit $2`,
      [normalized, Math.min(Math.max(Number(limit) || 10, 1), 50)]
    );
    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      ipAddress: row.ip_address,
      location: row.location,
      userAgent: row.user_agent,
      device: row.device,
      success: row.success,
      suspicious: row.suspicious,
      reason: row.reason,
      createdAt: row.created_at,
    }));
  });
}
