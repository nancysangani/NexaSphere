import logger from '../utils/logger.js';
import { enqueueUserActionEvent } from './eventEnqueuer.js';
import { getStreamingAdapter } from './streamingFactory.js';

let consumerStarted = false;

export async function ensureStreamConsumerStarted() {
  // Consumer is currently in the mock in-process system.
  // Real queue consumers will be implemented in real adapters later.
  if (consumerStarted) return;

  // Start the in-process consumer so dashboard updates work in mock mode.
  const { createStreamingSystem } = await import('./index.js');
  const system = createStreamingSystem();
  await system.startConsumer();

  consumerStarted = true;
  logger.info('[eventPublisher] Stream processor consumer started');
}

/**
 * Publish user action event.
 *
 * Production path:
 * - enqueue to durable outbox
 *
 * Dev/test fallback:
 * - if outbox enqueue is skipped, publish directly into the streaming adapter
 *
 * @returns {{enqueued: boolean}}
 */
export async function publishUserActionEvent({
  type,
  user_id,
  event_id,
  timestamp,
  metadata,
  partitionKey,
}) {
  await ensureStreamConsumerStarted();

  const { ok } = await enqueueUserActionEvent({
    type,
    user_id,
    event_id,
    timestamp,
    metadata,
  });

  if (ok) {
    return { enqueued: true };
  }

  // Fallback: direct publish (no durable guarantee)
  const adapter = await getStreamingAdapter();
  await adapter.publish({
    topic: 'user-actions',
    partitionKey: partitionKey || user_id || 'anon',
    message: {
      type,
      user_id,
      event_id,
      timestamp,
      metadata,
    },
  });

  return { enqueued: false };
}
