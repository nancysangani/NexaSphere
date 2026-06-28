import { outboxRepository } from './outboxRepository.js';
import logger from '../utils/logger.js';

/**
 * Enqueue user action into the durable outbox.
 *
 * If DB isn't configured, this returns null (so you should also decide
 * whether to publish directly in local/dev).
 */
export async function enqueueUserActionEvent({ type, user_id, event_id, timestamp, metadata }) {
  const id = await outboxRepository.enqueue({
    type,
    user_id,
    event_id,
    timestamp,
    metadata,
  });

  if (id) {
    return { ok: true, outboxId: id };
  }

  logger.warn('[eventEnqueuer] outbox enqueue skipped (DATABASE_URL not set?)');
  return { ok: false, outboxId: null };
}
