/**
 * Adapter to expose MockQueue via the QueueAdapter interface.
 */

import { MockQueue } from './mockQueue.js';
import { QueueAdapter } from './queueAdapter.js';

export class MockQueueAdapter extends QueueAdapter {
  constructor({ concurrency = 1 } = {}) {
    super();
    this.queue = new MockQueue({ concurrency });
  }

  async publish({ topic, partitionKey, message }) {
    await this.queue.publish({ topic, partitionKey, message });
  }

  subscribe({ topic, onMessage, partitionKeyResolver = null } = {}) {
    return this.queue.subscribe({
      topic,
      onMessage: async (msg) => {
        // MockQueue passes only message; keep signature compatible
        await onMessage(msg);
      },
    });
  }
}
