#!/usr/bin/env node

/**
 * Script de génération automatique de documentation à partir des tests
 * Usage: node generate-docs.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TESTS_DIR = path.join(__dirname, 'tests');
const DOCS_DIR = path.join(__dirname, '..', 'k3ui-docs');
const OUTPUT_FILE = path.join(DOCS_DIR, 'api.php');
const LIBS_JS_DIR = path.join(__dirname, 'src', 'libs', 'js');
const LIBS_TS_DIR = path.join(__dirname, 'src', 'libs', 'ts');

/**
 * Exécute Jest en mode JSON et retourne les résultats par test
 * @returns {Map<string, Map<string, string>>} fichier -> (nom test -> statut)
 */
function runJestAndCollectResults() {
    const results = new Map();
    try {
        console.log('🧪 Exécution des tests Jest...');
        const tmpFile = path.join(__dirname, '.jest-results.json');
        try {
            execSync(`npx jest --json --no-coverage --outputFile .jest-results.json`, {
                cwd: __dirname,
                maxBuffer: 50 * 1024 * 1024,
                encoding: 'utf8',
            });
        } catch (_) {
            // Jest sort en erreur quand des tests échouent, mais écrit quand même le fichier
        }
        if (fs.existsSync(tmpFile)) {
            const json = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
            for (const suite of json.testResults) {
                const suitePath = suite.name || suite.testFilePath;
                if (!suitePath) continue;
                const filename = path.basename(suitePath);
                const testMap = new Map();
                const assertions = suite.assertionResults || suite.testResults || [];
                for (const t of assertions) {
                    testMap.set(t.title, t.status);
                }
                results.set(filename, testMap);
            }
            console.log(`   ✅ ${json.numPassedTests} Réussi, ❌ ${json.numFailedTests} Échec, ⏭️  ${json.numPendingTests} À corriger`);
            fs.unlinkSync(tmpFile);
        } else {
            console.warn('⚠️  Fichier de résultats Jest non trouvé');
        }
    } catch (e) {
        console.warn('⚠️  Impossible de parser les résultats Jest:', e.message);
    }
    return results;
}

/**
 * Extrait les informations des tests
 */
function extractTestInfo(testFile) {
    const content = fs.readFileSync(testFile, 'utf8');
    const lines = content.split('\n');
    
    // Déterminer le type détaillé
    let type = 'other';
    if (testFile.includes('components')) {
        type = 'component';
    } else if (testFile.includes('integration')) {
        type = 'integration';
    } else if (testFile.includes('core' + path.sep) || testFile.includes('core/')) {
        const filename = path.basename(testFile);
        if (filename.includes('Factory')) {
            type = 'factory';
        } else if (filename.includes('Registry')) {
            type = 'registry';
        } else if (filename.includes('Component') && !filename.includes('ComponentRegistry')) {
            type = 'base';
        } else if (filename.includes('Manager')) {
            type = 'manager';
        } else {
            type = 'manager'; // Par défaut pour les fichiers core
        }
    }
    
    const info = {
        file: path.basename(testFile),
        component: '',
        tests: [],
        features: [],
        coverage: 0,
        type
    };
    
    // Extraire le nom du composant
    const componentMatch = content.match(/describe\(\s*'((?:[^'\\]|\\.)*)'/) || content.match(/describe\(\s*"((?:[^"\\]|\\.)*)"/);
    if (componentMatch) {
        info.component = componentMatch[1].replace(/\\['"]/g, (m) => m[1]);
    }
    
    // Extraire les tests (it() ou test() Jest/Vitest) — gère les apostrophes échappées
    const testMatches = content.matchAll(/(?:^|[\s;.])(?:it|test)(?:\.skip)?\(\s*'((?:[^'\\]|\\.)*)'/gm);
    for (const match of testMatches) {
        info.tests.push(match[1].replace(/\\'/g, "'"));
    }
    // Aussi chercher les tests avec guillemets doubles
    const testMatchesDQ = content.matchAll(/(?:^|[\s;.])(?:it|test)(?:\.skip)?\(\s*"((?:[^"\\]|\\.)*)"/gm);
    for (const match of testMatchesDQ) {
        info.tests.push(match[1].replace(/\\"/g, '"'));
    }
    
    // Extraire les fonctionnalités testées — gère les apostrophes échappées
    const describeMatches = content.matchAll(/describe\(\s*'((?:[^'\\]|\\.)*)'/g);
    for (const match of describeMatches) {
        const name = match[1].replace(/\\'/g, "'");
        if (name !== info.component) {
            info.features.push(name);
        }
    }
    const describeMatchesDQ = content.matchAll(/describe\(\s*"((?:[^"\\]|\\.)*)"/g);
    for (const match of describeMatchesDQ) {
        const name = match[1].replace(/\\"/g, '"');
        if (name !== info.component) {
            info.features.push(name);
        }
    }
    
    return info;
}

/**
 * Compte les librairies externes
 */
function countLibs() {
    let jsCount = 0;
    let tsCount = 0;
    
    try {
        if (fs.existsSync(LIBS_JS_DIR)) {
            const jsFiles = fs.readdirSync(LIBS_JS_DIR);
            jsCount = jsFiles.filter(file => file.endsWith('.js')).length;
        }
    } catch (error) {
        console.warn('⚠️  Impossible de lire le dossier libs/js:', error.message);
    }
    
    try {
        if (fs.existsSync(LIBS_TS_DIR)) {
            const tsFiles = fs.readdirSync(LIBS_TS_DIR);
            tsCount = tsFiles.filter(file => file.endsWith('.ts')).length;
        }
    } catch (error) {
        console.warn('⚠️  Impossible de lire le dossier libs/ts:', error.message);
    }
    
    return { js: jsCount, ts: tsCount, total: jsCount + tsCount };
}

/**
 * Retourne l'icône + couleur pour un statut de test
 */
function statusIcon(status) {
    switch (status) {
        case 'passed':
            return '<i name="check" size="sm" style="color: var(--md-sys-color-primary, #4caf50); vertical-align: middle; margin-right: 0.25rem;" aria-label="Test réussi"></i>';
        case 'failed':
            return '<i name="xmark" size="sm" style="color: var(--md-sys-color-error, #f44336); vertical-align: middle; margin-right: 0.25rem;" aria-label="Test échoué"></i>';
        case 'pending':
        case 'skipped':
            return '<i name="warning" size="sm" style="color: #ff9800; vertical-align: middle; margin-right: 0.25rem;" aria-label="Test en attente"></i>';
        default:
            return '<i name="warning" size="sm" style="color: #9e9e9e; vertical-align: middle; margin-right: 0.25rem;" aria-label="Statut inconnu"></i>';
    }
}

/**
 * Chip de statut global pour une suite de tests
 */
function suiteStatusChip(info, jestResults) {
    const testMap = jestResults.get(info.file);
    if (!testMap) {
        return `<div class="chip chip--assist chip--sm no-autoinit"><i name="circle-question" size="sm" class="chip__icon"></i><span class="chip__label">${info.tests.length} tests</span></div>`;
    }
    let passed = 0, failed = 0, skipped = 0;
    for (const t of info.tests) {
        const s = testMap.get(t) || 'unknown';
        if (s === 'passed') passed++;
        else if (s === 'failed') failed++;
        else skipped++;
    }
    const passedChip = `<div class="chip chip--assist chip--sm no-autoinit" style="background:var(--md-sys-color-primary-container, #e8f5e9);color:var(--md-sys-color-on-primary-container, #1b5e20);"><i name="check" size="sm" class="chip__icon"></i><span class="chip__label">${passed} Réussi</span></div>`;
    const failedChip = `<div class="chip chip--assist chip--sm no-autoinit" style="background:var(--md-sys-color-error-container, #fce4ec);color:var(--md-sys-color-on-error-container, #b71c1c);"><i name="xmark" size="sm" class="chip__icon"></i><span class="chip__label">${failed} Échec</span></div>`;
    const skippedChip = `<div class="chip chip--assist chip--sm no-autoinit" style="background:#fff3e0;color:#e65100;"><i name="warning" size="sm" class="chip__icon"></i><span class="chip__label">${skipped} À corriger</span></div>`;
    return `<div class="chip-group" style="display:flex;gap:0.25rem;justify-content:flex-end;flex-wrap:wrap;">${passedChip}${failedChip}${skippedChip}</div>`;
}

/**
 * Génère un bloc HTML pour une catégorie de tests (chips filtrants + cards)
 */
function generateCategoryBlock(id, label, items, jestResults) {
    if (items.length === 0) return '';
    return items.map(info => {
        const testMap = jestResults.get(info.file);
        return `
                <section class="doc-section" id="${id}-${info.component.toLowerCase().replace(/\s+/g, '-')}">
                    <div class="card card--outlined" style="margin-bottom: 1rem;">
                        <div class="card__content">
                            <h3>${info.component}</h3>
                            <div class="row row--gap-dense" style="margin-bottom: 0.75rem;">
                                <div class="col s12 m6">
                                    <div class="chip chip--assist chip--sm no-autoinit"><i name="file-code" size="sm" class="chip__icon"></i><span class="chip__label">${info.file}</span></div>
                                </div>
                                <div class="col s12 m6" style="text-align:right;">
                                    ${suiteStatusChip(info, jestResults)}
                                </div>
                            </div>
                            ${info.features.length > 0 ? `
                            <h4>Fonctionnalités testées</h4>
                            <div class="chip-group" style="margin-bottom:0.75rem;">
                                ${info.features.map(f => `<div class="chip chip--assist chip--sm no-autoinit"><i name="flask" size="sm" class="chip__icon"></i><span class="chip__label">${f}</span></div>`).join('\n                                ')}
                            </div>` : ''}
                            <h4>Tests détaillés</h4>
                            <ul class="list list--one-line no-autoinit">
                                ${info.tests.map(t => {
                                    const s = testMap ? (testMap.get(t) || 'unknown') : 'unknown';
                                    return `<li class="list__item">${statusIcon(s)}<span class="list__item-text">${t}</span></li>`;
                                }).join('\n                                ')}
                            </ul>
                        </div>
                    </div>
                </section>`;
    }).join('\n');
}

/**
 * Génère le partial body (api-body.php)
 */
function generateBodyPartial(testInfos, components, libsCount, jestResults) {
    const integration = testInfos.filter(info => info.type === 'integration');
    const factories = testInfos.filter(info => info.type === 'factory');
    const registries = testInfos.filter(info => info.type === 'registry');
    const base = testInfos.filter(info => info.type === 'base');
    const managersOnly = testInfos.filter(info => info.type === 'manager');
    
    const totalTests = testInfos.reduce((sum, info) => sum + info.tests.length, 0);
    const totalTested = components.length + managersOnly.length + factories.length + registries.length + base.length;

    // Compteurs Jest globaux
    let jestPassed = 0, jestFailed = 0, jestSkipped = 0;
    for (const [, testMap] of jestResults) {
        for (const [, status] of testMap) {
            if (status === 'passed') jestPassed++;
            else if (status === 'failed') jestFailed++;
            else jestSkipped++;
        }
    }

    const statCards = [
        { value: components.length, label: 'Composants' },
        { value: managersOnly.length, label: 'Managers' },
        { value: factories.length, label: 'Factories' },
        { value: registries.length, label: 'Registres' },
        { value: base.length, label: 'Base' },
        { value: totalTested, label: 'Total testés' },
        { value: jestPassed + jestFailed + jestSkipped, label: 'Tests total' },
        { value: libsCount.total, label: 'Libs externes' },
    ];

    const categories = [
        { id: 'components', label: 'Composants UI', count: components.length, items: components },
        { id: 'managers', label: 'Managers', count: managersOnly.length, items: managersOnly },
        { id: 'factories', label: 'Factories', count: factories.length, items: factories },
        { id: 'registries', label: 'Registres', count: registries.length, items: registries },
        { id: 'base', label: 'Base', count: base.length, items: base },
        { id: 'integration', label: 'Tests d\'Intégration', count: integration.length, items: integration },
    ];

    return `<?php declare(strict_types=1); ?>

            <section class="doc-section" id="overview">
                <h2 id="overview-title">Vue d'ensemble</h2>
                <p>Documentation API complète générée automatiquement à partir des tests unitaires K3UI.</p>

                <div class="row row--gap-dense" style="margin-top: 1.5rem;">
${statCards.map(s => `                    <div class="col s6 m3 l3">
                        <div class="card card--filled">
                            <div class="card__content" style="padding: 1.5rem 1rem; text-align: center;">
                                <span style="font-size: 2.5rem; font-weight: 700; display: block;">${s.value}</span>
                                <span style="font-size: 0.85rem; margin-top: 0.25rem; display: block;">${s.label}</span>
                            </div>
                        </div>
                    </div>`).join('\n')}
                </div>

                <div class="row row--gap-dense" style="margin-top: 1rem;">
                    <div class="col s12 m4">
                        <div class="card card--filled" style="background:var(--md-sys-color-primary-container, #e8f5e9);">
                            <div class="card__content" style="padding: 1rem; text-align: center;">
                                <i name="check" size="sm" style="vertical-align:middle;"></i>
                                <span style="font-size: 1.75rem; font-weight: 700; margin-left: 0.5rem; vertical-align: middle;">${jestPassed}</span>
                                <span style="font-size: 0.85rem; display: block; margin-top: 0.25rem;">Réussi</span>
                            </div>
                        </div>
                    </div>
                    <div class="col s12 m4">
                        <div class="card card--filled" style="background:var(--md-sys-color-error-container, #fce4ec);">
                            <div class="card__content" style="padding: 1rem; text-align: center;">
                                <i name="xmark" size="sm" style="vertical-align:middle;"></i>
                                <span style="font-size: 1.75rem; font-weight: 700; margin-left: 0.5rem; vertical-align: middle;">${jestFailed}</span>
                                <span style="font-size: 0.85rem; display: block; margin-top: 0.25rem;">Échec</span>
                            </div>
                        </div>
                    </div>
                    <div class="col s12 m4">
                        <div class="card card--filled" style="background:#fff3e0;">
                            <div class="card__content" style="padding: 1rem; text-align: center;">
                                <i name="warning" size="sm" style="vertical-align:middle;"></i>
                                <span style="font-size: 1.75rem; font-weight: 700; margin-left: 0.5rem; vertical-align: middle;">${jestSkipped}</span>
                                <span style="font-size: 0.85rem; display: block; margin-top: 0.25rem;">À corriger</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 1rem; display: flex; gap: 1.5rem; flex-wrap: wrap; font-size: 0.85rem; opacity: 0.8;">
                    <span><i name="check" size="sm" style="color: var(--md-sys-color-primary, #4caf50); vertical-align: middle;"></i> Test réussi</span>
                    <span><i name="xmark" size="sm" style="color: var(--md-sys-color-error, #f44336); vertical-align: middle;"></i> Test échoué</span>
                    <span><i name="warning" size="sm" style="color: #ff9800; vertical-align: middle;"></i> À corriger</span>
                </div>
            </section>

${categories.filter(c => c.items.length > 0).map(c => `
            <section class="doc-section" id="${c.id}">
                <h2 id="${c.id}-title">${c.label} <span class="chip chip--assist chip--sm no-autoinit" style="vertical-align:middle;"><i name="hashtag" size="sm" class="chip__icon"></i><span class="chip__label">${c.count}</span></span></h2>
${generateCategoryBlock(c.id, c.label, c.items, jestResults)}
            </section>`).join('\n')}

            <section class="doc-section" id="generation">
                <h2 id="generation-title">Régénération</h2>
                <div class="card card--outlined">
                    <div class="card__content">
                        <p>Cette documentation est générée automatiquement à partir des tests unitaires.</p>
                        <p><strong>Dernière mise à jour :</strong> ${new Date().toLocaleString('fr-FR')}</p>
                        <pre><code class="language-bash">node generate-docs.js</code></pre>
                    </div>
                </div>
            </section>`;
}

/**
 * Génère le fichier api.php principal (utilise le système $doc + shell.php)
 */
function generatePHPDoc(testInfos, components, managers, libsCount = { js: 0, ts: 0, total: 0 }, jestResults = new Map()) {
    const integration = testInfos.filter(info => info.type === 'integration');
    const factories = testInfos.filter(info => info.type === 'factory');
    const registries = testInfos.filter(info => info.type === 'registry');
    const base = testInfos.filter(info => info.type === 'base');
    const managersOnly = testInfos.filter(info => info.type === 'manager');
    const totalTested = components.length + managersOnly.length + factories.length + registries.length + base.length;
    let totalTests = 0;
    for (const [, testMap] of jestResults) {
        totalTests += testMap.size;
    }
    if (totalTests === 0) {
        totalTests = testInfos.reduce((sum, info) => sum + info.tests.length, 0);
    }

    const sections = ['overview', 'components', 'managers'];
    if (factories.length > 0) sections.push('factories');
    if (registries.length > 0) sections.push('registries');
    if (base.length > 0) sections.push('base');
    if (integration.length > 0) sections.push('integration');
    sections.push('generation');

    return `<?php

declare(strict_types=1);

require_once __DIR__ . '/partials/docs/helpers.php';

$title = 'API Documentation — K3UI';
$description = 'Documentation API complète de K3UI — ${totalTested} modules testés, ${totalTests} tests unitaires.';
$keywords = 'K3UI, API, Documentation, Tests, TypeScript, Material Design';

$docLayout = true;

$doc = [
    'slug' => 'api',
    'component' => 'API',
    'title' => 'API Documentation',
    'subtitle' => '${totalTested} modules testés — ${totalTests} tests unitaires — Générée automatiquement depuis les tests Jest.',
    'categoryLabel' => 'Démarrage',
    'categoryHref' => 'index.php',
    'hasPlayground' => false,
    'sections' => ['_skip'],
    'bodyPartial' => __DIR__ . '/partials/docs/pages/api-body.php',
];

include 'partials/header.php';
include __DIR__ . '/partials/docs/shell.php';
require_once 'partials/footer.php';
`;
}

/**
 * Fonction principale
 */
function main() {
    console.log('🔍 Analyse des tests...');
    
    // Trouver tous les fichiers de test
    const testFiles = [];
    
    function findTestFiles(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                findTestFiles(filePath);
            } else if (file.endsWith('.test.ts')) {
                testFiles.push(filePath);
            }
        }
    }
    
    findTestFiles(TESTS_DIR);
    
    console.log(`📁 Trouvé ${testFiles.length} fichiers de test`);
    
    // Extraire les informations
    const testInfos = testFiles.map(extractTestInfo);
    
    // Calculer les statistiques
    const components = testInfos.filter(info => info.type === 'component');
    const integration = testInfos.filter(info => info.type === 'integration');
    
    // Compter les librairies externes
    const libsCount = countLibs();
    console.log(`📚 Libs externes : ${libsCount.js} JS, ${libsCount.ts} TS (${libsCount.total} total)`);
    
    // Exécuter Jest et récupérer les résultats
    const jestResults = runJestAndCollectResults();

    // Générer le fichier principal api.php
    const phpDoc = generatePHPDoc(testInfos, components, [], libsCount, jestResults);
    fs.writeFileSync(OUTPUT_FILE, phpDoc);

    // Générer le body partial
    const bodyPartialDir = path.join(DOCS_DIR, 'partials', 'docs', 'pages');
    if (!fs.existsSync(bodyPartialDir)) {
        fs.mkdirSync(bodyPartialDir, { recursive: true });
    }
    const bodyPartial = generateBodyPartial(testInfos, components, libsCount, jestResults);
    fs.writeFileSync(path.join(bodyPartialDir, 'api-body.php'), bodyPartial);
    
    const factories = testInfos.filter(info => info.type === 'factory');
    const registries = testInfos.filter(info => info.type === 'registry');
    const base = testInfos.filter(info => info.type === 'base');
    const managers = testInfos.filter(info => info.type === 'manager');
    
    console.log(`✅ Documentation générée : ${OUTPUT_FILE}`);
    console.log(`📊 ${components.length} composants, ${managers.length} managers, ${factories.length} factories, ${registries.length} registres, ${base.length} base, ${integration.length} tests d'intégration documentés`);
    let jestTotal = 0;
    for (const [, testMap] of jestResults) { jestTotal += testMap.size; }
    console.log(`🧪 ${jestTotal || testInfos.reduce((sum, info) => sum + info.tests.length, 0)} tests`);
}

// Exécuter le script
if (require.main === module) {
    main();
}

module.exports = { extractTestInfo, generatePHPDoc: (testInfos) => {
    const components = testInfos.filter(info => info.type === 'component');
    const managers = testInfos.filter(info => info.type === 'manager');
    const libsCount = countLibs();
    return generatePHPDoc(testInfos, components, managers, libsCount);
}, countLibs };
