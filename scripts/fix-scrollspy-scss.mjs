#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function write(rel, content) {
    fs.writeFileSync(path.join(root, rel), content);
}

write(
    'scss/tokens/scrollspy.token.scss',
    fs
        .readFileSync(path.join(root, 'scss/tokens/scrollspy.token.scss'), 'utf8')
        .replace(/\$toc-/g, '$scrollspy-')
        .replace(/Tokens de design pour Toc/g, 'Tokens de design pour ScrollSpy')
);

write(
    'scss/mixins/scrollspy.mixin.scss',
    fs
        .readFileSync(path.join(root, 'scss/mixins/scrollspy.mixin.scss'), 'utf8')
        .replace("@use '../tokens/scrollspy.token' as toc;", "@use '../tokens/scrollspy.token' as scrollspy;")
        .replace(/scrollspy\.\$toc-/g, 'scrollspy.$scrollspy-')
        .replace(/@mixin toc-/g, '@mixin scrollspy-')
        .replace(/Mixins pour Toc/g, 'Mixins pour ScrollSpy')
        .replace(/--toc-progress/g, '--scrollspy-progress')
        .replace(/var\(--toc-sticky-top/g, 'var(--scrollspy-sticky-top')
);

write(
    'scss/modules/scrollspy.module.scss',
    fs
        .readFileSync(path.join(root, 'scss/modules/scrollspy.module.scss'), 'utf8')
        .replace("@use '../tokens/scrollspy.token' as toc;", "@use '../tokens/scrollspy.token' as scrollspy;")
        .replace(/\.toc,/g, '.scrollspy,')
        .replace(/\.toc:not/g, '.scrollspy:not')
        .replace(/\.toc:/g, '.scrollspy:')
        .replace(/scrollspy\.\$toc-/g, 'scrollspy.$scrollspy-')
        .replace(/scrollspy-mixin\.toc-/g, 'scrollspy-mixin.scrollspy-')
        .replace(/--toc-/g, '--scrollspy-')
        .replace(/Module Toc/g, 'Module ScrollSpy')
);

for (const rel of ['scss/modules/index.scss', 'scss/mixins/index.scss', 'scss/tokens/index.scss']) {
    write(
        rel,
        fs
            .readFileSync(path.join(root, rel), 'utf8')
            .replace(/@forward 'toc\.(module|mixin|token)';\r?\n/g, '')
    );
}

console.log('SCSS fixed');
