import logger from '../utils/logger.js';
import { withDb } from '../repositories/db.js';
import { getStreamingAdapter } from './streamingFactory.js';

const DEFAULT_POLL_MS = 1000;
const DEFAULT_BATCH_SIZE = 50;

function safeJsonParse(v) {
  if (!v) return {};
  try {
    return typeof v === 'string' ? JSON.parse(v) : v;
  } catch {
    return {};
  }
}

/**
 * Outbox dispatcher worker.
 *
 * Reads undispatched messages from event_stream_outbox, publishes to MQ,
 * and marks delivered_at.
 *
 * Idempotency: we mark delivered_at after successful publish.
 */
export async function startOutboxDispatcher({
  pollMs = DEFAULT_POLL_MS,
  batchSize = DEFAULT_BATCH_SIZE,
} = {}) {
  let stopped = false;

  const adapter = await getStreamingAdapter();

  async function loop() {
    while (!stopped) {
      try {
        const rows = await withDb(async (client) => {
          // Select & lock a batch
          const { rows } = await client.query(
            `SELECT id, event_type, user_id, event_id, event_timestamp, metadata
             FROM event_stream_outbox
             WHERE delivered_at IS NULL
             ORDER BY created_at ASC
             LIMIT $1
             FOR UPDATE SKIP LOCKED`,
            [batchSize]
          );
          return rows;
        });

        if (!rows.length) {
          await new Promise((r) => setTimeout(r, pollMs));
          continue;
        }

        for (const row of rows) {
          const metadata = safeJsonParse(row.metadata);

          // Publish payload matching StreamProcessor normalization expectations
          await adapter.publish({
            topic: 'user-actions',
            partitionKey: row.user_id || row.event_id || 'anon',
            message: {
              type: row.event_type,
              user_id: row.user_id,
              event_id: row.event_id,
              timestamp: row.event_timestamp,
              metadata,
            },
          });

          await withDb(async (client) => {
            await client.query(
              `UPDATE event_stream_outbox
               SET delivered_at = NOW()
               WHERE id = $1 AND delivered_at IS NULL`,
              [row.id]
            );
          });
        }
      } catch (err) {
        logger.error('[outboxDispatcher] error', { err: err?.message || String(err) });
        await new Promise((r) => setTimeout(r, pollMs));
      }
    }
  }

  loop();

  return {
    stop() {
      stopped = true;
    },
  };
}
