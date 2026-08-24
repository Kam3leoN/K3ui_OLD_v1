/**
 * Copie dist/ et assets vers k3ui-start
 * Usage : node scripts/copy-start.mjs [css|js|assets|all]
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const startRoot = path.resolve(root, '..', 'k3ui-start');
const distDir = path.join(root, 'dist');
const target = process.argv[2] ?? 'all';

async function copyCss() {
    const destDir = path.join(startRoot, 'css');
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
    const destDir = path.join(startRoot, 'js');
    await fs.ensureDir(destDir);
    if (await fs.pathExists(destDir)) {
        for (const name of await fs.readdir(destDir)) {
            if (/^vendor-.*\.js(\.map)?$/i.test(name) || /^k3ui.*\.js(\.map)?$/i.test(name)) {
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
    const destDir = path.join(startRoot, 'assets', 'fonts');
    if (await fs.pathExists(srcFonts)) {
        await fs.ensureDir(destDir);
        await fs.copy(srcFonts, destDir, { overwrite: true });
    }

    const srcMessageBoxImg = path.join(root, 'assets', 'images', 'messagebox');
    const destMessageBoxImg = path.join(startRoot, 'assets', 'images', 'messagebox');
    if (await fs.pathExists(srcMessageBoxImg)) {
        await fs.ensureDir(destMessageBoxImg);
        await fs.copy(srcMessageBoxImg, destMessageBoxImg, { overwrite: true });
    }

    const srcSounds = path.join(root, 'assets', 'sounds');
    const destSounds = path.join(startRoot, 'assets', 'sounds');
    for (const file of ['message_letter.ogg', 'message_end.ogg']) {
        const src = path.join(srcSounds, file);
        if (await fs.pathExists(src)) {
            await fs.ensureDir(destSounds);
            await fs.copy(src, path.join(destSounds, file), { overwrite: true });
        }
    }
}

const runners = {
    css: copyCss,
    js: copyJs,
    assets: copyAssets,
    all: async () => {
        await copyCss();
        await copyJs();
        await copyAssets();
    },
};

const run = runners[target];
if (!run) {
    console.error(`Cible inconnue : "${target}". Utiliser css | js | assets | all`);
    process.exit(1);
}

await run();
console.log(`[copy-start] OK → ${startRoot} (${target})`);
