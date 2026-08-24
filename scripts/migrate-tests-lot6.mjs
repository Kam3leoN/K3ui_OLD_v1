/**
 * LOT 6 : remplace getKInstance(el, 'K_*') par *.getInstance(el)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const testsDir = path.join(root, 'tests');

const KEY_TO_CLASS = {
    K_Badge: 'Badge',
    K_Breadcrumb: 'Breadcrumb',
    K_ButtonFab: 'ButtonFab',
    K_ButtonFabMenu: 'ButtonFabMenu',
    K_ButtonGroups: 'ButtonGroups',
    K_ButtonSegmented: 'ButtonSegmented',
    K_Card: 'Card',
    K_Chart: 'Chart',
    K_Checkbox: 'Checkbox',
    K_Chips: 'Chip',
    K_CodeBlock: 'CodeBlock',
    K_Command: 'Command',
    K_Countdown: 'Countdown',
    K_Counter: 'Counter',
    K_Datepicker: 'Datepicker',
    K_Dialog: 'Dialog',
    K_Gradient: 'Gradient',
    K_Heatmap: 'Heatmap',
    K_List: 'List',
    K_LoadingIndicator: 'Loader',
    K_Menu: 'Menu',
    K_NavigationBar: 'NavigationBar',
    K_NavigationRail: 'NavigationRail',
    K_Pace: 'Pace',
    K_PaginationAlpha: 'PaginationAlpha',
    K_Perspective: 'Perspective',
    K_Radio: 'Radio',
    K_ScrollToTop: 'ScrollToTop',
    K_Select: 'Select',
    K_Shape: 'Shape',
    K_Skeleton: 'Skeleton',
    K_Slider: 'Slider',
    K_Switch: 'Switch',
    K_Tabs: 'Tabs',
    K_Timepicker: 'Timepicker',
    K_Todo: 'Todo',
    K_Tooltips: 'Tooltips',
};

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

for (const file of walk(testsDir)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('getKInstance')) {
        continue;
    }
    const original = content;

    for (const [key, className] of Object.entries(KEY_TO_CLASS)) {
        content = content.replace(
            new RegExp(`getKInstance\\(([^,]+),\\s*'${key}'\\)`, 'g'),
            `${className}.getInstance($1)`
        );
    }

    content = content.replace(
        /\.getInstance\(([^)]+)\)\)\.toBeUndefined\(\)/g,
        '.getInstance($1)).toBeFalsy()'
    );
    content = content.replace(
        /\.getInstance\(([^)]+)\)\.toBeUndefined\(\)/g,
        '.getInstance($1).toBeFalsy()'
    );

    content = content.replace(/\nimport \{ getKInstance \} from ['"][^'"]+['"];\n/g, '\n');

    const needsLoader = content.includes('Loader.getInstance') && !content.includes('Loader');
    if (needsLoader) {
        content = content.replace(
            /(import \{[^}]+\} from ['"]\.\.\/\.\.\/src\/components\/[^'"]+['"];)/,
            "$1\nimport { Loader } from '../../src/components/LoadingIndicator';"
        );
    }

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('updated', path.relative(root, file));
    }
}
