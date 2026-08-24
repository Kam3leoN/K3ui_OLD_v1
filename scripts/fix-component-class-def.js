const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/components');
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    const before = content;

    content = content.replace(/toComponentClassDef<\w+, \w+Options>\(/g, 'toComponentClassDef(');
    content = content.replace(
        /\nimport \{ ComponentType \} from ['"]\.\.\/types\/components\/component-base['"];/g,
        ''
    );

    if (file === 'Menu.ts' && content.includes('toComponentClassDef(') && !content.includes("toComponentClassDef }")) {
        content = content.replace(
            "import type { K3uiMenuElement }",
            "import { toComponentClassDef } from '../types/components/component-base';\nimport type { K3uiMenuElement }"
        );
    }

    if (
        (file === 'Snackbar.ts' || file === 'Toast.ts') &&
        content.includes('toComponentClassDef(') &&
        !content.includes("from '../types/components/component-base'")
    ) {
        content = content.replace(
            /import \{ Component[^}]+\} from '\.\.\/core\/base\/Component';/,
            (m) => `${m}\nimport { toComponentClassDef } from '../types/components/component-base';`
        );
    }

    if (content !== before) {
        fs.writeFileSync(path.join(dir, file), content, 'utf8');
        console.log('fixed', file);
    }
}
