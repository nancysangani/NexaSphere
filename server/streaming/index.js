import { MockQueue } from './mockQueue.js';
import { StreamProcessor } from './streamProcessor.js';

export function createStreamingSystem({ topic = 'user-actions', concurrency = 1 } = {}) {
  const queue = new MockQueue({ concurrency });
  const processor = new StreamProcessor({ queueTopic: topic });

  return {
    queue,
    processor,
    startConsumer: async () => {
      queue.subscribe({
        topic,
        onMessage: async (msg) => processor.handleEvent(msg),
      });
    },
  };
}
