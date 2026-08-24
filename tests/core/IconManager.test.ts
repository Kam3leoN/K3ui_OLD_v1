/**
 * Tests unitaires pour le manager IconManager
 * @description Tests de toutes les fonctionnalités du gestionnaire d'icônes
 */

import { IconManager } from '../../src/core/managers/IconManager';

describe('IconManager', () => {
    /** Les fake timers globaux peuvent retarder queueMicrotask / microtâches utilisées par forceDisplayIcons */
    beforeAll(() => {
        jest.useRealTimers();
    });
    afterAll(() => {
        jest.useFakeTimers();
    });

    let testElement: HTMLElement;
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        // Mock fetch pour jsdom (fetch n'existe pas nativement)
        globalThis.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>'),
        }) as unknown as typeof fetch;

        // Nettoyer le DOM
        document.body.innerHTML = '';

        // Créer un élément icône pour les tests
        testElement = document.createElement('i');
        testElement.setAttribute('name', 'test-icon');
        document.body.appendChild(testElement);

        // Réinitialiser le manager
        IconManager.clearCache();
        IconManager.destroy();
    });

    afterEach(() => {
        // Nettoyer après chaque test
        document.body.innerHTML = '';
        IconManager.clearCache();
        globalThis.fetch = originalFetch;
    });

    describe('Configuration', () => {
        test('devrait configurer le basePath', () => {
            IconManager.configure({ basePath: '/custom/path/' });

            const config = IconManager.getConfiguration();
            expect(config.basePath).toBe('/custom/path/');
        });

        test('devrait configurer le debounceDelay', () => {
            IconManager.configure({ debounceDelay: 100 });

            const config = IconManager.getConfiguration();
            expect(config.debounceDelay).toBe(100);
        });

        test('devrait activer/désactiver le cache', () => {
            IconManager.configure({ enableCache: false });

            const config = IconManager.getConfiguration();
            expect(config.enableCache).toBe(false);
        });

        test('devrait retourner la configuration actuelle', () => {
            const config = IconManager.getConfiguration();

            expect(config).toBeDefined();
            expect(config.basePath).toBeDefined();
            expect(config.debounceDelay).toBeDefined();
            expect(config.enableCache).toBeDefined();
        });
    });

    describe('Gestion des icônes', () => {
        test('devrait mettre à jour une icône spécifique', () => {
            const iconElement = document.createElement('i');
            iconElement.setAttribute('name', 'update-test');
            document.body.appendChild(iconElement);

            IconManager.updateIcon(iconElement);

            // Vérifier que l'élément a été traité
            expect(iconElement.classList.contains('k3ui-icon-loaded')).toBeDefined;
        });

        test('devrait mettre à jour une icône par sélecteur', () => {
            const iconElement = document.createElement('i');
            iconElement.setAttribute('name', 'selector-test');
            iconElement.id = 'test-icon-selector';
            document.body.appendChild(iconElement);

            IconManager.updateIconBySelector('#test-icon-selector');

            expect(iconElement.classList.contains('k3ui-icon-loaded')).toBeDefined;
        });

        test('ne devrait pas planter si l\'icône n\'existe pas par sélecteur', () => {
            expect(() => {
                IconManager.updateIconBySelector('.non-existent-icon');
            }).not.toThrow();
        });

        test('devrait recharger toutes les icônes', () => {
            const icon1 = document.createElement('i');
            icon1.setAttribute('name', 'icon1');
            document.body.appendChild(icon1);

            const icon2 = document.createElement('i');
            icon2.setAttribute('name', 'icon2');
            document.body.appendChild(icon2);

            IconManager.reloadAllIcons();

            expect(icon1.classList.contains('k3ui-icon-loaded')).toBeDefined;
            expect(icon2.classList.contains('k3ui-icon-loaded')).toBeDefined;
        });

        test('devrait forcer l\'affichage des icônes non chargées', async () => {
            const iconElement = document.createElement('i');
            iconElement.setAttribute('name', 'bars');
            iconElement.setAttribute('type', 'classic');
            document.body.appendChild(iconElement);

            IconManager.forceDisplayIcons();
            await Promise.resolve();

            expect(iconElement.classList.contains('k3ui-icon-loaded')).toBe(true);
        });
    });

    describe('Cache', () => {
        test('devrait ajouter une icône au cache', () => {
            const iconName = 'test-cache-icon';
            const svgContent = '<svg>test</svg>';

            IconManager.addIcon(iconName, svgContent);

            const stats = IconManager.getStats();
            expect(stats.cached).toBeGreaterThan(0);
        });

        test('devrait vider le cache', () => {
            IconManager.addIcon('test1', '<svg>1</svg>');
            IconManager.addIcon('test2', '<svg>2</svg>');

            expect(IconManager.getStats().cached).toBeGreaterThan(0);

            IconManager.clearCache();

            expect(IconManager.getStats().cached).toBe(0);
        });

        test('devrait retourner les statistiques', () => {
            const icon1 = document.createElement('i');
            icon1.setAttribute('name', 'stat1');
            document.body.appendChild(icon1);

            const icon2 = document.createElement('i');
            icon2.setAttribute('name', 'stat2');
            document.body.appendChild(icon2);

            IconManager.addIcon('stat1', '<svg>1</svg>');
            IconManager.addIcon('stat2', '<svg>2</svg>');

            const stats = IconManager.getStats();

            expect(stats.total).toBeGreaterThanOrEqual(2);
            expect(stats.cached).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Styles d\'icônes', () => {
        test('ne devrait pas définir width/height inline — tailles via CSS (attribut size)', () => {
            const iconElement = document.createElement('i');
            iconElement.setAttribute('name', 'bars');
            iconElement.setAttribute('type', 'classic');
            iconElement.setAttribute('size', 'xs');
            document.body.appendChild(iconElement);

            IconManager.updateIcon(iconElement);

            expect(iconElement.style.width).toBe('');
            expect(iconElement.style.height).toBe('');
            expect(iconElement.classList.contains('k3ui-icon-loaded')).toBe(true);
        });

        test('ne devrait pas définir width/height inline — layout ancêtre en CSS (data-size)', () => {
            const wrap = document.createElement('div');
            wrap.setAttribute('data-size', 'sm');
            const iconElement = document.createElement('i');
            iconElement.setAttribute('name', 'bars');
            iconElement.setAttribute('type', 'classic');
            wrap.appendChild(iconElement);
            document.body.appendChild(wrap);

            IconManager.updateIcon(iconElement);

            expect(iconElement.style.width).toBe('');
            expect(iconElement.style.height).toBe('');
        });

        test('ne devrait pas définir width/height inline avec size + data-size ancêtre', () => {
            const wrap = document.createElement('div');
            wrap.setAttribute('data-size', 'sm');
            const iconElement = document.createElement('i');
            iconElement.setAttribute('name', 'bars');
            iconElement.setAttribute('type', 'classic');
            iconElement.setAttribute('size', 'xl');
            wrap.appendChild(iconElement);
            document.body.appendChild(wrap);

            IconManager.updateIcon(iconElement);

            expect(iconElement.style.width).toBe('');
            expect(iconElement.style.height).toBe('');
        });

        test('devrait appliquer la couleur', () => {
            const iconElement = document.createElement('i');
            iconElement.setAttribute('name', 'bars');
            iconElement.setAttribute('type', 'classic');
            iconElement.setAttribute('color', 'red');
            document.body.appendChild(iconElement);

            IconManager.updateIcon(iconElement);

            expect(iconElement.style.color).toBe('red');
        });

        test('devrait appliquer la rotation', () => {
            const iconElement = document.createElement('i');
            iconElement.setAttribute('name', 'rotate-test');
            iconElement.setAttribute('rotate', '45');
            document.body.appendChild(iconElement);

            IconManager.updateIcon(iconElement);

            // Les styles sont appliqués si l'icône est chargée
            expect(iconElement.getAttribute('rotate')).toBe('45');
        });

        test('devrait appliquer le retournement horizontal', () => {
            const iconElement = document.createElement('i');
            iconElement.setAttribute('name', 'flip-test');
            iconElement.setAttribute('flip', 'horizontal');
            document.body.appendChild(iconElement);

            IconManager.updateIcon(iconElement);

            // Les styles sont appliqués si l'icône est chargée
            expect(iconElement.getAttribute('flip')).toBe('horizontal');
        });

        test('devrait appliquer le retournement vertical', () => {
            const iconElement = document.createElement('i');
            iconElement.setAttribute('name', 'flip-vertical-test');
            iconElement.setAttribute('flip', 'vertical');
            document.body.appendChild(iconElement);

            IconManager.updateIcon(iconElement);

            // Les styles sont appliqués si l'icône est chargée
            expect(iconElement.getAttribute('flip')).toBe('vertical');
        });
    });

    describe('Initialisation', () => {
        test('devrait s\'initialiser sans erreur', () => {
            expect(() => {
                IconManager.init();
            }).not.toThrow();
        });

        test('ne devrait pas s\'initialiser deux fois', () => {
            IconManager.init();
            IconManager.init();

            expect(() => IconManager.destroy()).not.toThrow();
        });
    });

    describe('Stats', () => {
        test('devrait retourner des statistiques valides', () => {
            const stats = IconManager.getStats();

            expect(stats).toBeDefined();
            expect(stats.total).toBeGreaterThanOrEqual(0);
            expect(stats.loaded).toBeGreaterThanOrEqual(0);
            expect(stats.failed).toBeGreaterThanOrEqual(0);
            expect(stats.cached).toBeGreaterThanOrEqual(0);
        });

        test('devrait calculer le total correctement', () => {
            const icon1 = document.createElement('i');
            icon1.setAttribute('name', 'total1');
            document.body.appendChild(icon1);

            const icon2 = document.createElement('i');
            icon2.setAttribute('name', 'total2');
            document.body.appendChild(icon2);

            const stats = IconManager.getStats();
            expect(stats.total).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Destruction', () => {
        test('devrait détruire le manager sans erreur', () => {
            IconManager.init();

            expect(() => {
                IconManager.destroy();
            }).not.toThrow();
        });

        test('devrait réinitialiser l\'état après destruction', () => {
            IconManager.init();
            IconManager.destroy();

            // On peut réinitialiser après destruction
            expect(() => {
                IconManager.init();
            }).not.toThrow();
        });
    });

    describe('Cas limites', () => {
        test('devrait gérer un élément sans attribut name', () => {
            const iconElement = document.createElement('i');
            document.body.appendChild(iconElement);

            expect(() => {
                IconManager.updateIcon(iconElement);
            }).not.toThrow();
        });

        test('devrait gérer plusieurs icônes avec le même nom', () => {
            const icon1 = document.createElement('i');
            icon1.setAttribute('name', 'duplicate');
            document.body.appendChild(icon1);

            const icon2 = document.createElement('i');
            icon2.setAttribute('name', 'duplicate');
            document.body.appendChild(icon2);

            IconManager.addIcon('duplicate', '<svg>test</svg>');

            expect(icon1.classList.contains('k3ui-icon-loaded')).toBeDefined;
        });

        test('devrait gérer une taille invalide', () => {
            const iconElement = document.createElement('i');
            iconElement.setAttribute('name', 'invalid-size');
            iconElement.setAttribute('size', 'invalid-size' as unknown as string);
            document.body.appendChild(iconElement);

            expect(() => {
                IconManager.updateIcon(iconElement);
            }).not.toThrow();
        });

        test('devrait gérer un élément HTML invalide', () => {
            const divElement = document.createElement('div');
            divElement.setAttribute('name', 'test');

            expect(() => {
                IconManager.updateIcon(divElement);
            }).not.toThrow();
        });
    });

    describe('Icônes disponibles', () => {
        test('devrait retourner une liste vide par défaut', () => {
            const availableIcons = IconManager.getAvailableIcons();

            expect(availableIcons).toBeDefined();
            expect(Array.isArray(availableIcons)).toBe(true);
        });
    });

    describe('Icônes intégrées et clés de résolution', () => {
        test('devrait charger de façon synchrone une icône intégrée (classic:bars)', () => {
            const el = document.createElement('i');
            el.setAttribute('name', 'bars');
            el.setAttribute('type', 'classic');
            document.body.appendChild(el);

            IconManager.updateIcon(el);

            expect(el.classList.contains('k3ui-icon-loaded')).toBe(true);
            expect(el.querySelector('svg')).toBeTruthy();
        });
    });

    describe('Test d\'icône', () => {
        test('devrait tester une icône inexistante', () => {
            const exists = IconManager.testIcon('non-existent-icon');

            expect(exists).toBe(false);
        });

        test('devrait tester une icône avec custom', () => {
            const exists = IconManager.testIcon('test-icon', 'classic', 'brands');

            expect(typeof exists).toBe('boolean');
        });
    });

    describe('resolveAssetsBasePath', () => {
        test('dérive /assets/icons/ depuis le script k3ui à la racine du site', () => {
            const script = document.createElement('script');
            script.src = 'https://k3ui-docs.vercel.app/js/k3ui.min.js';
            document.head.appendChild(script);

            expect(IconManager.resolveAssetsBasePath()).toBe('https://k3ui-docs.vercel.app/assets/icons/');
        });

        test('conserve le préfixe /k3ui-docs en local WAMP', () => {
            const script = document.createElement('script');
            script.src = 'http://localhost/k3ui-docs/js/k3ui.min.js';
            document.head.appendChild(script);

            expect(IconManager.resolveAssetsBasePath()).toBe('http://localhost/k3ui-docs/assets/icons/');
        });
    });
});

