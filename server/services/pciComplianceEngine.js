/**
 * pciComplianceEngine.js
 * PCI compliance checker for Audit Tools (#1801)
 */

import { stableFingerprint } from '../utils/auditToolsUtils.js';

export async function runPciComplianceCheck({ targetScope = {}, config = {} } = {}) {
  const issues = [];

  const sslDomains = config?.sslDomains || [targetScope?.domain || 'localhost'];

  const checks = [
    {
      issue_type: 'pci_no_local_card_storage',
      title: 'No credit card data stored locally',
      description:
        'Verify that the system never stores raw credit card numbers, CVVs, or magnetic stripe data locally.',
      evidence: {
        note: 'Guidance-only until integrated with payment fields & storage inspection.',
      },
      recommended_fix:
        'Use a PCI-compliant payment processor/tokenization. Ensure server/database/files never receive/store PAN/CVV.',
      suggested_fix_json: { pci: 'no_local_storage' },
      severity: 'Critical',
      fingerprintSeed: 'pci-no-local-card-storage',
    },
    {
      issue_type: 'pci_ssl_tls',
      title: 'SSL/TLS enabled and valid for payment-related endpoints',
      description: 'Verify TLS configuration for all payment-related domains/endpoints.',
      evidence: {
        domains: sslDomains,
      },
      recommended_fix:
        'Enable HTTPS/TLS everywhere; enforce HSTS; rotate certificates; validate chains in CI.',
      suggested_fix_json: { pci: 'ssl_tls' },
      severity: 'Serious',
      fingerprintSeed: 'pci-ssl-tls',
    },
    {
      issue_type: 'pci_api_security_review',
      title: 'Payment API security controls exist',
      description:
        'Review auth, rate limiting, input validation, logging redaction, and webhook verification for payment APIs.',
      evidence: {
        hint: 'Connect to routing/middleware inspection for payment routes.',
      },
      recommended_fix:
        'Ensure auth middleware is applied, validate payloads, rate-limit, redact logs, and validate webhook signatures.',
      suggested_fix_json: { pci: 'api_security' },
      severity: 'Serious',
      fingerprintSeed: 'pci-api-security',
    },
    {
      issue_type: 'pci_processor_compliance',
      title: 'Payment processor compliance is verified',
      description:
        'Verify the payment processor provides attestations and that you rely only on their compliant infrastructure.',
      evidence: {
        hint: 'Manual evidence required from processor reports (e.g., SAQ/attestations).',
      },
      recommended_fix:
        'Maintain records of processor PCI attestations and update vendor docs annually or per contract.',
      suggested_fix_json: { pci: 'processor_compliance' },
      severity: 'Minor',
      fingerprintSeed: 'pci-processor-compliance',
    },
  ];

  for (const c of checks) {
    issues.push({
      issue_type: c.issue_type,
      severity: c.severity,
      title: c.title,
      description: c.description,
      page_url: null,
      selector: null,
      evidence: {
        ...c.evidence,
        targetScope,
      },
      recommended_fix: c.recommended_fix,
      suggested_fix_json: c.suggested_fix_json,
      fingerprint: stableFingerprint({
        type: c.issue_type,
        seed: c.fingerprintSeed,
        scope: targetScope,
      }),
    });
  }

  return {
    issues,
    summary: {
      checks: {
        mode: 'guidance_only',
        items: checks.length,
      },
    },
  };
}
