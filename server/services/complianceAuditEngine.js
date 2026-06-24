/**
 * complianceAuditEngine.js
 * Main orchestration engine for Compliance & Accessibility Audit Tools (#1801)
 */

import logger from '../utils/logger.js';
import { auditToolsRepository } from '../repositories/auditToolsRepository.js';
import { scanUrlsForWcag } from './wcagScanner.js';
import { runGdprChecklist } from './gdprChecklistEngine.js';
import { runPciComplianceCheck } from './pciComplianceEngine.js';

function getTargetUrls(targetScope = {}) {
  // Default: scan common public pages; engines can be extended to auto-discover.
  return Array.isArray(targetScope.urls)
    ? targetScope.urls
    : ['/events', '/about', '/', '/contact', '/forum', '/portfolio'].filter(Boolean);
}

async function runWcagAudit({ targetScope }) {
  const baseUrl = targetScope?.baseUrl || 'http://localhost:5175';
  const urls = getTargetUrls(targetScope);
  return await scanUrlsForWcag({ baseUrl, urls });
}

async function runGdprAudit({ targetScope }) {
  return await runGdprChecklist({ targetScope, config: targetScope?.config });
}

async function runPciAudit({ targetScope }) {
  return await runPciComplianceCheck({ targetScope, config: targetScope?.config });
}

async function runWeeklyAudit({ targetScope }) {
  // Weekly audit runs WCAG subset + GDPR + PCI guidance checks.
  const [wcag, gdpr, pci] = await Promise.all([
    runWcagAudit({ targetScope }),
    runGdprAudit({ targetScope }),
    runPciAudit({ targetScope }),
  ]);

  return {
    issues: [...(wcag.issues || []), ...(gdpr.issues || []), ...(pci.issues || [])],
    summary: {
      wcag: wcag.summary,
      gdpr: gdpr.summary,
      pci: pci.summary,
    },
  };
}

export async function runComplianceAudit({
  runType,
  createdByAdminId,
  targetScope = {},
  metadata = {},
}) {
  const run = await auditToolsRepository.createAuditRun({
    runType,
    createdByAdminId,
    targetScope,
    metadata,
    summary: {},
  });

  try {
    let result;
    switch (runType) {
      case 'wcag':
        result = await runWcagAudit({ targetScope });
        break;
      case 'gdpr':
        result = await runGdprAudit({ targetScope });
        break;
      case 'pci':
        result = await runPciAudit({ targetScope });
        break;
      case 'weekly':
        result = await runWeeklyAudit({ targetScope });
        break;
      default:
        throw new Error(`Unknown runType: ${runType}`);
    }

    // Persist issues
    const issues = Array.isArray(result?.issues) ? result.issues : [];
    for (const issue of issues) {
      await auditToolsRepository.upsertIssueForRun({
        runId: run.id,
        issue,
      });
    }

    const summary = result?.summary || {};
    const finished = await auditToolsRepository.updateAuditRunStatus(run.id, {
      status: 'completed',
      finishedAt: new Date().toISOString(),
      summary,
    });

    logger.info('[complianceAuditEngine] Completed audit', {
      runId: run.id,
      issues: issues.length,
    });
    return finished;
  } catch (err) {
    logger.error('[complianceAuditEngine] Audit failed', { runId: run.id, error: err?.message });
    await auditToolsRepository.updateAuditRunStatus(run.id, {
      status: 'failed',
      finishedAt: new Date().toISOString(),
      summary: { error: err?.message },
    });
    throw err;
  }
}
