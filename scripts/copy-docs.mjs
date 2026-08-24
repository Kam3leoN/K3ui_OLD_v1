/**
 * Copie dist/ et assets vers k3ui-docs (remplace PowerShell — LOT 8)
 * Usage : node scripts/copy-docs.mjs [css|js|assets|all]
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'node:zlib';
import { promisify } from 'node:util';

const gzipAsync = promisify(zlib.gzip);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.resolve(root, '..', 'k3ui-docs');
const distDir = path.join(root, 'dist');
const target = process.argv[2] ?? 'all';

async function gzipFile(filePath) {
    if (!(await fs.pathExists(filePath))) return;
    const buf = await fs.readFile(filePath);
    const compressed = await gzipAsync(buf, { level: 9 });
    await fs.writeFile(`${filePath}.gz`, compressed);
}

/**
 * Pré-compresse CSS/JS docs pour Lighthouse (servis via .htaccess RewriteRule).
 * Exporté aussi pour purge-css (re-gzip après purge).
 */
export async function gzipDocsAssets() {
    const cssDir = path.join(docsRoot, 'css');
    const jsDir = path.join(docsRoot, 'js');
    const targets = [];

    if (await fs.pathExists(cssDir)) {
        for (const name of await fs.readdir(cssDir)) {
            if (/\.css$/i.test(name) && !/\.gz$/i.test(name)) {
                targets.push(path.join(cssDir, name));
            }
        }
    }
    if (await fs.pathExists(jsDir)) {
        for (const name of await fs.readdir(jsDir)) {
            if (
                /^k3ui.*\.js$/i.test(name) ||
                /^(init|init-docs-bootstrap|navbar|lighthouse-gauges|dynamic-color-loader)\.js$/i.test(name)
            ) {
                targets.push(path.join(jsDir, name));
            }
        }
        const docsJs = path.join(jsDir, 'docs');
        if (await fs.pathExists(docsJs)) {
            for (const name of await fs.readdir(docsJs)) {
                if (/\.js$/i.test(name)) targets.push(path.join(docsJs, name));
            }
        }
    }

    for (const file of targets) {
        await gzipFile(file);
    }
    console.log(`[copy-docs] gzip : ${targets.length} fichier(s)`);
}

async function copyCss() {
    const destDir = path.join(docsRoot, 'css');
    await fs.ensureDir(destDir);
    const cssFiles = ['k3ui.css', 'k3ui.min.css', 'k3ui-core.css', 'k3ui-core.min.css'];
    for (const name of cssFiles) {
        const src = path.join(distDir, 'css', name);
        if (await fs.pathExists(src)) {
            await fs.copy(src, path.join(destDir, name), { overwrite: true });
        }
    }
}

async function copyJs() {
    const destDir = path.join(docsRoot, 'js');
    await fs.ensureDir(destDir);
    if (await fs.pathExists(destDir)) {
        for (const name of await fs.readdir(destDir)) {
            if (/^vendor-.*\.js(\.map)?$/i.test(name) || /^k3ui.*\.js(\.map)?$/i.test(name) || /^k3ui.*\.js\.gz$/i.test(name)) {
                await fs.remove(path.join(destDir, name));
            }
        }
    }
    const srcJs = path.join(distDir, 'js');
    if (!(await fs.pathExists(srcJs))) {
        return;
    }
    for (const name of await fs.readdir(srcJs)) {
        if (!/^k3ui.*\.js$/i.test(name) || name === 'k3ui.js') {
            continue;
        }
        await fs.copy(path.join(srcJs, name), path.join(destDir, name), { overwrite: true });
        const map = `${name}.map`;
        const mapSrc = path.join(srcJs, map);
        if (await fs.pathExists(mapSrc)) {
            await fs.copy(mapSrc, path.join(destDir, map), { overwrite: true });
        }
    }
}

async function copyAssets() {
    const srcFonts = path.join(root, 'assets', 'fonts');
    const destDir = path.join(docsRoot, 'assets', 'fonts');
    if (await fs.pathExists(srcFonts)) {
        await fs.ensureDir(destDir);
        await fs.copy(srcFonts, destDir, { overwrite: true });
    }

    const srcMessageBoxImg = path.join(root, 'assets', 'images', 'messagebox');
    const destMessageBoxImg = path.join(docsRoot, 'assets', 'images', 'messagebox');
    if (await fs.pathExists(srcMessageBoxImg)) {
        await fs.ensureDir(destMessageBoxImg);
        await fs.copy(srcMessageBoxImg, destMessageBoxImg, { overwrite: true });
    }

    const srcHoloImg = path.join(root, 'assets', 'images', 'holo');
    const destHoloImg = path.join(docsRoot, 'assets', 'images', 'holo');
    if (await fs.pathExists(srcHoloImg)) {
        await fs.ensureDir(destHoloImg);
        await fs.copy(srcHoloImg, destHoloImg, { overwrite: true });
    }

    const srcSounds = path.join(root, 'assets', 'sounds');
    const destSounds = path.join(docsRoot, 'assets', 'sounds');
    for (const file of ['message_letter.ogg', 'message_end.ogg']) {
        const src = path.join(srcSounds, file);
        if (await fs.pathExists(src)) {
            await fs.ensureDir(destSounds);
            await fs.copy(src, path.join(destSounds, file), { overwrite: true });
        }
    }
}

const runners = {
    css: async () => {
        await copyCss();
        await gzipDocsAssets();
    },
    js: async () => {
        await copyJs();
        await gzipDocsAssets();
    },
    assets: copyAssets,
    gzip: gzipDocsAssets,
    all: async () => {
        await copyCss();
        await copyJs();
        await copyAssets();
        await gzipDocsAssets();
    },
};

const run = runners[target];
if (!run) {
    console.error(`Cible inconnue : "${target}". Utiliser css | js | assets | gzip | all`);
    process.exit(1);
}

const isMain =
    process.argv[1] &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
    await run();
}
