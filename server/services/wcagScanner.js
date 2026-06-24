/**
 * wcagScanner.js
 * WCAG 2.1 AA automated accessibility scan using axe-playwright.
 */

import { chromium } from 'playwright';
import { injectAxe, checkA11y } from 'axe-playwright';

// Matches accessibility.spec.js
const axeOptions = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
  },
};

function toSeverity(issue) {
  // axe-playwright returns violation objects with 'severity'
  const s = String(issue?.severity || 'minor').toLowerCase();
  if (s === 'critical') return 'Critical';
  if (s === 'serious') return 'Serious';
  return 'Minor';
}

function buildFingerprint({ ruleId, selector, pageUrl }) {
  return [ruleId || '', selector || '', pageUrl || ''].join('|');
}

export async function scanUrlsForWcag({ baseUrl, urls = [] }) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const allIssues = [];

  for (const urlPath of urls) {
    const pageUrl = urlPath.startsWith('http') ? urlPath : `${baseUrl}${urlPath}`;
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

    await injectAxe(page);

    const results = await checkA11y(page, null, {
      axeOptions,
      detailedReport: true,
    });

    const violations = results?.violations || [];
    for (const v of violations) {
      for (const node of v.nodes || []) {
        const selector = node?.target?.[0] || null;
        const ruleId = v.id;
        const severity = toSeverity(v);

        const fingerprint = buildFingerprint({ ruleId, selector, pageUrl });

        allIssues.push({
          issue_type: 'wcag_violation',
          severity,
          title: v.help || v.description || v.id,
          description: v.description || '',
          page_url: pageUrl,
          selector,
          evidence: {
            ruleId: v.id,
            help: v.help,
            tags: v.tags,
            node: {
              html: node?.html || null,
              target: node?.target || [],
              failureSummary: node?.failureSummary || null,
            },
          },
          recommended_fix: `Review WCAG rule: ${v.id}. Suggested remediation should be documented by the dev team based on the evidence.`,
          suggested_fix_json: {
            wcag: {
              ruleId: v.id,
              tags: v.tags,
            },
            evidenceHtmlPresent: Boolean(node?.html),
          },
          fingerprint,
        });
      }
    }
  }

  await page.close();
  await context.close();
  await browser.close();

  return {
    issues: allIssues,
    summary: {
      scanned: {
        urlCount: urls.length,
        urls,
      },
      totalIssues: allIssues.length,
    },
  };
}
