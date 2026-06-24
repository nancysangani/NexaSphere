/**
 * auditWorker.js
 * Placeholder worker for audit runs.
 * Future versions should integrate with BullMQ.
 */

import logger from '../utils/logger.js';
import { runComplianceAudit } from '../services/complianceAuditEngine.js';

export async function runAuditJob({ runType, createdByAdminId, targetScope, metadata }) {
  logger.info('[auditWorker] Starting job', { runType });
  const run = await runComplianceAudit({ runType, createdByAdminId, targetScope, metadata });
  logger.info('[auditWorker] Finished job', { runId: run?.id, runType });
  return run;
}
