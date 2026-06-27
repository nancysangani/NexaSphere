/**
 * In-memory mock queue for stream processor development + QA.
 *
 * This is NOT production-grade MQ, but it enables:
 * - deterministic mock event streaming
 * - ordering guarantees per partitionKey
 * - consumer worker execution in-process
 */

export class MockQueue {
  constructor({ concurrency = 1 } = {}) {
    this.concurrency = Math.max(1, concurrency);
    this.topics = new Map(); // topic -> { partitions: Map<key, Array>, consumers: [] }
  }

  _ensureTopic(topic) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, {
        partitions: new Map(),
        consumers: new Set(),
      });
    }
    return this.topics.get(topic);
  }

  /**
   * Publish event to topic.
   * @param {{topic: string, message: any, partitionKey?: string}} args
   */
  async publish({ topic, message, partitionKey = 'default' }) {
    const t = this._ensureTopic(topic);
    const key = String(partitionKey);
    if (!t.partitions.has(key)) t.partitions.set(key, []);
    t.partitions.get(key).push({
      message,
      publishedAt: new Date().toISOString(),
    });

    // Wake consumers
    for (const c of t.consumers) {
      c._notify();
    }
  }

  /**
   * Create consumer subscription.
   */
  subscribe({ topic, onMessage, partitionKeyResolver = null } = {}) {
    const t = this._ensureTopic(topic);

    const consumer = {
      _stopped: false,
      _notify: () => {
        if (!consumer._running) return;
      },
      stop: () => {
        consumer._stopped = true;
      },
    };

    // The actual worker loop
    consumer._running = true;

    const worker = async () => {
      // Simple round-robin across partitions, processing one message at a time per partition
      const seenPartitions = () => Array.from(t.partitions.keys());
      while (!consumer._stopped) {
        const partitions = seenPartitions();
        let processedAny = false;

        for (const pKey of partitions) {
          const q = t.partitions.get(pKey);
          if (!q || q.length === 0) continue;

          // Process first message in this partition
          const item = q.shift();
          processedAny = true;

          // Await handler to preserve ordering within partition
          await onMessage(item.message, {
            partitionKey: pKey,
            publishedAt: item.publishedAt,
          });
        }

        if (!processedAny) {
          // backoff
          await new Promise((r) => setTimeout(r, 20));
        }
      }
    };

    // Kick off worker (respect concurrency by running multiple workers)
    consumer._workers = Array.from({ length: this.concurrency }).map(() => worker());

    t.consumers.add(consumer);
    return consumer;
  }
}

export default MockQueue;
