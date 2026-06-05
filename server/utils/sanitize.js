const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/[&<>"'`]/g, (character) => HTML_ESCAPE_MAP[character])
    .trim();
}

function sanitizeText(value, max = 4000) {
  return escapeHtml(
    String(value ?? '')
      .trim()
      .slice(0, max)
  );
}

function sanitizeNullableText(value, max = 4000) {
  const text = String(value ?? '')
    .trim()
    .slice(0, max);
  return text ? escapeHtml(text) : null;
}

function sanitizeTextArray(values, max = 40) {
  if (!Array.isArray(values)) {
    return String(values || '')
      .split(',')
      .map((entry) => sanitizeText(entry, max))
      .filter(Boolean)
      .slice(0, 12);
  }

  return values
    .map((entry) => sanitizeText(entry, max))
    .filter(Boolean)
    .slice(0, 12);
}

export function sanitizeEventRecord(event = {}) {
  return {
    ...event,
    name: sanitizeText(event.name, 120),
    shortName: sanitizeText(event.shortName || event.name, 60),
    date: sanitizeText(event.date, 80),
    description: sanitizeText(event.description, 1200),
    icon: sanitizeText(event.icon || 'Pin', 32),
    tags: sanitizeTextArray(event.tags, 40),
  };
}

export function sanitizeActivityEventRecord(event = {}) {
  const { createdBy, ...rest } = event;
  return {
    ...rest,
    name: sanitizeText(event.name, 120),
    date: sanitizeText(event.date, 80),
    tagline: sanitizeNullableText(event.tagline, 240),
    description: sanitizeText(event.description, 1200),
  };
}

export function sanitizeCoreTeamMemberRecord(member = {}) {
  return {
    ...member,
    name: sanitizeText(member.name, 100),
    role: sanitizeText(member.role, 100),
    year: sanitizeText(member.year, 20),
    branch: sanitizeText(member.branch, 100),
    section: sanitizeText(member.section, 12),
    email: sanitizeText(member.email, 140),
    whatsapp: sanitizeText(member.whatsapp, 40),
    linkedin: sanitizeNullableText(member.linkedin, 255),
    instagram: sanitizeNullableText(member.instagram, 255),
    photoUrl: sanitizeNullableText(member.photoUrl, 500),
  };
}

// ============================================================
// Portfolio sanitization (issue #969)
//
// Portfolio content is rendered to anonymous visitors at
// /p/:username, so any HTML or javascript: URL stored in the
// database becomes a stored XSS vector.  The strategy below:
//
//   * strip ALL HTML from plain-text fields (bio, title, etc.)
//   * normalize unicode whitespace and control characters
//   * validate every URL field against an https?:// allowlist
//   * apply the same rules recursively to JSONB array/object
//     fields (skills, projects, roadmaps, badges, seoMetadata)
// ============================================================
function toSafeString(value, max = 4000) {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

function normalizePhone(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

const SAFE_URL_PROTOCOLS = /^(https?:\/\/|\/[^\/])/i;
const URL_MAX_LENGTH = 2048;

const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/gi;
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;
const SCRIPT_PATTERN = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;
const STYLE_PATTERN = /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi;
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const NULL_BYTE_PATTERN = /\u0000/g;
function validateSection(str) {
  const v = String(str || '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z]$/.test(v)) throw new Error('Section must be a single letter (A-Z)');
  return v;
}

export {
  escapeHtml,
  sanitizeNullableText,
  sanitizeText,
  sanitizeTextArray,
  stripHtml,
  stripHtmlTruncated,
  toSafeString,
  normalizePhone,
  validateWhatsApp,
  validateSection,
};
