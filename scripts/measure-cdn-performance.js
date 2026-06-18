#!/usr/bin/env node
/**
 * measure-cdn-performance.js
 * Measures and compares performance before and after CDN integration.
 *
 * Usage:
 *   node scripts/measure-cdn-performance.js --url https://nexasphere.vercel.app --label baseline
 *   node scripts/measure-cdn-performance.js --url https://cdn.nexasphere.com --label post-cdn
 *   node scripts/measure-cdn-performance.js --compare
 *
 * Outputs:
 *   - JSON report in reports/perf-{label}-{timestamp}.json
 *   - Markdown summary in reports/cdn-performance-report.md
 *
 * Metrics captured:
 *   - Time to First Byte (TTFB)
 *   - First Contentful Paint (FCP)
 *   - Largest Contentful Paint (LCP)
 *   - Speed Index
 *   - Total Blocking Time (TBT)
 *   - Cumulative Layout Shift (CLS)
 *   - Performance score (0-100)
 *   - Asset sizes (JS, CSS, images, fonts, total)
 *   - x-cache header presence
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const URL_TO_TEST = getArg('--url');
const LABEL = getArg('--label') || 'measurement';
const RUNS = parseInt(getArg('--runs') || '3', 10);
const COMPARE_MODE = hasFlag('--compare');

const REPORTS_DIR = path.join(process.cwd(), 'reports');
fs.mkdirSync(REPORTS_DIR, { recursive: true });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function fmtMs(ms) {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// ─── TTFB measurement (native Node https) ────────────────────────────────────

function measureTTFB(url) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = https.get(url, (res) => {
      const ttfb = Date.now() - start;
      const xCache = res.headers['x-cache'] || 'not-present';
      const cfRay = res.headers['cf-ray'] || res.headers['x-amz-cf-id'] || '';
      res.destroy();
      resolve({ ttfb, xCache, cfRay, status: res.statusCode });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error('TTFB timeout after 15s'));
    });
  });
}

// ─── Lighthouse measurement ───────────────────────────────────────────────────

function runLighthouse(url) {
  // Check if lighthouse is available
  try {
    execSync('npx lighthouse --version', { stdio: 'pipe' });
  } catch {
    log('⚠️  Lighthouse not found. Install: npm install -g lighthouse');
    log('   Returning simulated metrics for demo purposes.');
    return simulatedLighthouseResult();
  }

  const outputPath = path.join(REPORTS_DIR, `lh-temp-${Date.now()}.json`);
  try {
    execSync(
      `npx lighthouse "${url}" ` +
        `--output=json --output-path="${outputPath}" ` +
        `--chrome-flags="--headless --no-sandbox" ` +
        `--only-categories=performance ` +
        `--quiet`,
      { stdio: 'pipe', timeout: 120000 }
    );

    const lhr = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    fs.unlinkSync(outputPath);

    const a = lhr.audits;
    return {
      score: Math.round(lhr.categories.performance.score * 100),
      fcp: a['first-contentful-paint']?.numericValue || 0,
      lcp: a['largest-contentful-paint']?.numericValue || 0,
      speedIndex: a['speed-index']?.numericValue || 0,
      tbt: a['total-blocking-time']?.numericValue || 0,
      cls: a['cumulative-layout-shift']?.numericValue || 0,
      totalBytes: a['total-byte-weight']?.numericValue || 0,
      unusedJs: a['unused-javascript']?.numericValue || 0,
    };
  } catch (err) {
    log(`⚠️  Lighthouse run failed: ${err.message}`);
    fs.existsSync(outputPath) && fs.unlinkSync(outputPath);
    return simulatedLighthouseResult();
  }
}

function simulatedLighthouseResult() {
  // Placeholder so the script still produces a valid JSON report
  return {
    score: null,
    fcp: null,
    lcp: null,
    speedIndex: null,
    tbt: null,
    cls: null,
    totalBytes: null,
    unusedJs: null,
    note: 'Lighthouse not available — install it to get real scores',
  };
}

// ─── Main measurement ─────────────────────────────────────────────────────────

async function runMeasurement() {
  if (!URL_TO_TEST) {
    console.error('Usage: node scripts/measure-cdn-performance.js --url <url> --label <label>');
    process.exit(1);
  }

  log(`📊 Measuring: ${URL_TO_TEST} (label: ${LABEL}, runs: ${RUNS})`);

  // TTFB — multiple runs for statistical reliability
  const ttfbResults = [];
  for (let i = 1; i <= RUNS; i++) {
    log(`   TTFB run ${i}/${RUNS}...`);
    try {
      const r = await measureTTFB(URL_TO_TEST);
      ttfbResults.push(r);
      log(`   → ${fmtMs(r.ttfb)} | x-cache: ${r.xCache}`);
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      log(`   → Error: ${err.message}`);
    }
  }

  const avgTTFB = avg(ttfbResults.map((r) => r.ttfb));
  const minTTFB = Math.min(...ttfbResults.map((r) => r.ttfb));
  const maxTTFB = Math.max(...ttfbResults.map((r) => r.ttfb));
  const lastXCache = ttfbResults[ttfbResults.length - 1]?.xCache || 'unknown';
  const cacheHitRate =
    ttfbResults.filter((r) => r.xCache.toLowerCase().includes('hit')).length / ttfbResults.length;

  // Lighthouse (single run — expensive)
  log('   Running Lighthouse audit...');
  const lh = runLighthouse(URL_TO_TEST);

  const report = {
    label: LABEL,
    url: URL_TO_TEST,
    timestamp: new Date().toISOString(),
    runs: RUNS,
    ttfb: {
      avg: Math.round(avgTTFB),
      min: minTTFB,
      max: maxTTFB,
      unit: 'ms',
    },
    cache: {
      lastXCacheHeader: lastXCache,
      hitRate: `${Math.round(cacheHitRate * 100)}%`,
    },
    lighthouse: lh,
  };

  const filename = `perf-${LABEL}-${Date.now()}.json`;
  const filepath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

  log(`✅ Report saved: ${filepath}`);
  log('');
  log('─── Summary ───────────────────────────────────');
  log(`TTFB avg:        ${fmtMs(avgTTFB)} (min ${fmtMs(minTTFB)}, max ${fmtMs(maxTTFB)})`);
  log(`Cache hit rate:  ${report.cache.hitRate}`);
  if (lh.score !== null) {
    log(`Perf score:      ${lh.score}/100`);
    log(`FCP:             ${fmtMs(lh.fcp)}`);
    log(`LCP:             ${fmtMs(lh.lcp)}`);
    log(`TBT:             ${fmtMs(lh.tbt)}`);
    log(`CLS:             ${lh.cls?.toFixed(3)}`);
  }
  log('───────────────────────────────────────────────');

  return report;
}

// ─── Compare mode ─────────────────────────────────────────────────────────────

function compareReports() {
  const files = fs
    .readdirSync(REPORTS_DIR)
    .filter((f) => f.startsWith('perf-') && f.endsWith('.json'))
    .map((f) => ({
      name: f,
      data: JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, f), 'utf8')),
    }));

  if (files.length < 2) {
    console.error(
      'Need at least 2 measurement reports to compare. Run with --label baseline and --label post-cdn first.'
    );
    process.exit(1);
  }

  // Sort by timestamp, take latest of each label
  const byLabel = {};
  for (const f of files) {
    const label = f.data.label;
    if (!byLabel[label] || f.data.timestamp > byLabel[label].timestamp) {
      byLabel[label] = f.data;
    }
  }

  const baseline = byLabel['baseline'];
  const postCdn = byLabel['post-cdn'];

  if (!baseline || !postCdn) {
    console.error('Need reports labeled "baseline" and "post-cdn".');
    console.log('Available labels:', Object.keys(byLabel).join(', '));
    process.exit(1);
  }

  const delta = (after, before) => {
    if (before == null || after == null) return 'N/A';
    const diff = after - before;
    const pct = ((diff / before) * 100).toFixed(1);
    const sign = diff <= 0 ? '↓' : '↑';
    return `${sign} ${Math.abs(diff).toFixed(0)}ms (${pct}%)`;
  };

  const scoreDelta = (after, before) => {
    if (before == null || after == null) return 'N/A';
    const diff = after - before;
    return `${diff >= 0 ? '+' : ''}${diff} pts`;
  };

  const md = `# NexaSphere CDN Performance Report

Generated: ${new Date().toISOString()}

## TTFB Comparison

| Metric         | Baseline | Post-CDN | Change |
|----------------|----------|----------|--------|
| TTFB avg       | ${fmtMs(baseline.ttfb.avg)} | ${fmtMs(postCdn.ttfb.avg)} | ${delta(postCdn.ttfb.avg, baseline.ttfb.avg)} |
| TTFB min       | ${fmtMs(baseline.ttfb.min)} | ${fmtMs(postCdn.ttfb.min)} | ${delta(postCdn.ttfb.min, baseline.ttfb.min)} |
| Cache hit rate | ${baseline.cache.hitRate} | ${postCdn.cache.hitRate} | — |

## Lighthouse Scores

| Metric          | Baseline | Post-CDN | Change |
|-----------------|----------|----------|--------|
| Performance     | ${baseline.lighthouse.score ?? 'N/A'} | ${postCdn.lighthouse.score ?? 'N/A'} | ${scoreDelta(postCdn.lighthouse.score, baseline.lighthouse.score)} |
| FCP             | ${baseline.lighthouse.fcp ? fmtMs(baseline.lighthouse.fcp) : 'N/A'} | ${postCdn.lighthouse.fcp ? fmtMs(postCdn.lighthouse.fcp) : 'N/A'} | ${delta(postCdn.lighthouse.fcp, baseline.lighthouse.fcp)} |
| LCP             | ${baseline.lighthouse.lcp ? fmtMs(baseline.lighthouse.lcp) : 'N/A'} | ${postCdn.lighthouse.lcp ? fmtMs(postCdn.lighthouse.lcp) : 'N/A'} | ${delta(postCdn.lighthouse.lcp, baseline.lighthouse.lcp)} |
| TBT             | ${baseline.lighthouse.tbt ? fmtMs(baseline.lighthouse.tbt) : 'N/A'} | ${postCdn.lighthouse.tbt ? fmtMs(postCdn.lighthouse.tbt) : 'N/A'} | ${delta(postCdn.lighthouse.tbt, baseline.lighthouse.tbt)} |
| CLS             | ${baseline.lighthouse.cls?.toFixed(3) ?? 'N/A'} | ${postCdn.lighthouse.cls?.toFixed(3) ?? 'N/A'} | — |

## CDN Cache Verification

- Baseline x-cache: \`${baseline.cache.lastXCacheHeader}\`
- Post-CDN x-cache: \`${postCdn.cache.lastXCacheHeader}\`
- Expected post-CDN: \`Hit from cloudfront\`

## URLs Tested

- Baseline: ${baseline.url}
- Post-CDN: ${postCdn.url}
`;

  const mdPath = path.join(REPORTS_DIR, 'cdn-performance-report.md');
  fs.writeFileSync(mdPath, md);
  log(`📄 Comparison report saved: ${mdPath}`);
  console.log('\n' + md);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

if (COMPARE_MODE) {
  compareReports();
} else {
  runMeasurement().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
