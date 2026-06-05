import { generateUUID } from '../utils/uuid.js';
import { notificationsRepository } from '../repositories/notificationsRepository.js';

const MAX_PER_USER = 10000;
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

const cache = new Map();

function _ensureCache(userId) {
  if (!cache.has(userId)) {
    cache.set(userId, null);
  }
  return cache.get(userId);
}

function _isExpired(note) {
  return Date.now() - new Date(note.createdAt).getTime() >= TTL_MS;
}

export function getNotifications(userId = 'global') {
  const list = _ensureList(userId);
  _removeExpired(list);
  return list.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
function _stripRowMeta(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link,
    isRead: row.isRead,
    createdAt: row.createdAt,
  };
}

export async function getNotifications(userId = 'global') {
  let list = _ensureCache(userId);
  if (list === null) {
    list = await notificationsRepository.list({ userId, limit: MAX_PER_USER });
    cache.set(userId, list);
  }
  list = list.filter((n) => !_isExpired(n));
  cache.set(userId, list);
  return list.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function addNotification(userId = 'global', payload = {}) {
  const row = await notificationsRepository.create({
    id: generateUUID(),
    userId,
    type: payload.type || 'system',
    title: payload.title || 'Notification',
    message: payload.message || '',
    link: payload.link || null,
    isRead: !!(payload.isRead ?? payload.is_read),
  });
  const note = _stripRowMeta(row);
  const list = _ensureCache(userId);
  if (list !== null) {
    list.unshift(note);
    while (list.length > MAX_PER_USER) {
      list.pop();
    }
  }
  return note;
}

export function markAsRead(userId = 'global', id) {
  const list = _ensureList(userId);
  let changed = false;
  for (const n of list) {
    if (n.id === id) {
      n.isRead = true;
      changed = true;
      break;
export async function markAsRead(userId = 'global', id) {
  const ok = await notificationsRepository.markAsRead(userId, id);
  if (ok) {
    const list = _ensureCache(userId);
    if (list) {
      const n = list.find((x) => x.id === id);
      if (n) n.isRead = true;
    }
  }
  return ok;
}

export function markAllAsRead(userId = 'global') {
  const list = _ensureList(userId);
  list.forEach((n) => (n.isRead = true));
export async function markAllAsRead(userId = 'global') {
  await notificationsRepository.markAllAsRead(userId);
  const list = _ensureCache(userId);
  if (list) {
    list.forEach((n) => (n.isRead = true));
  }
}

export async function clearAll(userId = 'global') {
  await notificationsRepository.clearAll(userId);
  cache.set(userId, []);
}

export function removeNotification(userId = 'global', id) {
  const list = _ensureList(userId);
  const idx = list.findIndex((n) => n.id === id);
  if (idx >= 0) {
    list.splice(idx, 1);
    return true;
export async function removeNotification(userId = 'global', id) {
  const ok = await notificationsRepository.remove(userId, id);
  if (ok) {
    const list = _ensureCache(userId);
    if (list) {
      const idx = list.findIndex((n) => n.id === id);
      if (idx >= 0) list.splice(idx, 1);
    }
  }
  return ok;
}

export function _resetCache() {
  cache.clear();
}

export default {
  getNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  clearAll,
  removeNotification,
};
