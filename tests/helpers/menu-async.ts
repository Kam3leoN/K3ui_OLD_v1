/**

 * Helpers async pour les tests Menu (LOT 7).

 */

import { Menu } from '../../src/components/Menu';

import type { MenuOptions } from '../../src/types/components';

import { flushComponentInit } from './component-init';



/** Pause timers réels (Popper, animations Menu). */

export function waitMs(ms: number): Promise<void> {

    return new Promise((resolve) => {

        setTimeout(resolve, ms);

    });

}



/** Double rAF pour laisser Popper / requestAnimationFrame du Menu s'exécuter. */

export async function flushMenuAnimationFrames(): Promise<void> {

    await new Promise<void>((resolve) => {

        requestAnimationFrame(() => {

            requestAnimationFrame(() => resolve());

        });

    });

}



/**

 * Conteneur du menu (déplacé dans `document.body` à l'ouverture).

 * @param menuHost - élément hôte (`k3ui-menu`)

 */

export function getMenuContainerEl(menuHost: HTMLElement): HTMLElement | null {

    if (!menuHost.id) {

        return menuHost.querySelector('.menu-container');

    }

    return document.querySelector(

        `.menu-container[data-menu-id="${menuHost.id}"]`

    ) as HTMLElement | null;

}



/**

 * Init Menu + `onInit` (setTimeout 0) du constructeur.

 * @param initFn - ex. `() => Menu.init(menuElement, { items })`

 */

export async function initMenuReady<T extends Menu>(initFn: () => T): Promise<T> {

    const menu = initFn();

    await flushComponentInit();

    return menu;

}



/** Ouvre le menu et attend le rendu / positionnement. */

export async function openMenuReady(menu: Menu, waitMsAfter = 250): Promise<void> {

    menu.open();

    await flushMenuAnimationFrames();

    if (waitMsAfter > 0) {

        await waitMs(waitMsAfter);

    }

}



/** Ferme le menu et attend la fin d'animation (`outDuration`). */

export async function closeMenuReady(menu: Menu): Promise<void> {

    menu.close();

    await waitMs(menu.options.outDuration ?? 400);

}



/** Détruit tous les menus en attente de timers de fermeture. */

export async function destroyAllMenus(): Promise<void> {

    const menus = [...Menu._menus];

    for (const menu of menus) {

        if (menu.isOpen) {

            await closeMenuReady(menu);

        }

        try {

            menu.destroy();

        } catch {

            // instance déjà partiellement détruite

        }

    }

    Menu._menus = [];

}



export type { MenuOptions };

/** Simule pointerover (délégation Menu M3) */
export function dispatchMenuPointerOver(
    el: HTMLElement,
    relatedTarget: EventTarget | null = document.body
): void {
    const rect = el.getBoundingClientRect();
    el.dispatchEvent(
        new PointerEvent('pointerover', {
            bubbles: true,
            relatedTarget,
            pointerType: 'mouse',
            clientX: rect.left + Math.max(8, rect.width / 2),
            clientY: rect.top + Math.max(8, rect.height / 2),
        })
    );
}

/** Simule pointerout (délégation Menu M3) */
export function dispatchMenuPointerOut(
    el: HTMLElement,
    relatedTarget: EventTarget | null = document.body
): void {
    const rect = el.getBoundingClientRect();
    el.dispatchEvent(
        new PointerEvent('pointerout', {
            bubbles: true,
            relatedTarget,
            pointerType: 'mouse',
            clientX: rect.left + Math.max(8, rect.width / 2),
            clientY: rect.top + Math.max(8, rect.height / 2),
        })
    );
}


