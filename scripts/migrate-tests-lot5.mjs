/**
 * Migration LOT 5 : remplace les patterns `as any` courants dans tests/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const testsDir = path.join(root, 'tests');

function walk(dir, acc = []) {
    for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name);
        if (fs.statSync(p).isDirectory()) {
            walk(p, acc);
        } else if (p.endsWith('.test.ts')) {
            acc.push(p);
        }
    }
    return acc;
}

function addImport(content, importLine) {
    if (content.includes(importLine.trim())) {
        return content;
    }
    const ref = content.match(/^\/\/\/ <reference[\s\S]*?\n\n/m);
    if (ref) {
        return content.replace(ref[0], ref[0] + importLine);
    }
    const firstImport = content.match(/^import .+;\n/m);
    if (firstImport) {
        return content.replace(firstImport[0], firstImport[0] + importLine);
    }
    return importLine + content;
}

const kImport = "import { getKInstance } from '../helpers/k3-instance';\n";
const registryImport = "import { asRegistryComponent } from '../helpers/registry';\n";

for (const file of walk(testsDir)) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    content = content.replace(/\(([a-zA-Z0-9_.]+) as any\)\.(K_[A-Za-z0-9_]+)/g, "getKInstance($1, '$2')");

    content = content.replace(/(\w+) as any,\s*\n(\s*)PriorityLevel/g, 'asRegistryComponent($1),\n$2PriorityLevel');

    content = content.replace(/new MockComponent\(([^)]+)\) as any/g, 'asRegistryComponent(new MockComponent($1))');

    content = content.replace(/mockComponent as any/g, 'asRegistryComponent(mockComponent)');
    content = content.replace(/newComponent as any/g, 'asRegistryComponent(newComponent)');

    if (content !== original) {
        if (content.includes('getKInstance(')) {
            const rel = path.relative(path.dirname(file), path.join(testsDir, 'helpers', 'k3-instance.ts')).replace(/\\/g, '/');
            const line = `import { getKInstance } from '${rel.replace('.ts', '')}';\n`;
            content = addImport(content, line);
        }
        if (content.includes('asRegistryComponent(')) {
            const rel = path.relative(path.dirname(file), path.join(testsDir, 'helpers', 'registry.ts')).replace(/\\/g, '/');
            const line = `import { asRegistryComponent } from '${rel.replace('.ts', '')}';\n`;
            content = addImport(content, line);
        }
        fs.writeFileSync(file, content);
        console.log('updated', path.relative(root, file));
    }
}
