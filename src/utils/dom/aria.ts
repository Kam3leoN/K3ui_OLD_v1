/**
 * @fileoverview Module de gestion des attributs ARIA pour K3UI
 * @description Fonctions utilitaires pour la conversion et la validation des attributs ARIA
 * @author K3UI Team
 * @version 1.0.0
 * @license Apache-2.0
 */

// ============================================================================
// CONSTANTES ARIA
// ============================================================================

/**
 * Propriétés ARIA réfléchies du modèle d'objet d'accessibilité (AOM).
 * Liste complète des propriétés ARIA supportées via l'Accessibility Object Model.
 */
export const ARIA_PROPERTIES = [
    'ariaAtomic',
    'ariaAutoComplete',
    'ariaBusy',
    'ariaChecked',
    'ariaColCount',
    'ariaColIndex',
    'ariaColSpan',
    'ariaCurrent',
    'ariaDisabled',
    'ariaExpanded',
    'ariaHasPopup',
    'ariaHidden',
    'ariaInvalid',
    'ariaKeyShortcuts',
    'ariaLabel',
    'ariaLevel',
    'ariaLive',
    'ariaModal',
    'ariaMultiLine',
    'ariaMultiSelectable',
    'ariaOrientation',
    'ariaPlaceholder',
    'ariaPosInSet',
    'ariaPressed',
    'ariaReadOnly',
    'ariaRequired',
    'ariaRoleDescription',
    'ariaRowCount',
    'ariaRowIndex',
    'ariaRowSpan',
    'ariaSelected',
    'ariaSetSize',
    'ariaSort',
    'ariaValueMax',
    'ariaValueMin',
    'ariaValueNow',
    'ariaValueText',
] as const;

/**
 * Attributs ARIA correspondants aux propriétés AOM.
 * Générés automatiquement depuis ARIA_PROPERTIES.
 */
export const ARIA_ATTRIBUTES = ARIA_PROPERTIES.map(ariaPropertyToAttribute);

// ============================================================================
// FONCTIONS UTILITAIRES ARIA
// ============================================================================

/**
 * Vérifie si un attribut est un attribut ARIA.
 * 
 * @example
 * ```typescript
 * isAriaAttribute('aria-label'); // true
 * isAriaAttribute('class'); // false
 * ```
 * 
 * @param attribute - L'attribut à vérifier
 * @returns True si l'attribut est un attribut ARIA, false sinon
 */
export function isAriaAttribute(attribute: string): boolean {
    return attribute.startsWith('aria-');
}

/**
 * Convertit une propriété ARIA AOM (camelCase) en son attribut correspondant (kebab-case).
 * 
 * @example
 * ```typescript
 * ariaPropertyToAttribute('ariaLabel'); // 'aria-label'
 * ariaPropertyToAttribute('ariaLabelledBy'); // 'aria-labelledby'
 * ```
 * 
 * @param property - La propriété ARIA au format camelCase
 * @returns L'attribut ARIA au format kebab-case
 */
export function ariaPropertyToAttribute(property: string): string {
    return property
        .replace('aria', 'aria-')
        // Les attributs IDREF incluent également un suffixe "Element" ou "Elements"
        .replace(/Elements?/g, '')
        .toLowerCase();
}

/**
 * Convertit un attribut ARIA (kebab-case) en sa propriété AOM correspondante (camelCase).
 * 
 * @example
 * ```typescript
 * ariaAttributeToProperty('aria-label'); // 'ariaLabel'
 * ariaAttributeToProperty('aria-labelledby'); // 'ariaLabelledBy'
 * ```
 * 
 * @param attribute - L'attribut ARIA au format kebab-case
 * @returns La propriété ARIA au format camelCase
 */
export function ariaAttributeToProperty(attribute: string): string {
    if (!isAriaAttribute(attribute)) {
        throw new Error(`"${attribute}" is not a valid ARIA attribute`);
    }

    // Retirer le préfixe 'aria-'
    const withoutPrefix = attribute.slice(5);

    // Convertir kebab-case en camelCase
    return 'aria' + withoutPrefix
        .split('-')
        .map((word, index) =>
            index === 0
                ? word.charAt(0).toLowerCase() + word.slice(1)
                : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join('');
}

/**
 * Définit un attribut ARIA sur un élément DOM.
 * Pour l'attribut natif HTML `role`, on utilise setAttribute('role', ...) et non aria-role.
 *
 * @example
 * ```typescript
 * const button = document.createElement('button');
 * setAriaAttribute(button, 'label', 'Fermer la fenêtre');
 * setAriaAttribute(button, 'role', 'group'); // → setAttribute('role', 'group')
 * ```
 *
 * @param element - L'élément DOM cible
 * @param name - Le nom de l'attribut ARIA (sans le préfixe 'aria-') ou 'role'
 * @param value - La valeur de l'attribut
 */
export function setAriaAttribute(element: HTMLElement, name: string, value: string | boolean | number | null): void {
    const isRole = name === 'role' || name === 'aria-role';
    const attributeName = isRole ? 'role' : (name.startsWith('aria-') ? name : `aria-${name}`);

    if (value === null || value === false) {
        element.removeAttribute(attributeName);
    } else if (value === true) {
        element.setAttribute(attributeName, 'true');
    } else {
        element.setAttribute(attributeName, String(value));
    }
}

/**
 * Obtient la valeur d'un attribut ARIA depuis un élément DOM.
 * Pour 'role', utilise getAttribute('role').
 *
 * @param element - L'élément DOM cible
 * @param name - Le nom de l'attribut ARIA (sans le préfixe 'aria-') ou 'role'
 * @returns La valeur de l'attribut ou null si absent
 */
export function getAriaAttribute(element: HTMLElement, name: string): string | null {
    const isRole = name === 'role' || name === 'aria-role';
    const attributeName = isRole ? 'role' : (name.startsWith('aria-') ? name : `aria-${name}`);
    return element.getAttribute(attributeName);
}

/**
 * Supprime un attribut ARIA d'un élément DOM.
 * Pour 'role', utilise removeAttribute('role').
 *
 * @param element - L'élément DOM cible
 * @param name - Le nom de l'attribut ARIA (sans le préfixe 'aria-') ou 'role'
 */
export function removeAriaAttribute(element: HTMLElement, name: string): void {
    const isRole = name === 'role' || name === 'aria-role';
    const attributeName = isRole ? 'role' : (name.startsWith('aria-') ? name : `aria-${name}`);
    element.removeAttribute(attributeName);
}

/**
 * Définit plusieurs attributs ARIA sur un élément DOM.
 * 
 * @example
 * ```typescript
 * const button = document.createElement('button');
 * setAriaAttributes(button, {
 *   label: 'Fermer',
 *   expanded: true,
 *   hidden: false
 * });
 * ```
 * 
 * @param element - L'élément DOM cible
 * @param attributes - Objet contenant les attributs ARIA à définir
 */
export function setAriaAttributes(element: HTMLElement, attributes: Record<string, string | boolean | number | null>): void {
    Object.entries(attributes).forEach(([name, value]) => {
        setAriaAttribute(element, name, value);
    });
}

