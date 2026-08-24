/**
 * Minifie k3ui.js → k3ui.min.js et tous les chunks k3ui-*.js (hors k3ui.min.js).
 */
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'terser';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distJs = path.join(root, 'dist', 'js');

const terserOptions = {
  compress: {
    drop_console: true,
    drop_debugger: true,
    passes: 1,
    dead_code: true,
    conditionals: true,
    unused: true,
    evaluate: false,
    if_return: true,
    sequences: true,
  },
  mangle: { toplevel: false },
  format: { comments: false },
};

async function minifyFile(inputPath, outputPath) {
  const code = await fs.readFile(inputPath, 'utf8');
  const result = await minify(code, terserOptions);
  if (!result.code) {
    throw new Error(`Minification échouée : ${inputPath}`);
  }
  await fs.writeFile(outputPath, result.code, 'utf8');
}

const entry = path.join(distJs, 'k3ui.js');
const entryMin = path.join(distJs, 'k3ui.min.js');

if (!(await fs.pathExists(entry))) {
  console.error('[minify-dist-js] dist/js/k3ui.js introuvable — lancer vite build d’abord.');
  process.exit(1);
}

await minifyFile(entry, entryMin);

const names = await fs.readdir(distJs);
for (const name of names) {
  if (/^k3ui-.+\.js$/i.test(name) && name !== 'k3ui.min.js') {
    const full = path.join(distJs, name);
    await minifyFile(full, full);
  }
}

console.log('[minify-dist-js] k3ui.min.js et chunks minifiés.');
