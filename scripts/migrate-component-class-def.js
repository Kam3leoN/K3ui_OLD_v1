/**
 * Remplace `Foo as any` / `(super.init as any)` par `toComponentClassDef` dans src/components.
 * Usage: node scripts/migrate-component-class-def.js
 */
const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../src/components');
const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith('.ts'));

function ensureImport(content) {
    if (content.includes('toComponentClassDef')) {
        return content;
    }
    const importLine =
        "import { ComponentType, toComponentClassDef } from '../types/components/component-base';";
    const coreImport = /import \{ Component \} from ['"]\.\.\/core\/base\/Component['"];/;
    if (coreImport.test(content)) {
        return content.replace(coreImport, (m) => `${m}\n${importLine}`);
    }
    const existingBase = /import \{([^}]+)\} from ['"]\.\.\/types\/components\/component-base['"];/;
    if (existingBase.test(content)) {
        return content.replace(existingBase, (m, inner) => {
            if (inner.includes('toComponentClassDef')) {
                return m;
            }
            const parts = inner
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            if (!parts.includes('ComponentType')) {
                parts.push('ComponentType');
            }
            if (!parts.includes('toComponentClassDef')) {
                parts.push('toComponentClassDef');
            }
            return `import { ${parts.join(', ')} } from '../types/components/component-base';`;
        });
    }
    return content;
}

function getClassName(content) {
    const m = content.match(/export class (\w+)/);
    return m ? m[1] : null;
}

for (const file of files) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const className = getClassName(content);
    if (!className || !content.includes(' as any')) {
        continue;
    }

    const optionsName = `${className}Options`;
    const classRef = `toComponentClassDef<${className}, ${optionsName}>(${className})`;
    const before = content;

    content = ensureImport(content);

    content = content.replace(
        new RegExp(`\\(super\\.init as any\\)`, 'g'),
        'Component.init'
    );

    content = content.replace(
        new RegExp(`(, ${className} as any)(?=[\\),])`, 'g'),
        `, ${classRef}`
    );

    content = content.replace(
        new RegExp(`super\\(el, options, ${className} as any\\)`, 'g'),
        `super(el, options, ${classRef})`
    );

    content = content.replace(
        new RegExp(`super\\(element, options, ${className} as any\\)`, 'g'),
        `super(element, options, ${classRef})`
    );

    content = content.replace(
        new RegExp(`super\\(element, \\{[^}]+\\}, ${className} as any\\)`, 'g'),
        (match) => match.replace(`${className} as any`, classRef)
    );

    content = content.replace(
        /super\(el, \{ \.\.\.htmlOptions, \.\.\.options \}, (\w+) as any\)/g,
        (m, name) => {
            if (name !== className) {
                return m;
            }
            return `super(el, { ...htmlOptions, ...options }, ${classRef})`;
        }
    );

    content = content.replace(
        /super\(el, \{ \.\.\.options, \.\.\.htmlOptions \}, (\w+) as any\)/g,
        (m, name) => {
            if (name !== className) {
                return m;
            }
            return `super(el, { ...options, ...htmlOptions }, ${classRef})`;
        }
    );

    content = content.replace(
        new RegExp(`super\\(el, \\{ \\.\\.\\.options, \\.\\.\\.htmlOptions \\} as any, ${className} as any\\)`, 'g'),
        `super(el, { ...options, ...htmlOptions }, ${classRef})`
    );

    content = content.replace(
        new RegExp(`classDef \\?\\? \\(${className} as any\\)`, 'g'),
        `classDef ?? ${classRef}`
    );

    content = content.replace(/\(els as any, options/g, '(els, options');
    content = content.replace(/\(els as any, options \?\? \{\}/g, '(els, options ?? {}');

    if (content !== before) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('updated', file);
    }
}
