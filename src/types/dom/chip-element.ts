import type { ChipData } from '../components/components';
import type { Keyboard } from '../../core/managers/KeyboardManager';
import type { Mouse } from '../../core/managers/MouseManager';
import type { Ripple } from '../../utils/effects/ripple';
import type { FocusRing } from '../../utils/effects/focusring';

/** Données runtime stockées sur le wrapper d’un chip (équivalent `ExtendedChipData` côté composant). */
export interface ChipDomData extends ChipData {
    id?: string;
    type?: 'assist' | 'filter' | 'input' | 'suggestion';
    selected?: boolean;
    disabled?: boolean;
    softDisabled?: boolean;
    alwaysFocusable?: boolean;
    elevated?: boolean;
    href?: string;
    target?: string;
    leadingIcon?: string;
    trailingIcon?: string;
    selectedIcon?: string;
    value?: string;
    removable?: boolean;
    touchTarget?: 'wrapper' | 'none';
    /** Forme du conteneur : `default` (8dp) ou `rounded` (pill / full) */
    shape?: 'default' | 'rounded';
    menuItems?: Array<{
        id?: string;
        text: string;
        leadingIcon?: string;
        trailingIcon?: string;
        disabled?: boolean;
        items?: Array<{
            id?: string;
            text: string;
            leadingIcon?: string;
            trailingIcon?: string;
            disabled?: boolean;
        }>;
    }>;
}

/** Élément DOM d’un chip (wrapper ou chip) avec instances K3UI attachées. */
export interface ChipWrapperElement extends HTMLElement {
    K_ChipData?: ChipDomData;
    K_ChipIndex?: number;
    K_Keyboard?: Keyboard;
    K_Mouse?: Mouse;
    K_Ripple?: Ripple;
    K_FocusRing?: FocusRing;
}

/** @param el - Wrapper ou élément chip */
export function getChipWrapperData(el: HTMLElement): ChipDomData | undefined {
    return (el as ChipWrapperElement).K_ChipData;
}

/** @param el - Wrapper ou élément chip */
export function setChipWrapperData(el: HTMLElement, data: ChipDomData): void {
    (el as ChipWrapperElement).K_ChipData = data;
}

/** @param el - Wrapper chip */
export function getChipWrapperIndex(el: HTMLElement): number | undefined {
    return (el as ChipWrapperElement).K_ChipIndex;
}

/** @param el - Wrapper chip */
export function setChipWrapperIndex(el: HTMLElement, index: number): void {
    (el as ChipWrapperElement).K_ChipIndex = index;
}

/** @param el - Élément chip */
export function getChipKeyboard(el: HTMLElement): Keyboard | undefined {
    return (el as ChipWrapperElement).K_Keyboard;
}

/** @param el - Élément chip */
export function setChipKeyboard(el: HTMLElement, keyboard: Keyboard): void {
    (el as ChipWrapperElement).K_Keyboard = keyboard;
}

/** @param el - Élément chip */
export function deleteChipKeyboard(el: HTMLElement): void {
    delete (el as ChipWrapperElement).K_Keyboard;
}

/** @param el - Élément chip */
export function getChipMouse(el: HTMLElement): Mouse | undefined {
    return (el as ChipWrapperElement).K_Mouse;
}

/** @param el - Élément chip */
export function setChipMouse(el: HTMLElement, mouse: Mouse): void {
    (el as ChipWrapperElement).K_Mouse = mouse;
}

/** @param el - Élément chip */
export function setChipRipple(el: HTMLElement, ripple: Ripple): void {
    (el as ChipWrapperElement).K_Ripple = ripple;
}

/** @param el - Élément chip */
export function setChipFocusRing(el: HTMLElement, focusRing: FocusRing): void {
    (el as ChipWrapperElement).K_FocusRing = focusRing;
}

/** @param el - Élément chip */
export function deleteChipFocusRing(el: HTMLElement): void {
    delete (el as ChipWrapperElement).K_FocusRing;
}
