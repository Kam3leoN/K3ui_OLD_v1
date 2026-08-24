/**
 * PurgeCSS pour la copie docs uniquement — ne modifie pas dist/ (CSS publish complet).
 * Exécuter après `copy:docs` pour que k3ui-docs/css/* soit purgé.
 */
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PurgeCSS } from 'purgecss';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.resolve(root, '..', 'k3ui-docs');
const docsCssDir = path.join(docsRoot, 'css');

/**
 * Classes générées dynamiquement en JS (template literals / BEM runtime).
 * PurgeCSS ne les voit pas dans le HTML statique — les garder ici sinon le layout casse.
 * Quand un composant « propre » construit son DOM en JS, ajouter son préfixe BEM ici.
 */
const safelist = [
  /^codeblock__token$/,
  /^codeblock__token--/,
  /^ripple$/,
  /^btn(--|$)/,
  /^btn-arrow/,
  /^button-arrow/,
  /^btn-pad/,
  /^button-pad/,
  /^btn-grid/,
  /^button-grid/,
  /^btn-shape/,
  /^button-shape/,
  /^toolbar/,
  /^pace/,
  /^fab/,
  /^k3ui-/,
  /^navbar-/,
  /^split-/,
  /^button-split/,
  /^select/,
  /^datepicker__/,
  /^page-footer/,
  /^footer-copyright/,
  /^footer-copyright__/,
  /^skip-link/,
  /^no-autoinit/,
  /^theme-/,
  /^md-sys-/,
  /^data-/,
  /^is-/,
  /^has-/,
  /^notch/,
  /^quote/,
  /** Perspective : classes d’effet / état ajoutées par Perspective.ts (wave, coverflow, etc.) */
  /^perspective$/,
  /^perspective--/,
  /^perspective__/,
  /** Counter : wrapper/tailles/boutons créés dans Counter.ts (ex. counter__wrapper--counter--md) */
  /^counter$/,
  /^counter--/,
  /^counter__/,
  /^active$/,
  /^open$/,
  /^show$/,
  /^hide$/,
  /pill-anim/,
  /indicator-scale/,
  /indicator-fade/,
  /nav-item-indicator/,
];

/**
 * Sélecteurs qui DOIVENT survivre à la purge (garde-fou anti-régression).
 * Échoue le build si PurgeCSS a encore retiré le CSS d’un composant dynamique.
 */
const requiredSelectorsAfterPurge = [
  '.counter__wrapper--counter--md',
  '.counter__wrapper--counter--md .counter__btn',
  '.counter__number',
];

const content = [
  path.join(docsRoot, '**', '*.php'),
  path.join(root, 'src', '**', '*.ts'),
  path.join(root, 'src', '**', '*.html'),
  path.join(docsRoot, 'js', '**', '*.js'),
];

/** Uniquement les copies docs — dist/css reste le CSS bibliothèque non purgé. */
const cssTargets = [
  path.join(docsCssDir, 'k3ui.css'),
  path.join(docsCssDir, 'k3ui.min.css'),
  path.join(docsCssDir, 'k3ui-core.css'),
  path.join(docsCssDir, 'k3ui-core.min.css'),
];

for (const cssPath of cssTargets) {
  if (!(await fs.pathExists(cssPath))) {
    console.warn(`[purge-css] Absent (ignoré) : ${path.relative(docsRoot, cssPath)}`);
    continue;
  }

  const purgeCSS = new PurgeCSS();
  const result = await purgeCSS.purge({
    content,
    css: [{ raw: await fs.readFile(cssPath, 'utf8') }],
    safelist,
    defaultExtractor: (content) => content.match(/[\w-/:.%[\]()]+(?<!:)/g) || [],
  });

  if (result[0]?.css) {
    const purgedCss = result[0].css;
    const isFullBundle = /k3ui(\.min)?\.css$/.test(path.basename(cssPath));
    if (isFullBundle) {
      const missing = requiredSelectorsAfterPurge.filter((sel) => {
        const needle = sel.replace(/\./g, '\\.').replace(/\s+/g, '\\s*');
        return !new RegExp(needle).test(purgedCss);
      });
      if (missing.length > 0) {
        throw new Error(
          `[purge-css] Sélecteurs critiques absents après purge (${path.basename(cssPath)}): ${missing.join(', ')}. ` +
            'Ajouter le préfixe BEM du composant au safelist (classes générées en JS).'
        );
      }
    }
    await fs.writeFile(cssPath, purgedCss, 'utf8');
    const kb = Math.round(Buffer.byteLength(purgedCss, 'utf8') / 1024);
    console.log(`[purge-css] docs/${path.basename(cssPath)} → ${kb} Ko`);
  }
}

console.log('[purge-css] dist/css préservé (non purgé).');

// Re-gzip la copie docs après purge (les .gz doivent matcher le CSS purgé).
const { gzipDocsAssets } = await import('./copy-docs.mjs');
await gzipDocsAssets();
