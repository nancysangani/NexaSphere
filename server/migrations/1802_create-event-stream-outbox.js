import { sql } from 'node-pg-migrate';

/**
 * Creates an outbox table for event stream processing.
 *
 * Note: project uses node-pg-migrate.
 */

export const shorthands = undefined;

export async function up(pgm) {
  await pgm.createExtension('pgcrypto');

  await pgm.createTable('event_stream_outbox', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    event_type: { type: 'text', notNull: true },
    user_id: { type: 'text', notNull: false },
    event_id: { type: 'text', notNull: false },
    event_timestamp: { type: 'timestamptz', notNull: true },
    metadata: { type: 'jsonb', notNull: true, default: pgm.func("'{}'::jsonb") },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    delivered_at: { type: 'timestamptz', notNull: false },
  });

  await pgm.createIndex('event_stream_outbox', 'event_stream_outbox_event_type_idx', {
    event_type: 'text',
  });

  await pgm.createIndex('event_stream_outbox', 'event_stream_outbox_event_id_idx', {
    event_id: 'text',
  });

  await pgm.createIndex('event_stream_outbox', 'event_stream_outbox_created_at_idx', {
    created_at: 'timestamptz',
  });
}

export async function down(pgm) {
  await pgm.dropTable('event_stream_outbox');
}
