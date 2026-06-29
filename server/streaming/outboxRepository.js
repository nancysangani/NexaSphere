import { withDb } from '../repositories/db.js';

/**
 * Minimal outbox repository.
 *
 * Production should use a transactional outbox table and a worker that
 * publishes to the MQ and marks messages as delivered.
 *
 * For this task P2, we provide a lightweight implementation that works when
 * DB is configured; otherwise it degrades to no-op.
 */

export const outboxRepository = {
  async enqueue({ type, user_id, event_id, timestamp, metadata }) {
    if (!process.env.DATABASE_URL) {
      return null;
    }

    return withDb(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO event_stream_outbox (event_type, user_id, event_id, event_timestamp, metadata)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          type,
          user_id || null,
          event_id || null,
          timestamp || new Date().toISOString(),
          JSON.stringify(metadata || {}),
        ]
      );
      return rows[0]?.id || null;
    });
  },
};
