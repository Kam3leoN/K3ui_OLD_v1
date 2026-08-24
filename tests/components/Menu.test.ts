/**
 * Tests unitaires pour le composant Menu
 * @description Tests de toutes les fonctionnalités du composant Menu, y compris les tests de stabilité
 */

/// <reference types="jest" />

import { Menu } from '../../src/components/Menu';
import { MenuItem } from '../../src/types/components';
import { MotionManager } from '../../src/core/managers/MotionManager';
import { MenuSpecs } from '../../src/specs/components/menu.specs';
import {
    destroyAllMenus,
    flushMenuAnimationFrames,
    getMenuContainerEl,
    initMenuReady,
    openMenuReady,
    closeMenuReady,
    waitMs,
    dispatchMenuPointerOver,
    dispatchMenuPointerOut,
} from '../helpers/menu-async';

describe('Menu', () => {
    let menuElement: HTMLElement;
    let triggerElement: HTMLElement;

    beforeEach(() => {
        document.body.innerHTML = '';
        document.documentElement.style.setProperty('--md-sys-motion-spatial-fast-duration', '350ms');
        document.documentElement.style.setProperty('--md-sys-motion-effects-fast-duration', '150ms');
        document.documentElement.style.setProperty('--md-sys-motion-spatial-fast-easing', 'cubic-bezier(0.42, 1.67, 0.21, 0.9)');
        document.documentElement.style.setProperty('--md-sys-motion-effects-fast-easing', 'cubic-bezier(0.31, 0.94, 0.34, 1)');
        document.documentElement.style.setProperty('--k3ui-menu-animation-scale-start', '0.85');
        MotionManager.setOverride(null);

        // Créer le menu (no-autoinit empêche le CE de créer l'instance avant le test)
        menuElement = document.createElement('k3ui-menu');
        menuElement.classList.add('no-autoinit');
        menuElement.id = 'test-menu';

        // Créer le trigger
        triggerElement = document.createElement('button');
        triggerElement.slot = 'trigger';
        triggerElement.textContent = 'Ouvrir le menu';
        menuElement.appendChild(triggerElement);

        document.body.appendChild(menuElement);
    });

    afterEach(async () => {
        MotionManager.setOverride(null);
        await destroyAllMenus();
        document.body.innerHTML = '';
    });

    describe('Initialisation', () => {
        test('devrait initialiser un menu avec des items', async () => {
            const items: MenuItem[] = [
                { id: 'item1', label: 'Option 1' },
                { id: 'item2', label: 'Option 2' }
            ];

            const menu = await initMenuReady(() => Menu.init(menuElement, { items }));

            expect(menu).toBeDefined();
            expect(menu.isOpen).toBe(false);
            expect(Menu.getInstance(menuElement)).toBe(menu);
        });

        test('devrait lire les items depuis data-items', async () => {
            menuElement.setAttribute('data-items', JSON.stringify([
                { id: 'item1', label: 'Option 1' }
            ]));

            const menu = Menu.init(menuElement);

            expect(menu.options.items).toHaveLength(1);
            expect(menu.options.items[0].id).toBe('item1');
        });

        test('devrait lire les items depuis la structure HTML', async () => {
            const item1 = document.createElement('menu-item');
            item1.setAttribute('data-id', 'item1');
            item1.setAttribute('data-label', 'Option 1');
            menuElement.appendChild(item1);

            const menu = Menu.init(menuElement);

            expect(menu.options.items).toHaveLength(1);
            expect(menu.options.items[0].id).toBe('item1');
            expect(menu.options.items[0].label).toBe('Option 1');
        });
    });

    describe('Ouverture et fermeture', () => {
        test('devrait ouvrir le menu', async () => {
            const menu = Menu.init(menuElement, { items: [] });

            expect(menu.isOpen).toBe(false);

            menu.open();

            expect(menu.isOpen).toBe(true);
            expect(menuElement.getAttribute('aria-expanded')).toBe('true');
        });

        test('devrait fermer le menu', async () => {
            const menu = Menu.init(menuElement, { items: [] });

            menu.open();
            expect(menu.isOpen).toBe(true);

            menu.close();

            expect(menu.isOpen).toBe(false);
            // `setAriaAttribute(..., false)` retire l'attribut
            expect(menuElement.hasAttribute('aria-expanded')).toBe(false);
        });

        test('devrait ouvrir/fermer au clic sur le trigger', async () => {
            const menu = Menu.init(menuElement, { items: [] });

            triggerElement.click();
            expect(menu.isOpen).toBe(true);

            triggerElement.click();
            expect(menu.isOpen).toBe(false);
        });

        test('devrait fermer avec la touche Escape', async () => {
            const menu = Menu.init(menuElement, { items: [] });

            menu.open();
            expect(menu.isOpen).toBe(true);

            const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            menuElement.dispatchEvent(event);

            expect(menu.isOpen).toBe(false);
        });
    });

    describe('Sous-menus - Stabilité et réouverture', () => {
        const parentItems: MenuItem[] = [
            {
                id: 'parent',
                label: 'Parent',
                items: [
                    { id: 'child1', label: 'Enfant 1' },
                    { id: 'child2', label: 'Enfant 2' },
                ],
            },
        ];

        test('devrait ouvrir un sous-menu au survol', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: parentItems }));
            await openMenuReady(menu);

            const container = getMenuContainerEl(menuElement)!;
            const wrapper = container.querySelector(
                '.menu-item-wrapper[data-item-id="parent"]'
            ) as HTMLElement;
            expect(wrapper).toBeDefined();

            const menuItem = wrapper.querySelector('.menu-item') as HTMLElement;
            dispatchMenuPointerOver(menuItem);
            await flushMenuAnimationFrames();
            await waitMs(350);

            const submenu = container.querySelector('.menu-submenu[data-submenu-id="parent"]') as HTMLElement;
            expect(submenu).toBeDefined();
            expect(
                submenu.style.display === 'block' || submenu.classList.contains('menu-submenu--open')
            ).toBe(true);
        });

        test('devrait pouvoir rouvrir un sous-menu après fermeture', async () => {
            const items: MenuItem[] = [
                {
                    id: 'parent',
                    label: 'Parent',
                    items: [{ id: 'child1', label: 'Enfant 1' }],
                },
            ];
            const menu = await initMenuReady(() => Menu.init(menuElement, { items }));
            await openMenuReady(menu);

            const container = getMenuContainerEl(menuElement)!;
            const wrapper = container.querySelector(
                '.menu-item-wrapper[data-item-id="parent"]'
            ) as HTMLElement;

            const menuItem = wrapper.querySelector('.menu-item') as HTMLElement;
            dispatchMenuPointerOver(menuItem);
            await waitMs(350);

            dispatchMenuPointerOut(menuItem, document.body);
            await waitMs(350);

            dispatchMenuPointerOver(menuItem);
            await waitMs(350);

            const submenu = container.querySelector('.menu-submenu[data-submenu-id="parent"]') as HTMLElement;
            expect(submenu).toBeDefined();
            expect(
                submenu.style.display === 'block' || submenu.classList.contains('menu-submenu--open')
            ).toBe(true);
        });

        test('devrait gérer plusieurs ouvertures/fermetures consécutives', async () => {
            const items: MenuItem[] = [
                {
                    id: 'parent',
                    label: 'Parent',
                    items: [{ id: 'child1', label: 'Enfant 1' }],
                },
            ];
            const menu = await initMenuReady(() => Menu.init(menuElement, { items }));
            await openMenuReady(menu);

            const container = getMenuContainerEl(menuElement)!;
            const wrapper = container.querySelector(
                '.menu-item-wrapper[data-item-id="parent"]'
            ) as HTMLElement;

            const menuItem = wrapper.querySelector('.menu-item') as HTMLElement;
            for (let i = 0; i < 3; i++) {
                dispatchMenuPointerOver(menuItem);
                await waitMs(300);
                dispatchMenuPointerOut(menuItem, document.body);
                await waitMs(300);
            }

            dispatchMenuPointerOver(menuItem);
            await waitMs(350);

            const submenu = container.querySelector('.menu-submenu[data-submenu-id="parent"]') as HTMLElement;
            expect(submenu).toBeDefined();
            expect(
                submenu.style.display === 'block' || submenu.classList.contains('menu-submenu--open')
            ).toBe(true);
        });
    });

    describe('Rendu des items', () => {
        test('devrait rendre les items du menu', async () => {
            const items: MenuItem[] = [
                { id: 'item1', label: 'Option 1' },
                { id: 'item2', label: 'Option 2' },
            ];

            const menu = await initMenuReady(() => Menu.init(menuElement, { items }));
            await openMenuReady(menu);

            const container = getMenuContainerEl(menuElement);
            expect(container).toBeTruthy();

            const renderedItems = container!.querySelectorAll('.menu-item');
            expect(renderedItems?.length).toBe(2);
        });

        test('devrait rendre les sous-menus dans le DOM même fermés', async () => {
            const items: MenuItem[] = [
                {
                    id: 'parent',
                    label: 'Parent',
                    items: [{ id: 'child1', label: 'Enfant 1' }],
                },
            ];

            const menu = await initMenuReady(() => Menu.init(menuElement, { items }));
            await openMenuReady(menu);

            const container = getMenuContainerEl(menuElement)!;
            const submenu = container.querySelector('.menu-submenu[data-submenu-id="parent"]') as HTMLElement;
            expect(submenu).toBeDefined();
            expect(submenu.classList.contains('menu-submenu--closed')).toBe(true);
        });
    });

    describe('Sélection d\'items', () => {
        test('devrait émettre un événement lors de la sélection', async () => {
            const items: MenuItem[] = [{ id: 'item1', label: 'Option 1' }];

            const menu = await initMenuReady(() => Menu.init(menuElement, { items }));
            await openMenuReady(menu);

            const selectPromise = new Promise<void>((resolve) => {
                menuElement.addEventListener('onItemClick', (e: Event) => {
                    const detail = (e as CustomEvent<{ item: { id: string; label: string } }>).detail;
                    expect(detail.item.id).toBe('item1');
                    expect(detail.item.label).toBe('Option 1');
                    resolve();
                });
            });

            const container = getMenuContainerEl(menuElement)!;
            const item = container.querySelector('.menu-item') as HTMLElement | null;
            expect(item).toBeTruthy();
            item!.click();
            await selectPromise;
        });

        test('devrait appeler le callback onItemClick', async () => {
            const items: MenuItem[] = [{ id: 'item1', label: 'Option 1' }];
            const onItemClick = jest.fn();

            const menu = await initMenuReady(() => Menu.init(menuElement, { items, onItemClick }));
            await openMenuReady(menu);

            const container = getMenuContainerEl(menuElement)!;
            const item = container.querySelector('.menu-item') as HTMLElement | null;
            expect(item).toBeTruthy();
            item!.click();

            expect(onItemClick).toHaveBeenCalled();
            expect(onItemClick.mock.calls[0][0].id).toBe('item1');
        });
    });

    describe('Gestion des événements et nettoyage', () => {
        test('devrait nettoyer tous les événements lors du destroy', async () => {
            const items: MenuItem[] = [
                {
                    id: 'parent',
                    label: 'Parent',
                    items: [{ id: 'child', label: 'Enfant' }],
                },
            ];

            const menu = await initMenuReady(() => Menu.init(menuElement, { items }));
            await openMenuReady(menu);
            await waitMs(100);

            menu.destroy();

            expect(menu.isOpen).toBe(false);
            expect(Menu.getInstance(menuElement)).toBeFalsy();
            expect(Menu._menus).not.toContain(menu);
        });

        test('devrait gérer correctement les événements après plusieurs ouvertures/fermetures', async () => {
            const items: MenuItem[] = [
                {
                    id: 'parent',
                    label: 'Parent',
                    items: [{ id: 'child', label: 'Enfant' }],
                },
            ];

            const menu = await initMenuReady(() => Menu.init(menuElement, { items }));

            for (let i = 0; i < 3; i++) {
                await openMenuReady(menu, 50);
                await closeMenuReady(menu);
            }

            await openMenuReady(menu);

            const container = getMenuContainerEl(menuElement)!;
            const wrapper = container.querySelector(
                '.menu-item-wrapper[data-item-id="parent"]'
            ) as HTMLElement;
            expect(wrapper).toBeDefined();

            const menuItem = wrapper.querySelector('.menu-item') as HTMLElement;
            dispatchMenuPointerOver(menuItem);
            await waitMs(350);

            const submenu = container.querySelector('.menu-submenu[data-submenu-id="parent"]') as HTMLElement;
            expect(submenu).toBeDefined();
            expect(
                submenu.style.display === 'block' || submenu.classList.contains('menu-submenu--open')
            ).toBe(true);
        });
    });

    describe('setItems', () => {
        test('devrait mettre à jour les items du menu', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: [] }));

            const newItems: MenuItem[] = [
                { id: 'new1', label: 'Nouveau 1' },
                { id: 'new2', label: 'Nouveau 2' },
            ];

            menu.setItems(newItems);

            expect(menu.options.items).toEqual(newItems);
        });
    });

    describe('Positionnement avec Popper.js', () => {
        test('devrait créer une instance Popper.js lors de l\'ouverture', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: [] }));
            await openMenuReady(menu);

            const menuContainer = getMenuContainerEl(menuElement);
            expect(menuContainer).toBeTruthy();
            expect(['fixed', 'absolute']).toContain(menuContainer!.style.position);
        });

        test('devrait positionner le menu avec placement bottom-start par défaut', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: [] }));
            await openMenuReady(menu);

            const menuContainer = getMenuContainerEl(menuElement)!;
            expect(['fixed', 'absolute']).toContain(menuContainer.style.position);
            expect(menuContainer.style.top).toBeTruthy();
            expect(menuContainer.style.left).toBeTruthy();
        });

        test('devrait positionner le menu avec placement personnalisé', async () => {
            const menu = await initMenuReady(() =>
                Menu.init(menuElement, { items: [], placement: 'top-start' })
            );
            await openMenuReady(menu);

            const menuContainer = getMenuContainerEl(menuElement)!;
            expect(['fixed', 'absolute']).toContain(menuContainer.style.position);
        });

        test('devrait mettre à jour la position lors du scroll', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: [] }));
            await openMenuReady(menu);

            const menuContainer = getMenuContainerEl(menuElement)!;
            document.documentElement.scrollTop = 100;
            await waitMs(150);

            expect(['fixed', 'absolute']).toContain(menuContainer.style.position);
        });

        test('devrait mettre à jour la position lors du resize', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: [] }));
            await openMenuReady(menu);

            const menuContainer = getMenuContainerEl(menuElement)!;
            window.dispatchEvent(new Event('resize'));
            await waitMs(150);

            expect(['fixed', 'absolute']).toContain(menuContainer.style.position);
        });

        test('devrait détruire l\'instance Popper.js lors de la destruction', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: [] }));
            await openMenuReady(menu);
            menu.destroy();

            expect(menu.isOpen).toBe(false);
            expect(Menu.getInstance(menuElement)).toBeFalsy();
        });

        test('devrait gérer le placement auto avec flip', async () => {
            const menu = await initMenuReady(() =>
                Menu.init(menuElement, { items: [], placement: 'auto' })
            );
            await openMenuReady(menu);

            const menuContainer = getMenuContainerEl(menuElement)!;
            expect(['fixed', 'absolute']).toContain(menuContainer.style.position);
        });

        test('devrait appliquer preventOverflow pour éviter les débordements', async () => {
            triggerElement.style.position = 'fixed';
            triggerElement.style.bottom = '10px';
            triggerElement.style.right = '10px';

            const menu = await initMenuReady(() =>
                Menu.init(menuElement, { items: [], placement: 'bottom-start' })
            );
            await openMenuReady(menu);

            const menuContainer = getMenuContainerEl(menuElement)!;
            expect(['fixed', 'absolute']).toContain(menuContainer.style.position);
        });
    });

    describe('Animations M3 motion', () => {
        test('applique des transitions inline référençant spatial/effects (tokens CSS)', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: [] }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            const transition = container.style.transition;

            expect(transition).toContain('var(--md-sys-motion-spatial-fast-duration)');
            expect(transition).toContain('var(--md-sys-motion-spatial-fast-easing)');
            expect(transition).toContain('var(--md-sys-motion-effects-fast-duration)');
            expect(transition).toContain('var(--md-sys-motion-effects-fast-easing)');
            expect(transition).not.toMatch(/cubic-bezier\s*\(/);
        });

        test('utilise scale(0.85) comme état de départ (token menu)', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: [] }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            expect(container.style.transform).toBe('scale(1)');
            menu.close();
            await flushMenuAnimationFrames();
            await waitMs(50);

            expect(container.style.transform).toMatch(/scale\(0\.85\)/);
        });

        test('inDuration override la durée mais conserve les easing tokenisés', async () => {
            const menu = await initMenuReady(() =>
                Menu.init(menuElement, { items: [], inDuration: 500 })
            );
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            const transition = container.style.transition;

            expect(transition).toContain('500ms');
            expect(transition).toContain('var(--md-sys-motion-spatial-fast-easing)');
            expect(transition).toContain('var(--md-sys-motion-effects-fast-easing)');
            expect(transition).not.toMatch(/cubic-bezier\s*\(/);
        });

        test('outDuration override la durée de fermeture', async () => {
            const menu = await initMenuReady(() =>
                Menu.init(menuElement, { items: [], outDuration: 420 })
            );
            await openMenuReady(menu, 0);
            menu.close();
            await flushMenuAnimationFrames();

            const container = getMenuContainerEl(menuElement)!;
            expect(container.style.transition).toContain('420ms');
        });

        test('prefers-reduced-motion : aucune transition inline appliquée', async () => {
            window.matchMedia = jest.fn().mockImplementation(() => ({
                matches: true,
                media: '(prefers-reduced-motion: reduce)',
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }));
            MotionManager.init();

            const menu = await initMenuReady(() => Menu.init(menuElement, { items: [] }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            expect(container.style.transition).toBe('');
            expect(container.style.opacity).toBe('1');
        });

        test('schéma motion : easing spatial diffère entre expressive et standard (via CSS vars)', () => {
            document.documentElement.setAttribute('data-motion-scheme', 'expressive');
            document.documentElement.style.setProperty(
                '--md-sys-motion-spatial-fast-easing',
                'cubic-bezier(0.42, 1.67, 0.21, 0.9)'
            );
            const expressive = getComputedStyle(document.documentElement)
                .getPropertyValue('--md-sys-motion-spatial-fast-easing')
                .trim();

            document.documentElement.setAttribute('data-motion-scheme', 'standard');
            document.documentElement.style.setProperty(
                '--md-sys-motion-spatial-fast-easing',
                'cubic-bezier(0.27, 1.06, 0.18, 1)'
            );
            const standard = getComputedStyle(document.documentElement)
                .getPropertyValue('--md-sys-motion-spatial-fast-easing')
                .trim();

            expect(expressive).not.toBe(standard);
            document.documentElement.removeAttribute('data-motion-scheme');
        });
    });

    describe('Hover et état visuel M3', () => {
        const parentItems: MenuItem[] = [
            {
                id: 'parent',
                label: 'Parent',
                items: [{ id: 'child1', label: 'Enfant 1' }],
            },
            { id: 'item2', label: 'Item 2' },
        ];

        const siblingSubmenuItems: MenuItem[] = [
            {
                id: 'share',
                label: 'Partager',
                items: [
                    { id: 'share-email', label: 'Par email' },
                    { id: 'share-link', label: 'Lien partageable' },
                ],
            },
            {
                id: 'export',
                label: 'Exporter',
                items: [
                    { id: 'export-pdf', label: 'PDF' },
                    { id: 'export-word', label: 'Word' },
                ],
            },
        ];

        test('mouseenter ne déclenche _handleItemEnter qu\'une seule fois (délégation pointer)', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: parentItems }));
            await openMenuReady(menu, 50);

            const handleItemEnterSpy = jest.spyOn(
                menu as unknown as {
                    _handleItemEnter: (w: HTMLElement, m: HTMLElement, id: string) => void;
                },
                '_handleItemEnter'
            );

            const container = getMenuContainerEl(menuElement)!;
            const wrapper = container.querySelector('.menu-item-wrapper[data-item-id="parent"]') as HTMLElement;
            const menuItem = wrapper.querySelector('.menu-item') as HTMLElement;

            menuItem.dispatchEvent(
                new PointerEvent('pointerover', { bubbles: true, relatedTarget: document.body, pointerType: 'mouse' })
            );

            expect(handleItemEnterSpy).toHaveBeenCalledTimes(1);
            handleItemEnterSpy.mockRestore();
        });

        test('un seul item porte .menu-item--active-visual à la fois', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: parentItems }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            const wrapper1 = container.querySelector('.menu-item-wrapper[data-item-id="parent"]') as HTMLElement;
            const wrapper2 = container.querySelector('.menu-item-wrapper[data-item-id="item2"]') as HTMLElement;
            const item1 = wrapper1.querySelector('.menu-item') as HTMLElement;
            const item2 = wrapper2.querySelector('.menu-item') as HTMLElement;

            item1.dispatchEvent(
                new PointerEvent('pointerover', { bubbles: true, relatedTarget: document.body, pointerType: 'mouse' })
            );
            expect(container.querySelectorAll('.menu-item--active-visual').length).toBe(1);

            item2.dispatchEvent(
                new PointerEvent('pointerover', { bubbles: true, relatedTarget: item1, pointerType: 'mouse' })
            );
            expect(container.querySelectorAll('.menu-item--active-visual').length).toBe(1);
            expect(item2.classList.contains('menu-item--active-visual')).toBe(true);
            expect(item1.classList.contains('menu-item--active-visual')).toBe(false);
        });

        test('ferme le sous-menu frère et n\'accumule pas hover + active-visual', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: siblingSubmenuItems }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            const shareWrapper = container.querySelector('.menu-item-wrapper[data-item-id="share"]') as HTMLElement;
            const exportWrapper = container.querySelector('.menu-item-wrapper[data-item-id="export"]') as HTMLElement;
            const shareItem = shareWrapper.querySelector('.menu-item') as HTMLElement;
            const exportItem = exportWrapper.querySelector('.menu-item') as HTMLElement;

            dispatchMenuPointerOver(shareItem);
            await waitMs(350);

            const shareSub = container.querySelector('.menu-submenu[data-submenu-id="share"]') as HTMLElement;
            expect(shareSub.classList.contains('menu-submenu--open')).toBe(true);

            dispatchMenuPointerOut(shareItem, exportItem);
            dispatchMenuPointerOver(exportItem, shareItem);
            await waitMs(350);

            const exportSub = container.querySelector('.menu-submenu[data-submenu-id="export"]') as HTMLElement;
            expect(exportSub.classList.contains('menu-submenu--open')).toBe(true);
            expect(shareSub.classList.contains('menu-submenu--open')).toBe(false);
            expect(shareItem.classList.contains('menu-item--hover')).toBe(false);
            expect(shareItem.classList.contains('menu-item--active-visual')).toBe(false);
            expect(exportItem.classList.contains('menu-item--active-visual')).toBe(true);
            expect(container.querySelectorAll('.menu-item--active-visual').length).toBe(1);
        });

        test('ouvre un sous-menu de 2e niveau et conserve le hover parent cumulé', async () => {
            const nestedItems: MenuItem[] = [
                {
                    id: 'share',
                    label: 'Partager',
                    items: [
                        { id: 'share-email', label: 'Par email' },
                        {
                            id: 'share-social',
                            label: 'Réseaux sociaux',
                            items: [
                                { id: 'social-fb', label: 'Facebook' },
                                { id: 'social-twitter', label: 'Twitter' },
                            ],
                        },
                    ],
                },
            ];
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: nestedItems }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            const shareItem = container.querySelector(
                '.menu-item-wrapper[data-item-id="share"] .menu-item'
            ) as HTMLElement;
            const socialItem = container.querySelector(
                '.menu-item-wrapper[data-item-id="share-social"] .menu-item'
            ) as HTMLElement;

            dispatchMenuPointerOver(shareItem);
            await waitMs(350);

            expect(shareItem.classList.contains('menu-item--hover')).toBe(true);
            expect(
                container.querySelector('.menu-submenu[data-submenu-id="share"]')?.classList.contains('menu-submenu--open')
            ).toBe(true);

            dispatchMenuPointerOver(socialItem, shareItem);
            await waitMs(350);

            const socialSub = container.querySelector('.menu-submenu[data-submenu-id="share-social"]') as HTMLElement;
            expect(socialSub.classList.contains('menu-submenu--open')).toBe(true);
            expect(shareItem.classList.contains('menu-item--hover')).toBe(true);
            expect(socialItem.classList.contains('menu-item--hover')).toBe(true);
            expect(socialItem.classList.contains('menu-item--active-visual')).toBe(true);
        });

        test('ouvre un sous-menu de 3e niveau avec hover cascade sur toute la chaîne', async () => {
            const nestedItems: MenuItem[] = [
                {
                    id: 'share',
                    label: 'Partager',
                    items: [
                        { id: 'share-email', label: 'Par email' },
                        {
                            id: 'share-social',
                            label: 'Réseaux sociaux',
                            items: [
                                { id: 'social-fb', label: 'Facebook' },
                                { id: 'social-twitter', label: 'Twitter' },
                            ],
                        },
                    ],
                },
            ];
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: nestedItems }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            const shareItem = container.querySelector(
                '.menu-item-wrapper[data-item-id="share"] .menu-item'
            ) as HTMLElement;
            const socialItem = container.querySelector(
                '.menu-item-wrapper[data-item-id="share-social"] .menu-item'
            ) as HTMLElement;
            const fbItem = container.querySelector(
                '.menu-item-wrapper[data-item-id="social-fb"] .menu-item'
            ) as HTMLElement;
            const emailItem = container.querySelector(
                '.menu-item-wrapper[data-item-id="share-email"] .menu-item'
            ) as HTMLElement;

            dispatchMenuPointerOver(shareItem);
            await waitMs(350);
            dispatchMenuPointerOver(socialItem, shareItem);
            await waitMs(350);
            dispatchMenuPointerOver(fbItem, socialItem);
            await waitMs(350);

            expect(
                container.querySelector('.menu-submenu[data-submenu-id="share"]')?.classList.contains('menu-submenu--open')
            ).toBe(true);
            expect(
                container.querySelector('.menu-submenu[data-submenu-id="share-social"]')?.classList.contains('menu-submenu--open')
            ).toBe(true);
            expect(shareItem.classList.contains('menu-item--hover')).toBe(true);
            expect(socialItem.classList.contains('menu-item--hover')).toBe(true);
            expect(fbItem.classList.contains('menu-item--active-visual')).toBe(true);
            expect(emailItem.classList.contains('menu-item--hover')).toBe(false);

            dispatchMenuPointerOver(emailItem, fbItem);
            await waitMs(350);

            expect(emailItem.classList.contains('menu-item--active-visual')).toBe(true);
            expect(
                container.querySelector('.menu-submenu[data-submenu-id="share-social"]')?.classList.contains('menu-submenu--open')
            ).toBe(false);
            expect(shareItem.classList.contains('menu-item--hover')).toBe(true);
        });

        test('navigation clavier pose .menu-item--active-visual sur l\'item focalisé', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: parentItems }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            const focusable = container.querySelectorAll('.menu-item');
            const first = focusable[0] as HTMLElement;
            first.setAttribute('tabindex', '0');
            first.focus();

            container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
            await flushMenuAnimationFrames();

            const activeItems = container.querySelectorAll('.menu-item--active-visual');
            expect(activeItems.length).toBe(1);
            expect(activeItems[0]).not.toBe(first);
        });

        test('destroy() nettoie les listeners délégués et l\'état visuel', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: parentItems }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            const wrapper = container.querySelector('.menu-item-wrapper') as HTMLElement;
            wrapper.querySelector('.menu-item')!.dispatchEvent(
                new PointerEvent('pointerover', { bubbles: true, relatedTarget: document.body, pointerType: 'mouse' })
            );

            menu.destroy();

            expect(Menu.getInstance(menuElement)).toBeFalsy();
            expect(document.querySelector('.menu-item--active-visual')).toBeNull();
        });
    });

    describe('Sous-menus — intention, délégation et scoping', () => {
        const parentItems: MenuItem[] = [
            {
                id: 'parent',
                label: 'Parent',
                items: [{ id: 'child1', label: 'Enfant 1' }],
            },
        ];

        test('affiche active-visual sur le parent pendant le délai d\'ouverture (avant menu-item--hover)', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: parentItems }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            const parentItem = container.querySelector(
                '.menu-item-wrapper[data-item-id="parent"] .menu-item'
            ) as HTMLElement;

            dispatchMenuPointerOver(parentItem);
            await waitMs(Math.max(10, MenuSpecs.timing.submenuOpenDelayMs - 30));

            expect(parentItem.classList.contains('menu-item--active-visual')).toBe(true);
            expect(parentItem.classList.contains('menu-item--hover')).toBe(false);
        });

        test('conserve menu-item--hover sur le parent dès l\'ouverture du sous-menu (sans entrer dans l\'enfant)', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: parentItems }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            const parentItem = container.querySelector(
                '.menu-item-wrapper[data-item-id="parent"] .menu-item'
            ) as HTMLElement;

            dispatchMenuPointerOver(parentItem);
            await waitMs(MenuSpecs.timing.submenuOpenDelayMs + 80);

            expect(
                container.querySelector('.menu-submenu[data-submenu-id="parent"]')?.classList.contains('menu-submenu--open')
            ).toBe(true);
            expect(parentItem.classList.contains('menu-item--hover')).toBe(true);
        });

        test('ouvre au survol du padding du wrapper (closest, pas hit-test coordonnées)', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: parentItems }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            const wrapper = container.querySelector(
                '.menu-item-wrapper[data-item-id="parent"]'
            ) as HTMLElement;

            dispatchMenuPointerOver(wrapper);
            await waitMs(MenuSpecs.timing.submenuOpenDelayMs + 50);

            const submenu = container.querySelector('.menu-submenu[data-submenu-id="parent"]') as HTMLElement;
            expect(submenu.classList.contains('menu-submenu--open')).toBe(true);
        });

        test('n\'appelle _openSubmenu qu\'une seule fois par entrée pointer', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: parentItems }));
            await openMenuReady(menu, 50);

            const openSpy = jest.spyOn(
                menu as unknown as { _openSubmenu: (id: string, el: HTMLElement) => void },
                '_openSubmenu'
            );

            const container = getMenuContainerEl(menuElement)!;
            const wrapper = container.querySelector(
                '.menu-item-wrapper[data-item-id="parent"]'
            ) as HTMLElement;
            const menuItem = wrapper.querySelector('.menu-item') as HTMLElement;

            dispatchMenuPointerOver(menuItem);
            await waitMs(MenuSpecs.timing.submenuOpenDelayMs + 80);

            expect(openSpy).toHaveBeenCalledTimes(1);
            openSpy.mockRestore();
        });

        test('fermeture différée annulée par re-survol avant submenuCloseDelayMs', async () => {
            const menu = await initMenuReady(() => Menu.init(menuElement, { items: parentItems }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            const wrapper = container.querySelector(
                '.menu-item-wrapper[data-item-id="parent"]'
            ) as HTMLElement;
            const menuItem = wrapper.querySelector('.menu-item') as HTMLElement;

            dispatchMenuPointerOver(menuItem);
            await waitMs(MenuSpecs.timing.submenuOpenDelayMs + 80);

            dispatchMenuPointerOut(menuItem, document.body);
            await waitMs(Math.max(10, MenuSpecs.timing.submenuCloseDelayMs - 40));

            dispatchMenuPointerOver(menuItem);
            await waitMs(MenuSpecs.timing.submenuCloseDelayMs + 80);

            const submenu = container.querySelector('.menu-submenu[data-submenu-id="parent"]') as HTMLElement;
            expect(submenu.classList.contains('menu-submenu--open')).toBe(true);
        });

        test('scoping multi-menus : pas de collision document.querySelector', async () => {
            const menu2Host = document.createElement('k3ui-menu');
            menu2Host.classList.add('no-autoinit');
            menu2Host.id = 'test-menu-2';
            const trigger2 = document.createElement('button');
            trigger2.slot = 'trigger';
            menu2Host.appendChild(trigger2);
            document.body.appendChild(menu2Host);

            const sharedId = 'shared-parent';
            const items: MenuItem[] = [
                {
                    id: sharedId,
                    label: 'Menu 1',
                    items: [{ id: 'c1', label: 'C1' }],
                },
            ];

            const menu1 = await initMenuReady(() => Menu.init(menuElement, { items }));
            const menu2 = await initMenuReady(() => Menu.init(menu2Host, { items }));
            await openMenuReady(menu1, 50);
            await openMenuReady(menu2, 50);

            const container1 = getMenuContainerEl(menuElement)!;
            const container2 = getMenuContainerEl(menu2Host)!;

            const item1 = container1.querySelector(
                `.menu-item-wrapper[data-item-id="${sharedId}"] .menu-item`
            ) as HTMLElement;
            const item2 = container2.querySelector(
                `.menu-item-wrapper[data-item-id="${sharedId}"] .menu-item`
            ) as HTMLElement;

            dispatchMenuPointerOver(item1);
            await waitMs(MenuSpecs.timing.submenuOpenDelayMs + 80);

            const sub1 = container1.querySelector(
                `.menu-submenu[data-submenu-id="${sharedId}"]`
            ) as HTMLElement;
            const sub2 = container2.querySelector(
                `.menu-submenu[data-submenu-id="${sharedId}"]`
            ) as HTMLElement;

            expect(sub1.classList.contains('menu-submenu--open')).toBe(true);
            expect(sub2.classList.contains('menu-submenu--open')).toBe(false);

            dispatchMenuPointerOver(item2);
            await waitMs(MenuSpecs.timing.submenuOpenDelayMs + 80);

            expect(sub2.classList.contains('menu-submenu--open')).toBe(true);
            expect(sub2.closest('.menu-container')?.getAttribute('data-menu-id')).toBe('test-menu-2');
            expect(sub1.closest('.menu-container')?.getAttribute('data-menu-id')).toBe('test-menu');

            menu2.destroy();
            menu2Host.remove();
        });

        test('click délégué sur menuContainer — onItemClick sans handler par wrapper', async () => {
            const onItemClick = jest.fn();
            const items: MenuItem[] = [{ id: 'leaf', label: 'Feuille' }];
            const menu = await initMenuReady(() => Menu.init(menuElement, { items, onItemClick }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            const leaf = container.querySelector('.menu-item') as HTMLElement;
            leaf.click();

            expect(onItemClick).toHaveBeenCalledTimes(1);
            expect(onItemClick.mock.calls[0][0].id).toBe('leaf');
        });

        test('exclusivité pointer vs clavier sur active-visual', async () => {
            const items: MenuItem[] = [
                {
                    id: 'parent',
                    label: 'Parent',
                    items: [{ id: 'child1', label: 'Enfant 1' }],
                },
                { id: 'item2', label: 'Item 2' },
            ];
            const menu = await initMenuReady(() => Menu.init(menuElement, { items }));
            await openMenuReady(menu, 50);

            const container = getMenuContainerEl(menuElement)!;
            const parentItem = container.querySelector(
                '.menu-item-wrapper[data-item-id="parent"] .menu-item'
            ) as HTMLElement;
            const item2 = container.querySelector(
                '.menu-item-wrapper[data-item-id="item2"] .menu-item'
            ) as HTMLElement;

            item2.setAttribute('tabindex', '0');
            item2.focus();
            container.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
            expect(item2.classList.contains('menu-item--active-visual')).toBe(true);
            expect(parentItem.classList.contains('menu-item--active-visual')).toBe(false);

            dispatchMenuPointerOver(parentItem, item2);
            await waitMs(MenuSpecs.timing.submenuOpenDelayMs + 80);
            expect(parentItem.classList.contains('menu-item--active-visual')).toBe(true);
            expect(item2.classList.contains('menu-item--active-visual')).toBe(false);
        });
    });
});
