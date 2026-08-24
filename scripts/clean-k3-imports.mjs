import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, acc = []) {
    for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name);
        if (fs.statSync(p).isDirectory()) walk(p, acc);
        else if (p.endsWith('.test.ts')) acc.push(p);
    }
    return acc;
}

for (const f of walk(path.join(root, 'tests'))) {
    let c = fs.readFileSync(f, 'utf8');
    if (!c.includes('getKInstance')) continue;
    if (c.includes('getKInstance(')) continue;
    const next = c.replace(/^import \{ getKInstance \} from ['"][^'"]+['"];\r?\n/gm, '');
    if (next !== c) {
        fs.writeFileSync(f, next);
        console.log('cleaned', path.relative(root, f));
    }
}
