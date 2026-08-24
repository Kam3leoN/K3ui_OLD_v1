/**
 * @fileoverview Helpers communs aux speed dials FAB (Dial / Rail)
 */

import type { ButtonFabSpeedDialItem } from '../../types/components';
import { setAriaAttributes } from '../dom/aria';
import { createRipple, Ripple } from '../effects/ripple';

/** Attributs data-pressed pour le morph squircle (évite :active collé sur Android). */
export function bindFabPressHandlers(el: HTMLElement): void {
    const onDown = (): void => el.setAttribute('data-pressed', '');
    const onUp = (): void => el.removeAttribute('data-pressed');
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', onUp);
}

/**
 * Crée un bouton d'action circulaire avec icône K3UI.
 */
export function createFabActionButton(
    item: ButtonFabSpeedDialItem,
    className: string,
    role: string
): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className + ' ripple';
    btn.setAttribute('role', role);
    btn.setAttribute('data-id', item.id);
    setAriaAttributes(btn, { 'aria-label': item.label });
    btn.title = item.label;

    const iconEl = document.createElement('i');
    iconEl.className = 'k3ui-icon';
    iconEl.setAttribute('name', item.icon ?? 'edit');
    if (item.iconType) iconEl.setAttribute('type', item.iconType);
    setAriaAttributes(iconEl, { 'aria-hidden': 'true' });
    btn.appendChild(iconEl);

    bindFabPressHandlers(btn);
    return btn;
}

/**
 * Applique le positionnement fixe selon le coin.
 */
export function applyFabCornerPosition(
    el: HTMLElement,
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left',
    insetPx: number,
    fixed: boolean
): void {
    const [vertical, horizontal] = position.split('-');
    el.style.position = fixed ? 'fixed' : 'absolute';
    el.style.bottom = vertical === 'bottom' ? `${insetPx}px` : 'auto';
    el.style.top = vertical === 'top' ? `${insetPx}px` : 'auto';
    el.style.right = horizontal === 'right' ? `${insetPx}px` : 'auto';
    el.style.left = horizontal === 'left' ? `${insetPx}px` : 'auto';
}

/**
 * Attache un ripple et retourne l'instance pour cleanup.
 */
export function attachFabRipple(el: HTMLElement): Ripple | null {
    try {
        return createRipple(el);
    } catch {
        return null;
    }
}

/** Préfixe BEM des speed dials FAB (Dial / Rail). */
export type FabSpeedDialBlock = 'button-fab-dial' | 'button-fab-rail';

/**
 * Animation rebondissante du trigger + ↔ × (alignée ButtonFabMenu).
 * Les classes --open / --closing sont mutuellement exclusives pour relancer la keyframe à chaque toggle.
 */
export function updateFabSpeedDialTriggerIcon(
    root: HTMLElement,
    iconRotator: HTMLElement | null,
    block: FabSpeedDialBlock,
    isOpen: boolean
): HTMLElement | null {
    let rotator = iconRotator;
    if (!rotator || !root.contains(rotator)) {
        rotator = root.querySelector(`.${block}__icon-rotator`) as HTMLElement | null;
    }
    if (!rotator) return null;

    const openClass = `${block}__icon-rotator--open`;
    const closingClass = `${block}__icon-rotator--closing`;
    rotator.classList.remove(openClass, closingClass);
    rotator.classList.add(isOpen ? openClass : closingClass);
    return rotator;
}
