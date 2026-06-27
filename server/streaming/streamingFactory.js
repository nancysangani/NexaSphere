import logger from '../utils/logger.js';
import { MockQueueAdapter } from './mockQueueAdapter.js';

let singleton = null;

export async function getStreamingAdapter() {
  if (singleton) return singleton;

  // Future: swap implementations for Kafka/RabbitMQ/Kinesis.
  const provider = (process.env.STREAMING_PROVIDER || 'mock').toLowerCase();

  if (provider === 'mock') {
    singleton = new MockQueueAdapter({
      concurrency: Number(process.env.STREAMING_CONCURRENCY || 1),
    });
    logger.info('[streamingFactory] Using MockQueueAdapter');
    return singleton;
  }

  throw new Error(
    `[streamingFactory] Unsupported STREAMING_PROVIDER='${provider}'. Implement a real adapter first.`
  );
}
