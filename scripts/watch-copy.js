/**
 * Script de surveillance pour copier automatiquement les fichiers vers k3ui-docs
 * Surveille les changements dans dist/ et copie vers ../k3ui-docs/
 */

const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');
const docsDir = path.resolve(__dirname, '../../k3ui-docs');

// Fonction pour copier un fichier
function copyFile(src, dest) {
    try {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(src, dest);
        console.log(`✅ Copié: ${path.relative(distDir, src)} -> ${path.relative(docsDir, dest)}`);
    } catch (error) {
        console.error(`❌ Erreur lors de la copie de ${src}:`, error.message);
    }
}

// Fonction pour copier tous les fichiers nécessaires
function copyAll() {
    console.log('📦 Copie des fichiers vers k3ui-docs...');

    // Copier les CSS
    const cssFiles = [
        { src: path.join(distDir, 'css', 'k3ui.css'), dest: path.join(docsDir, 'css', 'k3ui.css') },
        { src: path.join(distDir, 'css', 'k3ui.min.css'), dest: path.join(docsDir, 'css', 'k3ui.min.css') }
    ];

    // Copier les JS
    const jsFiles = [
        { src: path.join(distDir, 'js', 'k3ui.js'), dest: path.join(docsDir, 'js', 'k3ui.js') },
        { src: path.join(distDir, 'js', 'k3ui.min.js'), dest: path.join(docsDir, 'js', 'k3ui.min.js') },
        { src: path.join(distDir, 'js', 'init.js'), dest: path.join(docsDir, 'js', 'init.js') },
        { src: path.join(distDir, 'js', 'init-sample.js'), dest: path.join(docsDir, 'js', 'init-sample.js') }
    ];

    // Copier tous les fichiers
    [...cssFiles, ...jsFiles].forEach(({ src, dest }) => {
        if (fs.existsSync(src)) {
            copyFile(src, dest);
        }
    });

    console.log('✅ Copie terminée\n');
}

// Fonction pour surveiller un fichier
function watchFile(filePath, destPath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    fs.watchFile(filePath, { interval: 500 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
            copyFile(filePath, destPath);
        }
    });
}

// Surveiller les fichiers
console.log('👀 Surveillance des fichiers en cours...\n');

// Copier une première fois
copyAll();

// Surveiller les fichiers CSS
watchFile(path.join(distDir, 'css', 'k3ui.css'), path.join(docsDir, 'css', 'k3ui.css'));
watchFile(path.join(distDir, 'css', 'k3ui.min.css'), path.join(docsDir, 'css', 'k3ui.min.css'));

// Surveiller les fichiers JS
watchFile(path.join(distDir, 'js', 'k3ui.js'), path.join(docsDir, 'js', 'k3ui.js'));
watchFile(path.join(distDir, 'js', 'k3ui.min.js'), path.join(docsDir, 'js', 'k3ui.min.js'));
watchFile(path.join(distDir, 'js', 'init.js'), path.join(docsDir, 'js', 'init.js'));
watchFile(path.join(distDir, 'js', 'init-sample.js'), path.join(docsDir, 'js', 'init-sample.js'));

// Garder le processus actif
process.on('SIGINT', () => {
    console.log('\n👋 Arrêt de la surveillance...');
    process.exit(0);
});
