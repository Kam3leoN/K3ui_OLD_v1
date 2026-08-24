/**
 * Harnais de non-régression CSS (chantier déduplication K3UI).
 * Usage :
 *   node scripts/css-regression-harness.mjs baseline
 *   node scripts/css-regression-harness.mjs compare [candidate.css]
 *   node scripts/css-regression-harness.mjs audit [fichier.css]
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import zlib from 'zlib';
import postcss from 'postcss';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(root, 'build');
const baselinePath = path.join(buildDir, 'baseline.css');
const baselineMinPath = path.join(buildDir, 'baseline.min.css');
const manifestPath = path.join(buildDir, 'baseline-manifest.json');

const SCSS_ENTRY = path.join(root, 'scss', 'index.scss');
const SASS_LOAD_PATH = path.join(root, 'scss');

/**
 * Compile la baseline de référence (expanded + min).
 */
async function compileBaseline() {
    await fs.ensureDir(buildDir);
    const sassCmd = (out, style) =>
        `npx sass "${SCSS_ENTRY}" "${out}" --style=${style} --load-path="${SASS_LOAD_PATH}"`;

    execSync(sassCmd(baselinePath, 'expanded'), { cwd: root, stdio: 'inherit' });
    execSync(sassCmd(baselineMinPath, 'compressed'), { cwd: root, stdio: 'inherit' });

    const expanded = await fs.readFile(baselinePath);
    const min = await fs.readFile(baselineMinPath);
    const metrics = await collectFileMetrics(baselinePath, expanded);

    const manifest = {
        generatedAt: new Date().toISOString(),
        scssEntry: 'scss/index.scss',
        files: {
            expanded: {
                path: 'build/baseline.css',
                bytes: expanded.length,
                gzipBytes: zlib.gzipSync(expanded).length,
            },
            min: {
                path: 'build/baseline.min.css',
                bytes: min.length,
                gzipBytes: zlib.gzipSync(min).length,
            },
        },
        metrics,
    };

    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    console.log('\n✅ Baseline enregistrée :');
    console.log(`   ${baselinePath} (${metrics.bytes} o, gzip ${metrics.gzipBytes} o)`);
    console.log(`   Manifest : ${manifestPath}`);
}

/**
 * Métriques d'audit sur le CSS brut (diagnostic duplication).
 * @param {string} filePath
 * @param {Buffer} [buffer]
 */
async function collectFileMetrics(filePath, buffer) {
    const css = buffer ? buffer.toString('utf8') : await fs.readFile(filePath, 'utf8');

    const primaryDefs = [...css.matchAll(/(--md-sys-color-primary\s*:\s*[^;]+;)/g)];
    const motionEasingDup = (css.match(/cubic-bezier\(0\.34,\s*0\.8,\s*0\.34,\s*1\)/g) || []).length;
    const tokenVarRefs = (css.match(/--md-(?:sys|comp)-[\w-]+/g) || []).length;
    const stateLayerBefore = (css.match(/::before\s*\{[^}]*opacity:\s*0[^}]*\}/g) || []).length;

    const parsed = postcss.parse(css);
    let ruleCount = 0;
    const selectors = new Set();

    parsed.walkRules((rule) => {
        ruleCount += 1;
        selectors.add(rule.selector.trim());
    });

    /** Compte les blocs :root qui définissent primary (par sélecteur parent). */
    const primaryBySelector = new Map();
    parsed.walkRules((rule) => {
        let hasPrimary = false;
        rule.walkDecls((decl) => {
            if (decl.prop === '--md-sys-color-primary') {
                hasPrimary = true;
            }
        });
        if (hasPrimary) {
            const key = rule.selector.trim();
            primaryBySelector.set(key, (primaryBySelector.get(key) || 0) + 1);
        }
    });

    return {
        bytes: Buffer.byteLength(css, 'utf8'),
        gzipBytes: zlib.gzipSync(Buffer.from(css)).length,
        ruleCount,
        uniqueSelectors: selectors.size,
        tokenVarReferences: tokenVarRefs,
        mdSysColorPrimaryDefinitions: primaryDefs.length,
        mdSysColorPrimaryBySelector: Object.fromEntries(primaryBySelector),
        cubicBezier034080341: motionEasingDup,
        pseudoBeforeOpacityBlocks: stateLayerBefore,
    };
}

/**
 * Normalise une déclaration pour comparaison (ordre des props ignoré au niveau règle).
 * @param {import('postcss').Declaration} decl
 */
/**
 * Normalise var(--token, fallback) → var(--token) pour comparer l'équivalence
 * lorsque les custom properties sont définies sur :root / html[data-theme].
 * @param {string} value
 */
function normalizeCSSValue(value) {
    return value
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/var\(\s*(--[\w-]+)\s*,[^)]+\)/gi, 'var($1)');
}

function declKey(decl) {
    const prop = decl.prop.trim().toLowerCase();
    const value = normalizeCSSValue(decl.value);
    const important = decl.important ? ' !important' : '';
    return `${prop}:${value}${important}`;
}

/**
 * Extrait une carte sélecteur → déclarations triées (gère @media en préfixant le sélecteur).
 * @param {string} cssText
 */
function extractNormalizedRules(cssText) {
    const root = postcss.parse(cssText);
    const map = new Map();

    const walk = (node, mediaPrefix = '') => {
        if (node.type === 'atrule' && node.name === 'media') {
            const media = `@media ${node.params}`;
            node.each((child) => walk(child, mediaPrefix ? `${mediaPrefix} || ${media}` : media));
            return;
        }
        if (node.type === 'rule') {
            const selector = node.selector.trim();
            const key = mediaPrefix ? `${mediaPrefix} :: ${selector}` : selector;
            const decls = [];
            node.each((child) => {
                if (child.type === 'decl') {
                    decls.push(declKey(child));
                }
            });
            decls.sort();
            const signature = decls.join(';');
            if (map.has(key)) {
                const prev = map.get(key);
                if (prev !== signature) {
                    map.set(`${key} /*duplicate*/`, signature);
                }
            } else {
                map.set(key, signature);
            }
        }
    };

    root.each((node) => walk(node));
    return map;
}

/**
 * Compare deux feuilles ; retourne un rapport structuré.
 * @param {string} referencePath
 * @param {string} candidatePath
 */
async function compareCssFiles(referencePath, candidatePath) {
    const refCss = await fs.readFile(referencePath, 'utf8');
    const candCss = await fs.readFile(candidatePath, 'utf8');
    const refMap = extractNormalizedRules(refCss);
    const candMap = extractNormalizedRules(candCss);

    const onlyRef = [];
    const onlyCand = [];
    const changed = [];

    for (const [sel, sig] of refMap) {
        if (!candMap.has(sel)) {
            onlyRef.push(sel);
        } else if (candMap.get(sel) !== sig) {
            changed.push({
                selector: sel,
                reference: sig.slice(0, 200) + (sig.length > 200 ? '…' : ''),
                candidate: candMap.get(sel).slice(0, 200) + (candMap.get(sel).length > 200 ? '…' : ''),
            });
        }
    }
    for (const sel of candMap.keys()) {
        if (!refMap.has(sel)) {
            onlyCand.push(sel);
        }
    }

    const isFullscreenSelector = (s) => /fullscreen|full-screen|:is\(/i.test(s);
    const isRemovedRedundantThemeBody = (s) => /^html\[data-theme=(?:light|dark)\] body$/i.test(s.trim());

    const allowedOnlyRef = onlyRef.every((s) => isFullscreenSelector(s) || isRemovedRedundantThemeBody(s));
    const allowedOnlyCand = onlyCand.every((s) => isFullscreenSelector(s));

    const structuralOnly =
        changed.length === 0 && allowedOnlyRef && (onlyCand.length === 0 || allowedOnlyCand);

    return {
        reference: referencePath,
        candidate: candidatePath,
        referenceRules: refMap.size,
        candidateRules: candMap.size,
        onlyInReference: onlyRef.length,
        onlyInCandidate: onlyCand.length,
        changedDeclarations: changed.length,
        changed: changed.slice(0, 50),
        onlyReferenceSelectors: onlyRef.slice(0, 30),
        onlyCandidateSelectors: onlyCand.slice(0, 30),
        structuralOnly,
        equivalent: structuralOnly,
    };
}

async function runCompare(candidateArg) {
    const candidate = candidateArg
        ? path.resolve(root, candidateArg)
        : path.join(root, 'dist', 'css', 'k3ui.css');

    if (!(await fs.pathExists(baselinePath))) {
        console.error('Baseline absente. Exécutez : npm run css:baseline');
        process.exit(1);
    }
    if (!(await fs.pathExists(candidate))) {
        console.error(`Fichier candidat introuvable : ${candidate}`);
        process.exit(1);
    }

    const report = await compareCssFiles(baselinePath, candidate);
    const reportPath = path.join(buildDir, 'css-compare-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });

    if (report.equivalent) {
        console.log('✅ CSS équivalent (sélecteurs + déclarations normalisées).');
        console.log(`   Référence : ${report.referenceRules} règles`);
    } else {
        console.log('❌ Différences détectées :');
        console.log(`   Règles modifiées : ${report.changedDeclarations}`);
        console.log(`   Uniquement baseline : ${report.onlyInReference}`);
        console.log(`   Uniquement candidat : ${report.onlyInCandidate}`);
        console.log(`   Rapport : ${reportPath}`);
        process.exit(1);
    }
}

async function runAudit(fileArg) {
    const file = fileArg ? path.resolve(root, fileArg) : baselinePath;
    const metrics = await collectFileMetrics(file);
    console.log(JSON.stringify(metrics, null, 2));
}

const [command, arg] = process.argv.slice(2);

switch (command) {
    case 'baseline':
        await compileBaseline();
        break;
    case 'compare':
        await runCompare(arg);
        break;
    case 'audit':
        await runAudit(arg);
        break;
    default:
        console.log(`Usage:
  node scripts/css-regression-harness.mjs baseline
  node scripts/css-regression-harness.mjs compare [chemin/candidat.css]
  node scripts/css-regression-harness.mjs audit [fichier.css]`);
        process.exit(command ? 1 : 0);
}
