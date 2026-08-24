/**
 * Met à jour k3ui-docs/partials/lighthouse.json depuis un rapport Lighthouse JSON.
 * Usage : node scripts/update-lighthouse-json.mjs --preset desktop --report build/lighthouse/report-desktop.report.json
 */

import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsJson = path.join(root, '..', 'k3ui-docs', 'partials', 'lighthouse.json');

function parseArgs() {
  const args = process.argv.slice(2);
  let preset = 'desktop';
  let report = '';
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--preset' && args[i + 1]) preset = args[++i];
    if (args[i] === '--report' && args[i + 1]) report = args[++i];
  }
  return { preset, report };
}

const { preset, report } = parseArgs();
if (!report) {
  console.error('Usage: node scripts/update-lighthouse-json.mjs --preset desktop|mobile --report <path>');
  process.exit(1);
}

const raw = await fs.readFile(path.resolve(root, report), 'utf8');
const data = JSON.parse(raw);
const categories = data.categories ?? {};

const scores = {
  performance: Math.round((categories.performance?.score ?? 0) * 100),
  accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
  'best-practices': Math.round((categories['best-practices']?.score ?? 0) * 100),
  seo: Math.round((categories.seo?.score ?? 0) * 100),
};

let existing = {
  desktop: { performance: 0, accessibility: 0, 'best-practices': 0, seo: 0 },
  mobile: { performance: 0, accessibility: 0, 'best-practices': 0, seo: 0 },
  date: new Date().toISOString(),
};

if (await fs.pathExists(docsJson)) {
  existing = { ...existing, ...(await fs.readJson(docsJson)) };
}

existing[preset] = scores;
existing.date = new Date().toISOString();

await fs.writeJson(docsJson, existing, { spaces: 2 });
console.log(`[update-lighthouse-json] ${preset} mis à jour dans ${docsJson}`);
