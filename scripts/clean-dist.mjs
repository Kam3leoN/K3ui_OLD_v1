/**
 * Nettoyage de dist/ (remplace les scripts PowerShell — LOT 8)
 * Usage : node scripts/clean-dist.mjs [js|css|final]
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distJs = path.join(root, 'dist', 'js');
const distCss = path.join(root, 'dist', 'css');

const phase = process.argv[2] ?? 'all';

/**
 * Supprime les artefacts JS intermédiaires avant build.
 */
async function cleanDistJs() {
    if (!(await fs.pathExists(distJs))) {
        return;
    }
    const entries = await fs.readdir(distJs);
    for (const name of entries) {
        if (/^k3ui-.*\.js(\.map)?$/i.test(name)) {
            await fs.remove(path.join(distJs, name));
        }
    }
    for (const name of ['k3ui.js.map', 'k3ui.min.js.map']) {
        const file = path.join(distJs, name);
        if (await fs.pathExists(file)) {
            await fs.remove(file);
        }
    }
}

/**
 * Supprime les source maps CSS et fichiers de test.
 */
async function cleanDistCss() {
    if (!(await fs.pathExists(distCss))) {
        return;
    }
    for (const name of ['k3ui.css.map', 'k3ui.min.css.map', 'k3ui-test.css']) {
        const file = path.join(distCss, name);
        if (await fs.pathExists(file)) {
            await fs.remove(file);
        }
    }
}

/**
 * Ne conserve que k3ui.js / k3ui.min.js, les chunks k3ui-*.js et k3ui.css / k3ui.min.css (+ core).
 */
async function cleanDistFinal() {
    if (await fs.pathExists(distJs)) {
        const keepJs = new Set(['k3ui.js', 'k3ui.min.js']);
        for (const name of await fs.readdir(distJs)) {
            const full = path.join(distJs, name);
            const stat = await fs.stat(full);
            if (stat.isDirectory()) {
                await fs.remove(full);
            } else if (!keepJs.has(name) && !/^k3ui-.+\.js$/i.test(name)) {
                await fs.remove(full);
            }
        }
    }
    if (await fs.pathExists(distCss)) {
        const keepCss = new Set(['k3ui.css', 'k3ui.min.css', 'k3ui-core.css', 'k3ui-core.min.css']);
        for (const name of await fs.readdir(distCss)) {
            if (!keepCss.has(name)) {
                await fs.remove(path.join(distCss, name));
            }
        }
    }
}

const runners = {
    js: cleanDistJs,
    css: cleanDistCss,
    final: cleanDistFinal,
    all: async () => {
        await cleanDistJs();
        await cleanDistCss();
        await cleanDistFinal();
    },
};

const run = runners[phase];
if (!run) {
    console.error(`Phase inconnue : "${phase}". Utiliser js | css | final | all`);
    process.exit(1);
}

await run();
