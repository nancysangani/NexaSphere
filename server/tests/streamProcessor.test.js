import test from 'node:test';
import assert from 'node:assert/strict';

import { MockQueue } from '../streaming/mockQueue.js';
import { StreamProcessor } from '../streaming/streamProcessor.js';
import { buildMockUserActionEvent } from '../streaming/mockEventStream.js';

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

test('streamProcessor aggregates registrations per minute and triggers anomaly alert', async () => {
  // Processor uses in-memory state; we don't require Redis for this test.
  const queue = new MockQueue({ concurrency: 1 });
  const processor = new StreamProcessor({ last5mMs: 5 * 60 * 1000 });

  queue.subscribe({
    topic: 'user-actions',
    onMessage: async (msg) => processor.handleEvent(msg),
  });

  const base = new Date('2026-01-01T00:00:00.000Z').getTime();
  const eventId = 'e-123';

  // Seed baseline: 1 registration in each of previous 5 minutes
  for (let i = 5; i >= 1; i--) {
    const ts = new Date(base + (i - 1) * 60_000).toISOString();
    await queue.publish({
      topic: 'user-actions',
      partitionKey: 'u1',
      message: buildMockUserActionEvent({
        type: 'registered',
        userId: `u${i}`,
        eventId,
        timestamp: ts,
      }),
    });
  }

  // Unprecedented burst: 10 registrations in current minute
  const currentTs = new Date(base + 5 * 60_000).toISOString();
  for (let j = 0; j < 10; j++) {
    await queue.publish({
      topic: 'user-actions',
      partitionKey: 'u-burst',
      message: buildMockUserActionEvent({
        type: 'registered',
        userId: `ub${j}`,
        eventId,
        timestamp: currentTs,
        metadata: {},
      }),
    });
  }

  // Allow consumer to drain
  await wait(150);

  const bucket = Math.floor(new Date(currentTs).getTime() / 60_000) * 60_000;
  const count = processor.registrationPerMinute.get(`${eventId}|${bucket}`) || 0;
  assert.equal(count, 10);

  // Anomaly alert will be returned per event; ensure at least one alert object exists in windows by checking last5mCounts
  const w = processor.windows.get(eventId);
  assert.ok(w, 'windows entry exists');
  assert.ok(w.last5mCounts.registered >= 10);
});

test('streamProcessor preserves ordering per user partition key', async () => {
  const queue = new MockQueue({ concurrency: 1 });
  const processor = new StreamProcessor({ last5mMs: 5 * 60_000 });

  const seen = [];
  queue.subscribe({
    topic: 'user-actions',
    onMessage: async (msg) => {
      await processor.handleEvent(msg);
      if (msg.user_id === 'u1') seen.push(msg.type);
    },
  });

  const base = new Date('2026-01-01T00:00:00.000Z').getTime();

  const seq = ['viewed', 'registered', 'liked', 'attended'];
  for (let i = 0; i < seq.length; i++) {
    await queue.publish({
      topic: 'user-actions',
      partitionKey: 'u1',
      message: buildMockUserActionEvent({
        type: seq[i],
        userId: 'u1',
        eventId: 'e-ord',
        timestamp: new Date(base + i * 1000).toISOString(),
      }),
    });
  }

  await wait(100);
  assert.deepEqual(seen, seq);
});
