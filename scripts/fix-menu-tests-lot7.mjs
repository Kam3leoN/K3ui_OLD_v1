import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'components', 'Menu.test.ts');
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
    /\/\*\* Avance les[\s\S]*?\n\n/,
    ''
);
c = c.replace(/\s*jest\.useFakeTimers\(\);\n/g, '\n');
c = c.replace(/\s*jest\.clearAllTimers\(\);\n\s*jest\.useRealTimers\(\);\n/g, '\n');
c = c.replace(/\s*jest\.runAllTimers\(\);\n/g, '\n');

if (!c.includes("from '../helpers/menu-async'")) {
    c = c.replace(
        "import { MenuItem } from '../../src/types/components';",
        `import { MenuItem } from '../../src/types/components';
import { flushComponentInit, initMenuReady, openMenuReady, waitMs } from '../helpers/menu-async';`
    );
}

c = c.replace(/test\((['"])(.+?)\1, \(\) => \{/g, "test($1$2$1, async () => {");
c = c.replace(/test\((['"])(.+?)\1, \(done\) => \{/g, "test($1$2$1, async () => {");

c = c.replace(/(const menu = Menu\.init\([^;]+;\))\n/g, '$1\n            await flushComponentInit();\n');

// menu.open() before DOM assertions → openMenuReady
c = c.replace(
    /await flushComponentInit\(\);\n\n            menu\.open\(\);\n\n            (const |expect)/g,
    'await flushComponentInit();\n\n            await openMenuReady(menu);\n\n            $1'
);
c = c.replace(
    /await flushComponentInit\(\);\n\n            menu\.open\(\);\n\n            setTimeout/g,
    'await flushComponentInit();\n\n            await openMenuReady(menu);\n\n            setTimeout'
);

// Remove orphaned done(); inside async tests (keep structure for manual fix - comment markers)
c = c.replace(/\s*done\(\);\n/g, '\n');

// setTimeout blocks → flatten: remove setTimeout wrapper when single block
c = c.replace(
    /setTimeout\(\(\) => \{\n([\s\S]*?)\n\s*\}, 100\);\n/g,
    '$1\n'
);
c = c.replace(
    /setTimeout\(\(\) => \{\n([\s\S]*?)\n\s*\}, 200\);\n/g,
    '$1\n'
);
c = c.replace(
    /setTimeout\(\(\) => \{\n([\s\S]*?)\n\s*\}, 300\);\n/g,
    '$1\n'
);
c = c.replace(
    /setTimeout\(\(\) => \{\n([\s\S]*?)\n\s*\}, 50\);\n/g,
    '$1\n'
);

fs.writeFileSync(file, c);
console.log('Menu.test.ts LOT7 script applied — review nested timeouts manually');
