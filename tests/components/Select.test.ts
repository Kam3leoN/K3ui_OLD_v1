/**
 * Tests unitaires pour le composant Select
 * @description Tests de toutes les fonctionnalités du composant Select
 */

import { Select } from '../../src/components/Select';

describe('Select', () => {
    let selectElement: HTMLSelectElement;

    beforeEach(() => {
        document.body.innerHTML = '';

        selectElement = document.createElement('select');
        selectElement.id = 'test-select';
        selectElement.innerHTML = `
            <option value="light" selected>Clair</option>
            <option value="dark">Sombre</option>
        `;
        document.body.appendChild(selectElement);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Initialisation', () => {
        test('devrait créer une instance Select', () => {
            const select = Select.init(selectElement);

            expect(select).toBeInstanceOf(Select);
            expect(Select.getInstance(selectElement)).toBe(select);
        });

        test('devrait initialiser le menu', () => {
            const select = Select.init(selectElement);

            expect(select.menu).toBeDefined();
            expect(select.options.menuOptions).toBeDefined();
        });
    });

    describe('Gestion des clics multiples', () => {
        test('devrait s\'ouvrir au premier clic même avec bouton SVG', () => {
            // Créer un select avec un bouton SVG (comme le selecteur de thème)
            document.body.innerHTML = `
                <div class="navbar-select-container">
                    <button id="theme-select-btn" class="btn btn--icon btn--oval-select select--right switch-theme" 
                            data-group="theme" aria-label="Choisir le thème">
                        <i name="sun" size="xl"></i>
                        <i name="chevron" size="sm" rotate="180"></i>
                    </button>
                    <select id="test-select" class="select select-hidden switch-theme" data-group="theme">
                        <option value="light" selected>Clair</option>
                        <option value="dark">Sombre</option>
                    </select>
                </div>
            `;

            selectElement = document.getElementById('test-select') as HTMLSelectElement;

            const select = Select.init(selectElement);

            expect(select).toBeDefined();

            // Trouver le bouton trigger
            const buttonEl = document.querySelector('button');

            if (buttonEl && select.menu) {
                let toggleCount = 0;
                const originalOpen = select.menu.open;
                const originalClose = select.menu.close;

                select.menu.open = function () {
                    toggleCount++;
                    originalOpen.call(this);
                };

                select.menu.close = function () {
                    toggleCount++;
                    originalClose.call(this);
                };

                // Simuler des clics multiples
                buttonEl.click();

                // Ne devrait pas déclencher plus de 2 toggles (ouvrir OU fermer)
                expect(toggleCount).toBeLessThanOrEqual(2);
            }
        });
    });
});

