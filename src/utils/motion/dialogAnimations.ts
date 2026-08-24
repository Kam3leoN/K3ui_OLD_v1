/**
 * @fileoverview Animations Dialog M3 Expressive (alignées material-web)
 * @see https://github.com/material-components/material-web/blob/main/dialog/internal/animations.ts
 */

/** Décalage vertical à l'entrée (material-web : -50px) */
export const DIALOG_ENTER_SLIDE_OFFSET_PX = 50;

/**
 * Transform centré pour le dialog modal (position fixed top/left 50%).
 * @param atRest - true = position finale, false = position initiale entrée
 */
export function getCenteredDialogTransform(atRest: boolean): string {
    return atRest
        ? 'translate(-50%, -50%)'
        : `translate(-50%, calc(-50% - ${DIALOG_ENTER_SLIDE_OFFSET_PX}px))`;
}

/**
 * Transform centré pour la sortie du dialog modal.
 */
export function getCenteredDialogExitTransform(): string {
    return `translate(-50%, calc(-50% - ${DIALOG_ENTER_SLIDE_OFFSET_PX}px))`;
}

/** Durées stagger headline / content / actions (material-web, ms) */
export const DIALOG_STAGGER_IN_DURATIONS = [250, 250, 300] as const;
export const DIALOG_STAGGER_IN_OFFSETS = [0, 50, 100] as const;
export const DIALOG_STAGGER_OUT_DURATION = 100;

/**
 * Prépare l'opacité initiale des sections pour l'animation stagger entrée.
 */
export function prepareDialogSectionsForEnter(dialogEl: HTMLElement): void {
    getDialogSections(dialogEl).forEach((section) => {
        section.style.opacity = '0';
    });
}

/**
 * Anime l'opacité des sections (headline, content, actions) en entrée.
 */
export function animateDialogSectionsIn(dialogEl: HTMLElement): void {
    getDialogSections(dialogEl).forEach((section, index) => {
        const duration = DIALOG_STAGGER_IN_DURATIONS[index] ?? 250;
        const delay = DIALOG_STAGGER_IN_OFFSETS[index] ?? 0;
        section.style.transition = `opacity ${duration}ms linear ${delay}ms`;
        section.style.opacity = '1';
    });
}

/**
 * Anime l'opacité des sections en sortie.
 */
export function animateDialogSectionsOut(dialogEl: HTMLElement): void {
    getDialogSections(dialogEl).forEach((section) => {
        section.style.transition = `opacity ${DIALOG_STAGGER_OUT_DURATION}ms linear`;
        section.style.opacity = '0';
    });
}

/**
 * Réinitialise les styles inline des sections après animation.
 */
export function resetDialogSectionStyles(dialogEl: HTMLElement): void {
    getDialogSections(dialogEl).forEach((section) => {
        section.style.opacity = '';
        section.style.transition = '';
    });
}

/**
 * Transform slide-up pour le dialog fullscreen (M3 mobile).
 * @param atRest - true = position finale, false = hors écran en bas
 */
export function getFullscreenDialogTransform(atRest: boolean): string {
    return atRest ? 'translateY(0)' : 'translateY(100%)';
}

/**
 * Transform slide-up pour la sortie du dialog fullscreen.
 */
export function getFullscreenDialogExitTransform(): string {
    return 'translateY(100%)';
}

/**
 * Indique si le viewport correspond au mode plein écran M3 (≤600dp).
 */
export function isFullscreenViewport(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return false;
    }
    return window.matchMedia('(max-width: 600px)').matches;
}

/**
 * Retourne les sections animables du dialog.
 */
function getDialogSections(dialogEl: HTMLElement): HTMLElement[] {
    return [
        dialogEl.querySelector('.dialog-header'),
        dialogEl.querySelector('.dialog-content'),
        dialogEl.querySelector('.dialog-footer'),
    ].filter((el): el is HTMLElement => el instanceof HTMLElement);
}
