#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function renameTocContent(text) {
    return text
        .replace(/TocSectionInternal/g, 'ScrollSpySectionInternal')
        .replace(/TocSection/g, 'ScrollSpySection')
        .replace(/TocOptions/g, 'ScrollSpyOptions')
        .replace(/KTocHTMLElement/g, 'KScrollSpyHTMLElement')
        .replace(/K_Toc/g, 'K_ScrollSpy')
        .replace(/getTocDefaults/g, 'getScrollSpyDefaults')
        .replace(/toc\.specs/g, 'scrollspy.specs')
        .replace(/TocSpecs/g, 'ScrollSpySpecs')
        .replace(/k3ui-toc/g, 'k3ui-scrollspy')
        .replace(/K3UITocElement/g, 'K3UIScrollSpyElement')
        .replace(/toc__/g, 'scrollspy__')
        .replace(/toc--/g, 'scrollspy--')
        .replace(/data-toc-content/g, 'data-scrollspy-content')
        .replace(/doc-toc-widget/g, 'doc-scrollspy-widget')
        .replace(/from '\.\.\/\.\.\/src\/components\/Toc'/g, "from '../../src/components/ScrollSpy'")
        .replace(/from '\.\/components\/Toc'/g, "from './components/ScrollSpy'")
        .replace(/toComponentClassDef\(Toc\)/g, 'toComponentClassDef(ScrollSpy)')
        .replace(/export class Toc /g, 'export class ScrollSpy ')
        .replace(/\bToc\./g, 'ScrollSpy.')
        .replace(/'\[Toc\]'/g, "'[ScrollSpy]'")
        .replace(/Toc destroyed/g, 'ScrollSpy destroyed')
        .replace(/Composant Toc/g, 'Composant ScrollSpy')
        .replace(/composant Toc/g, 'composant ScrollSpy')
        .replace(/Table of contents/g, 'ScrollSpy')
        .replace(/describe\('Toc'/g, "describe('ScrollSpy'")
        .replace(/toc\.token/g, 'scrollspy.token')
        .replace(/toc\.mixin/g, 'scrollspy.mixin')
        .replace(/toc\.module/g, 'scrollspy.module')
        .replace(/@use '\.\.\/tokens\/toc\.token' as toc;/g, "@use '../tokens/scrollspy.token' as scrollspy;")
        .replace(/@use '\.\.\/mixins\/toc\.mixin' as toc-mixin;/g, "@use '../mixins/scrollspy.mixin' as scrollspy-mixin;")
        .replace(/toc-mixin/g, 'scrollspy-mixin')
        .replace(/\btoc\./g, 'scrollspy.');
}

const pairs = [
    ['src/components/Toc.ts', 'src/components/ScrollSpy.ts'],
    ['src/specs/components/toc.specs.ts', 'src/specs/components/scrollspy.specs.ts'],
    ['tests/components/Toc.test.ts', 'tests/components/ScrollSpy.test.ts'],
    ['scss/tokens/toc.token.scss', 'scss/tokens/scrollspy.token.scss'],
    ['scss/mixins/toc.mixin.scss', 'scss/mixins/scrollspy.mixin.scss'],
    ['scss/modules/toc.module.scss', 'scss/modules/scrollspy.module.scss'],
];

for (const [src, dest] of pairs) {
    const srcPath = path.join(root, src);
    const destPath = path.join(root, dest);
    const content = renameTocContent(fs.readFileSync(srcPath, 'utf8'));
    fs.writeFileSync(destPath, content);
    console.log('Wrote', dest);
}
