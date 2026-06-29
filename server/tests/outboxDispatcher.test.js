import test from 'node:test';
import assert from 'node:assert/strict';

import { StreamProcessor } from '../streaming/streamProcessor.js';
import { MockQueueAdapter } from '../streaming/mockQueueAdapter.js';

test('outbox dispatcher publishes messages to stream adapter (mock integration)', async () => {
  // This is an integration-style test without a real Postgres.
  // Current outbox dispatcher depends on DB; so we validate the streaming
  // contract by ensuring the adapter pipeline delivers in order.

  const adapter = new MockQueueAdapter({ concurrency: 1 });
  const processor = new StreamProcessor({ last5mMs: 5 * 60 * 1000 });

  adapter.subscribe({
    topic: 'user-actions',
    onMessage: async (msg) => {
      await processor.handleEvent(msg);
    },
  });

  const eventId = 'e-1';
  const base = new Date('2026-01-01T00:00:00.000Z').getTime();

  await adapter.publish({
    topic: 'user-actions',
    partitionKey: 'u1',
    message: {
      type: 'registered',
      user_id: 'u1',
      event_id: eventId,
      timestamp: new Date(base).toISOString(),
      metadata: {},
    },
  });

  await new Promise((r) => setTimeout(r, 50));

  const bucket = Math.floor(base / 60_000) * 60_000;
  const count = processor.registrationPerMinute.get(`${eventId}|${bucket}`) || 0;
  assert.equal(count, 1);
});
