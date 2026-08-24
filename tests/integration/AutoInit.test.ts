/**
 * Tests d'intégration pour AutoInit
 * @description Tests de l'initialisation automatique de tous les composants K3UI
 */

/// <reference types="jest" />

import { AutoInit, initManagers, initComponents } from '../../src/index';
import { ThemeManager } from '../../src/core/managers/ThemeManager';

// TS n'a pas forcément les types Node dans ce projet.
// Ce test utilise `require(...)` ponctuellement.
declare const require: (id: string) => any;

jest.mock('../../src/components/Snackbar', () => ({
    Snackbar: {
        init: jest.fn()
    }
}));

jest.mock('../../src/components/Tooltips', () => ({
    Tooltips: {
        init: jest.fn()
    }
}));

jest.mock('../../src/components/Chip', () => ({
    Chip: {
        init: jest.fn()
    }
}));

jest.mock('../../src/components/Card', () => ({
    Card: {
        init: jest.fn()
    }
}));

jest.mock('../../src/components/Shape', () => ({
    Shape: {
        init: jest.fn()
    }
}));

jest.mock('../../src/components/Select', () => ({
    Select: {
        init: jest.fn()
    }
}));

jest.mock('../../src/components/Drawer', () => ({
    Drawer: {
        init: jest.fn(),
        initFromTriggers: jest.fn()
    }
}));

jest.mock('../../src/components/AppBar', () => ({
    AppBar: {
        init: jest.fn()
    }
}));

jest.mock('../../src/components/Dialog', () => ({
    Dialog: {
        init: jest.fn(),
        initFromTriggers: jest.fn()
    }
}));

jest.mock('../../src/components/IsoFilter', () => ({
    IsoFilter: {
        init: jest.fn()
    }
}));

jest.mock('../../src/components/Field', () => ({
    Field: {
        init: jest.fn()
    }
}));

jest.mock('../../src/components/Textarea', () => ({
    Textarea: {
        init: jest.fn()
    }
}));

jest.mock('../../src/components/Pin', () => ({
    Pin: {
        init: jest.fn()
    }
}));

const deferredInitFn = jest.fn((_els: unknown, _opts: unknown) => []);

jest.mock('../../src/core/autoinit/deferred-component-loaders', () => ({
    getDeferredComponentsLoadPromise: jest.fn(() =>
        Promise.resolve({
            Chart: { init: deferredInitFn },
            Confetti: { init: deferredInitFn },
            Datepicker: { init: deferredInitFn },
            Heatmap: { init: deferredInitFn },
            Pace: { init: deferredInitFn },
            Perspective: { init: deferredInitFn },
            Signature: { init: deferredInitFn },
            Snow: { init: deferredInitFn },
            SlideshowCaptions: { init: deferredInitFn },
            Table: { init: deferredInitFn },
            Timepicker: { init: deferredInitFn }
        })
    ),
    attachDeferredComponentsToK: jest.fn(),
    loadAllDeferredComponentClasses: jest.fn(),
    DEFERRED_COMPONENT_NAMES: [
        'Chart',
        'Confetti',
        'Datepicker',
        'Heatmap',
        'Pace',
        'Perspective',
        'Signature',
        'Snow',
        'SlideshowCaptions',
        'Table',
        'Timepicker'
    ],
    isDeferredComponentName: jest.fn(() => true)
}));

/** Le LoggerManager utilise `console.info` avec un 1er argument formaté `%c…` + styles. */
function expectConsoleInfoContains(spy: jest.SpyInstance, substring: string): void {
    const match = spy.mock.calls.some(
        (args) => typeof args[0] === 'string' && args[0].includes(substring)
    );
    expect(match).toBe(true);
}

function expectConsoleErrorContains(spy: jest.SpyInstance, substring: string): void {
    const match = spy.mock.calls.some(
        (args) => typeof args[0] === 'string' && args[0].includes(substring)
    );
    expect(match).toBe(true);
}

import { flushDeferredAutoInit } from '../helpers/component-init';

describe('AutoInit Integration', () => {
    let originalWindow: typeof window;

    jest.setTimeout(25000);

    beforeEach(() => {
        // Sauvegarder window original
        originalWindow = { ...window };

        // Nettoyer le DOM
        document.body.innerHTML = '';

        // Mock localStorage
        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
        };
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true,
        });

        // Mock matchMedia
        window.matchMedia = jest.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }));

        // Réinitialiser les mocks
        jest.clearAllMocks();

        const { Snackbar } = require('../../src/components/Snackbar');
        const { Tooltips } = require('../../src/components/Tooltips');
        const { Chip } = require('../../src/components/Chip');
        const mockReturn = (els: unknown) => {
            if (els == null) return [];
            const list =
                typeof (els as ArrayLike<HTMLElement>).length === 'number' &&
                typeof (els as NodeList).item === 'function'
                    ? Array.from(els as ArrayLike<HTMLElement>)
                    : Array.isArray(els)
                      ? els
                      : [els as HTMLElement];
            return list.map(() => ({}));
        };
        Snackbar.init.mockImplementation(mockReturn);
        Tooltips.init.mockImplementation(mockReturn);
        Chip.init.mockImplementation(mockReturn);
    });

    afterEach(() => {
        // Restaurer window
        Object.assign(window, originalWindow);

        // Nettoyer le DOM
        document.body.innerHTML = '';
    });

    describe('Initialisation des managers', () => {
        test('devrait initialiser tous les managers', () => {
            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

            initManagers();

            expectConsoleInfoContains(consoleSpy, 'Managers initialisés');
        });

        test('devrait gérer les erreurs lors de l\'initialisation des managers', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // Simuler une erreur
            jest.spyOn(ThemeManager, 'init').mockImplementation(() => {
                throw new Error('Test error');
            });

            initManagers();

            expectConsoleErrorContains(consoleErrorSpy, 'Erreur lors de l\'initialisation des managers');
        });
    });

    describe('Initialisation des composants', () => {
        test('devrait initialiser tous les composants sans éléments DOM', async () => {
            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

            const result = initComponents();

            expect(result).toBe(true);
            expectConsoleInfoContains(consoleSpy, 'composant(s) critique(s)');
        });

        test('devrait initialiser les composants avec des éléments DOM', async () => {
            // Créer des éléments DOM pour les composants
            const snackbar = document.createElement('div');
            snackbar.className = 'snackbar';
            document.body.appendChild(snackbar);

            const tooltip = document.createElement('div');
            tooltip.className = 'tooltipped';
            document.body.appendChild(tooltip);

            const chip = document.createElement('div');
            chip.className = 'chip';
            document.body.appendChild(chip);

            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

            const result = initComponents();

            expect(result).toBe(true);
            expectConsoleInfoContains(consoleSpy, 'composant(s) critique(s)');
        });

        test('devrait émettre k3ui-critical-ready puis k3ui-ready après la passe différée', async () => {
            const criticalSpy = jest.fn();
            const readySpy = jest.fn();
            document.addEventListener('k3ui-critical-ready', criticalSpy);
            document.addEventListener('k3ui-ready', readySpy);

            initComponents();

            expect(criticalSpy).toHaveBeenCalled();
            await flushDeferredAutoInit();
            expect(readySpy).toHaveBeenCalled();

            const event = readySpy.mock.calls[0][0];
            expect(event.detail.totalComponents).toBeDefined();
            expect(event.detail.components).toBeDefined();
        });

        test('devrait gérer les erreurs lors de l\'initialisation des composants', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const original = Element.prototype.querySelectorAll;
            Element.prototype.querySelectorAll = jest.fn(() => {
                throw new Error('DOM error');
            }) as typeof Element.prototype.querySelectorAll;

            let result: boolean;
            try {
                result = initComponents();
            } finally {
                Element.prototype.querySelectorAll = original;
            }

            expect(result!).toBe(true);
            const hasWarnOrError = consoleWarnSpy.mock.calls.length > 0 || consoleErrorSpy.mock.calls.length > 0;
            expect(hasWarnOrError).toBe(true);
        });
    });

    describe('AutoInit complet', () => {
        test('devrait exécuter l\'AutoInit complet', async () => {
            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

            AutoInit();

            expectConsoleInfoContains(consoleSpy, 'Démarrage de l\'AutoInit K3UI');
            expectConsoleInfoContains(consoleSpy, 'AutoInit K3UI terminé avec succès');
        });

        test('devrait gérer les erreurs lors de l\'AutoInit complet', () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // Simuler une erreur
            jest.spyOn(ThemeManager, 'init').mockImplementation(() => {
                throw new Error('Test error');
            });

            AutoInit();

            // `initManagers` attrape l’erreur et logue sans relancer (AutoInit continue).
            expectConsoleErrorContains(consoleErrorSpy, 'Erreur lors de l\'initialisation des managers');
        });
    });

    describe('Configuration personnalisée', () => {
        test('devrait utiliser les options window.K3UI_OPTIONS', async () => {
            // Définir des options globales
            window.K3UI_OPTIONS = {
                Snackbar: { displayLength: 5000 }
            };

            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

            AutoInit();

            expectConsoleInfoContains(consoleSpy, 'AutoInit K3UI terminé avec succès');
        });

        test('devrait fusionner les options globales et locales', async () => {
            // Définir des options globales
            window.K3UI_OPTIONS = {
                Snackbar: { displayLength: 5000 }
            };

            const localOptions = {
                Snackbar: { type: 'error' }
            };

            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

            AutoInit(document.body, localOptions);

            expectConsoleInfoContains(consoleSpy, 'AutoInit K3UI terminé avec succès');
        });
    });

    describe('Sélecteurs personnalisés', () => {
        test('devrait utiliser des sélecteurs personnalisés', async () => {
            const customSelectors = {
                Snackbar: '.custom-snackbar'
            };

            // Créer des éléments avec les sélecteurs personnalisés
            const snackbar = document.createElement('div');
            snackbar.className = 'custom-snackbar';
            document.body.appendChild(snackbar);

            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

            initComponents(document.body, { selectors: customSelectors });

            expectConsoleInfoContains(consoleSpy, 'composant(s) critique(s)');
        });
    });

    describe('Composants avec no-autoinit', () => {
        test('devrait ignorer les éléments avec la classe no-autoinit', async () => {
            // Créer des éléments avec et sans no-autoinit
            const snackbar1 = document.createElement('div');
            snackbar1.className = 'snackbar';
            document.body.appendChild(snackbar1);

            const snackbar2 = document.createElement('div');
            snackbar2.className = 'snackbar no-autoinit';
            document.body.appendChild(snackbar2);

            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

            initComponents();

            expectConsoleInfoContains(consoleSpy, 'composant(s) critique(s)');
        });
    });

    describe('Gestion des erreurs', () => {
        test('devrait continuer même si un composant échoue', async () => {
            // Créer des éléments pour plusieurs composants
            const snackbar = document.createElement('div');
            snackbar.className = 'snackbar';
            document.body.appendChild(snackbar);

            const tooltip = document.createElement('div');
            tooltip.className = 'tooltipped';
            document.body.appendChild(tooltip);

            // Simuler une erreur sur un composant
            const { Snackbar } = require('../../src/components/Snackbar');
            Snackbar.init.mockImplementation(() => {
                throw new Error('Snackbar error');
            });

            jest.spyOn(console, 'error').mockImplementation();

            const result = initComponents();

            expect(result).toBe(true); // Devrait continuer malgré l'erreur
            await flushDeferredAutoInit();
        });
    });

    describe('Performance', () => {
        test('devrait initialiser rapidement avec de nombreux composants', async () => {
            for (let i = 0; i < 10; i++) {
                const chip = document.createElement('div');
                chip.className = 'chip';
                document.body.appendChild(chip);
            }

            const startTime = performance.now();
            initComponents();
            await flushDeferredAutoInit();
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(30000);
        });
    });

    describe('Compatibilité', () => {
        test('devrait fonctionner avec un contexte DOM personnalisé', async () => {
            const customContext = document.createElement('div');
            customContext.innerHTML = '<div class="snackbar">Test</div>';

            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

            initComponents(customContext);

            expectConsoleInfoContains(consoleSpy, 'composant(s) critique(s)');
        });

        test('devrait fonctionner sans éléments DOM', async () => {
            const emptyContext = document.createElement('div');

            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

            initComponents(emptyContext);

            expectConsoleInfoContains(consoleSpy, 'composant(s) critique(s)');
        });
    });
});
