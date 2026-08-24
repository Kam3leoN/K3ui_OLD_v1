/**
 * Audit Lighthouse k3ui-docs (desktop + mobile) et export des rapports.
 * Usage : node scripts/lighthouse-docs.mjs [--mobile] [--update-json]
 */

import { spawnSync } from 'node:child_process';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsUrl = process.env.LIGHTHOUSE_DOCS_URL || 'http://localhost/k3ui-docs/index.php';
const outDir = path.join(root, 'build', 'lighthouse');
const args = process.argv.slice(2);
const mobile = args.includes('--mobile');
const updateJson = args.includes('--update-json');
const label = mobile ? 'mobile' : 'desktop';

await fs.ensureDir(outDir);

const chromeFlags = '--headless=new --no-sandbox --disable-gpu';
const lhArgs = [
  docsUrl,
  '--only-categories=performance,accessibility,best-practices,seo',
  `--chrome-flags=${chromeFlags}`,
  `--output=json,html`,
  `--output-path=${path.join(outDir, `report-${label}`)}`,
  '--quiet',
];

// LH 12 : pas de --preset=mobile (seulement perf|experimental|desktop).
if (mobile) {
  lhArgs.push('--form-factor=mobile', '--screenEmulation.mobile', '--throttling-method=simulate');
} else {
  lhArgs.push('--preset=desktop');
}

const result = spawnSync('npx', ['lighthouse', ...lhArgs], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

if (result.status !== 0) {
  console.error(`[lighthouse-docs] Échec audit ${label} (code ${result.status})`);
  process.exit(result.status ?? 1);
}

const reportPath = path.join(outDir, `report-${label}.report.json`);
if (!(await fs.pathExists(reportPath))) {
  console.error(`[lighthouse-docs] Rapport introuvable : ${reportPath}`);
  process.exit(1);
}

const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
const categories = report.categories ?? {};

const scores = {
  performance: Math.round((categories.performance?.score ?? 0) * 100),
  accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
  'best-practices': Math.round((categories['best-practices']?.score ?? 0) * 100),
  seo: Math.round((categories.seo?.score ?? 0) * 100),
};

const metrics = {
  fcp: report.audits?.['first-contentful-paint']?.displayValue,
  lcp: report.audits?.['largest-contentful-paint']?.displayValue,
  tbt: report.audits?.['total-blocking-time']?.displayValue,
  cls: report.audits?.['cumulative-layout-shift']?.displayValue,
  inp: report.audits?.['interaction-to-next-paint']?.displayValue
    ?? report.audits?.['experimental-interaction-to-next-paint']?.displayValue,
};

const summaryPath = path.join(outDir, `summary-${label}.json`);
await fs.writeJson(summaryPath, { preset: label, scores, metrics, date: new Date().toISOString() }, { spaces: 2 });

console.log(`[lighthouse-docs] ${label} — Perf ${scores.performance} | A11y ${scores.accessibility} | BP ${scores['best-practices']} | SEO ${scores.seo}`);
console.log(`[lighthouse-docs] Métriques — FCP ${metrics.fcp} | LCP ${metrics.lcp} | TBT ${metrics.tbt} | CLS ${metrics.cls}`);

if (updateJson) {
  const updateScript = path.join(root, 'scripts', 'update-lighthouse-json.mjs');
  spawnSync('node', [updateScript, '--preset', label, '--report', reportPath], {
    cwd: root,
    stdio: 'inherit',
  });
}
