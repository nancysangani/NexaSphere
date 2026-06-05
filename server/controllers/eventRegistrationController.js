import { capacityLockingService } from '../services/capacityLockingService.js';

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      const status = e.status || 500;
      res.status(status).json({ error: e?.message || 'Internal server error' });
    });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EVENT_ID_REGEX = /^[a-zA-Z0-9\-_]{1,100}$/;

export const registerForEvent = wrapAsync(async (req, res) => {
  const eventId = String(req.params.eventId || '').trim();
  const sanitizedFullName = String(req.body.fullName || '')
    .trim()
    .slice(0, 120);
  const sanitizedEmail = String(req.body.email || '')
    .trim()
    .toLowerCase()
    .slice(0, 140);

  if (!eventId || !EVENT_ID_REGEX.test(eventId)) {
    return res.status(400).json({ error: 'Invalid event ID' });
  }
  if (!sanitizedFullName) {
    return res.status(400).json({ error: 'Full name is required' });
  }
  if (!sanitizedEmail || !EMAIL_REGEX.test(sanitizedEmail)) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }

  const result = await capacityLockingService.registerForEvent(
    eventId,
    sanitizedFullName,
    sanitizedEmail
  );
  return res.status(201).json(result);
});
