/**
 * gdprChecklistEngine.js
 * GDPR compliance checklist engine for Audit Tools (#1801)
 */

import { stableFingerprint } from '../utils/auditToolsUtils.js';

function severityFromScore(score) {
  if (score <= 0.3) return 'Critical';
  if (score <= 0.7) return 'Serious';
  return 'Minor';
}

/**
 * Checklist items are currently policy/practice aligned.
 * Real-world data-flow validation requires deeper integration hooks.
 */
export async function runGdprChecklist({ targetScope = {}, config = {} } = {}) {
  const issues = [];

  const items = [
    {
      issue_type: 'gdpr_policy_matches_practice',
      title: 'Privacy policy matches platform practices',
      description:
        'Verify that the privacy policy content reflects actual data collection, processing, and third-party sharing in the running platform.',
      evidence: {
        note: 'Engine currently produces guidance-only evidence. Wire to real telemetry in a follow-up PR.',
      },
      recommended_fix:
        'Cross-check Privacy Policy sections with production data flows (frontend analytics, forms, storage, third-party services) and update policy text accordingly.',
      suggested_fix_json: { checklistItem: 'privacy_policy_matches_practice' },
      severityScore: 0.4,
      page_url: null,
      selector: null,
      fingerprintSeed: 'privacy-policy-vs-practices',
    },
    {
      issue_type: 'gdpr_data_retention',
      title: 'Data retention schedule is defined and enforced',
      description:
        'Confirm that collected personal data has a defined retention period and that old data is deleted/archived in accordance with the schedule.',
      evidence: {
        hint: 'Repository includes audit log retention cleanup; audit checklist should connect to user-data tables when available.',
      },
      recommended_fix:
        'Document retention periods by data category and implement scheduled deletion jobs for each category.',
      suggested_fix_json: { checklistItem: 'data_retention' },
      severityScore: 0.5,
      page_url: null,
      selector: null,
      fingerprintSeed: 'retention-schedule',
    },
    {
      issue_type: 'gdpr_consent_tracking',
      title: 'Consent tracking for marketing emails is implemented',
      description:
        'Verify that marketing consent is captured, stored, and tied to the user, and that opt-out requests are honored.',
      evidence: {
        hint: 'Integrate with email campaign consent/notification preferences in production.',
      },
      recommended_fix:
        'Ensure consent is recorded with timestamp and version; block marketing sends unless consent is present and allow withdrawal.',
      suggested_fix_json: { checklistItem: 'marketing_consent' },
      severityScore: 0.6,
      page_url: null,
      selector: null,
      fingerprintSeed: 'consent-tracking',
    },
    {
      issue_type: 'gdpr_right_to_deletion',
      title: 'Right to deletion workflow can delete user data',
      description:
        'Confirm that data deletion requests fully remove or anonymize user data across storage locations.',
      evidence: {
        hint: 'This engine is guidance-only; connect to actual deletion endpoints/workers.',
      },
      recommended_fix:
        'Implement and test deletion across all storage layers (DB, files, caches, third-party systems) and verify in audits.',
      suggested_fix_json: { checklistItem: 'right_to_deletion' },
      severityScore: 0.35,
      page_url: null,
      selector: null,
      fingerprintSeed: 'deletion-workflow',
    },
    {
      issue_type: 'gdpr_data_portability',
      title: 'Data portability export is available to users',
      description:
        'Confirm that data export requests produce a complete, structured export of user personal data.',
      evidence: {
        hint: 'Connect to actual export endpoints when available.',
      },
      recommended_fix:
        'Provide user data export in common formats (JSON/CSV) and include retention/processing notes where applicable.',
      suggested_fix_json: { checklistItem: 'data_portability' },
      severityScore: 0.45,
      page_url: null,
      selector: null,
      fingerprintSeed: 'portability-export',
    },
  ];

  // Convert items into issues (guidance mode). In a future iteration, items become pass/fail based on real integration.
  for (const it of items) {
    const fingerprint = stableFingerprint({
      type: it.issue_type,
      seed: it.fingerprintSeed,
      scope: targetScope,
    });
    issues.push({
      issue_type: it.issue_type,
      severity: severityFromScore(it.severityScore),
      title: it.title,
      description: it.description,
      page_url: it.page_url,
      selector: it.selector,
      evidence: {
        ...it.evidence,
        targetScope,
        checklistItem: it.fingerprintSeed,
      },
      recommended_fix: it.recommended_fix,
      suggested_fix_json: it.suggested_fix_json,
      fingerprint,
    });
  }

  return {
    issues,
    summary: {
      checks: {
        mode: 'guidance_only',
        items: items.length,
      },
    },
  };
}
