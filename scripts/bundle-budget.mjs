/**
 * Vérifie les budgets de taille gzip des bundles principaux.
 * Usage : node scripts/bundle-budget.mjs
 */
import fs from 'fs-extra';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Budgets gzip en octets */
const BUDGETS = {
  'dist/js/k3ui.min.js': 20 * 1024,
  'dist/css/k3ui-core.min.css': 200 * 1024,
  'dist/css/k3ui.min.css': 500 * 1024,
};

/** Budget gzip du chunk partagé principal (vrai payload parse/compile). */
const INDEX_CHUNK_MAX = 550 * 1024;
/** Budget gzip du chunk Chart (vendor ECharts). */
const CHART_CHUNK_MAX = 400 * 1024;
/** Plafond de secours : plus gros chunk JS hors entry. */
const LARGEST_CHUNK_MAX = 700 * 1024;

function gzipSize(buffer) {
  return zlib.gzipSync(buffer).length;
}

/**
 * Trouve le fichier chunk dont le nom matche le pattern.
 * Si plusieurs matches : retourne le plus gros (gzip).
 * @param {string} distJs
 * @param {RegExp} pattern
 * @returns {Promise<{ name: string, gz: number } | null>}
 */
async function findChunkGzip(distJs, pattern) {
  if (!(await fs.pathExists(distJs))) return null;
  const names = (await fs.readdir(distJs)).filter((name) => pattern.test(name));
  if (names.length === 0) return null;
  let best = null;
  for (const name of names) {
    const gz = gzipSize(await fs.readFile(path.join(distJs, name)));
    if (!best || gz > best.gz) best = { name, gz };
  }
  return best;
}

/**
 * Taille gzip du plus gros chunk partagé (hors entry min).
 * @param {string} distJs
 */
async function largestChunkGzip(distJs) {
  if (!(await fs.pathExists(distJs))) return { name: '', gz: 0 };
  let max = 0;
  let maxName = '';
  for (const name of await fs.readdir(distJs)) {
    if (!/^k3ui-.+\.js$/i.test(name)) continue;
    if (/^k3ui\.min\.js$/i.test(name)) continue;
    const gz = gzipSize(await fs.readFile(path.join(distJs, name)));
    if (gz > max) {
      max = gz;
      maxName = name;
    }
  }
  return { name: maxName, gz: max };
}

let failed = false;

for (const [rel, maxBytes] of Object.entries(BUDGETS)) {
  const full = path.join(root, rel);
  if (!(await fs.pathExists(full))) {
    console.warn(`[bundle-budget] Fichier absent (ignoré) : ${rel}`);
    continue;
  }
  const buf = await fs.readFile(full);
  const gz = gzipSize(buf);
  const kb = Math.round(gz / 1024);
  const maxKb = Math.round(maxBytes / 1024);
  const ok = gz <= maxBytes;
  console.log(`[bundle-budget] ${rel}: ${kb} Ko gzip (max ${maxKb} Ko) — ${ok ? 'OK' : 'DÉPASSÉ'}`);
  if (!ok) failed = true;
}

const distJs = path.join(root, 'dist', 'js');

const indexChunk = await findChunkGzip(distJs, /^k3ui-index-.+\.js$/i);
if (indexChunk) {
  const kb = Math.round(indexChunk.gz / 1024);
  const maxKb = Math.round(INDEX_CHUNK_MAX / 1024);
  const ok = indexChunk.gz <= INDEX_CHUNK_MAX;
  console.log(`[bundle-budget] ${indexChunk.name}: ${kb} Ko gzip (max ${maxKb} Ko) — ${ok ? 'OK' : 'DÉPASSÉ'}`);
  if (!ok) failed = true;
} else {
  console.warn('[bundle-budget] Chunk k3ui-index-* absent (ignoré)');
}

const chartChunk = await findChunkGzip(distJs, /^k3ui-Chart-.+\.js$/i);
if (chartChunk) {
  const kb = Math.round(chartChunk.gz / 1024);
  const maxKb = Math.round(CHART_CHUNK_MAX / 1024);
  const ok = chartChunk.gz <= CHART_CHUNK_MAX;
  console.log(`[bundle-budget] ${chartChunk.name}: ${kb} Ko gzip (max ${maxKb} Ko) — ${ok ? 'OK' : 'DÉPASSÉ'}`);
  if (!ok) failed = true;
} else {
  console.warn('[bundle-budget] Chunk k3ui-Chart-* absent (ignoré)');
}

const largest = await largestChunkGzip(distJs);
const largestKb = Math.round(largest.gz / 1024);
const largestMaxKb = Math.round(LARGEST_CHUNK_MAX / 1024);
const largestOk = largest.gz <= LARGEST_CHUNK_MAX;
console.log(
  `[bundle-budget] plus gros chunk JS (${largest.name || 'n/a'}): ${largestKb} Ko gzip (max ${largestMaxKb} Ko) — ${largestOk ? 'OK' : 'DÉPASSÉ'}`
);
if (!largestOk) failed = true;

if (failed) {
  console.error('[bundle-budget] Un ou plusieurs budgets dépassés.');
  process.exit(1);
}

console.log('[bundle-budget] Tous les budgets respectés.');
