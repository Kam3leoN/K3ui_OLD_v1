/**
 * Supprime les appels console.log/info/debug des scripts inline des pages PHP démo.
 */
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'k3ui-docs');
const pattern = /\s*console\.(log|info|debug)\([^;]*\);?\s*/g;

async function walkPhp(dir, out = []) {
  for (const name of await fs.readdir(dir)) {
    const full = path.join(dir, name);
    const stat = await fs.stat(full);
    if (stat.isDirectory()) {
      if (name === 'partials' || name === 'dialogs' || name === 'node_modules') continue;
      await walkPhp(full, out);
    } else if (name.endsWith('.php')) {
      out.push(full);
    }
  }
  return out;
}

const files = await walkPhp(docsRoot);
let total = 0;

for (const file of files) {
  const original = await fs.readFile(file, 'utf8');
  if (!/console\.(log|info|debug)\(/.test(original)) continue;
  const updated = original.replace(pattern, '\n');
  if (updated !== original) {
    await fs.writeFile(file, updated, 'utf8');
    total += 1;
  }
}

console.log(`[strip-console-php] ${total} fichier(s) nettoyé(s).`);
