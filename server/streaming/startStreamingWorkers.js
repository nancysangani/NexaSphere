import logger from '../utils/logger.js';
import { startOutboxDispatcher } from './outboxDispatcher.js';

let outboxDispatcher = null;

export async function startStreamingWorkers() {
  // Dispatcher requires DB.
  // If DATABASE_URL not set, outboxRepository becomes a no-op; dispatcher should not run.
  if (!process.env.DATABASE_URL) {
    logger.info('[streamingWorkers] DATABASE_URL not set; skipping outbox dispatcher.');
    return;
  }

  if (outboxDispatcher) return;

  outboxDispatcher = await startOutboxDispatcher({
    pollMs: Number(process.env.OUTBOX_DISPATCHER_POLL_MS || 1000),
    batchSize: Number(process.env.OUTBOX_DISPATCHER_BATCH_SIZE || 50),
  });

  logger.info('[streamingWorkers] outbox dispatcher started');
}
