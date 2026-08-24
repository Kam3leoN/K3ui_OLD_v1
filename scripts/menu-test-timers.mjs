import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'components', 'Menu.test.ts');
let c = fs.readFileSync(file, 'utf8');

// Après chaque bloc test contenant setTimeout, exécuter les timers fake avant la fin du test
c = c.replace(/(\n        test\([\s\S]*?setTimeout[\s\S]*?)(\n        \}\);)/g, (match, body, close) => {
    if (body.includes('jest.runAllTimers()')) {
        return match;
    }
    return `${body}\n            jest.runAllTimers();${close}`;
});

fs.writeFileSync(file, c);
console.log('Menu.test.ts timers flush inserted');
