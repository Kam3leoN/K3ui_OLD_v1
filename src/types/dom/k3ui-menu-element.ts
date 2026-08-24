/**
 * Élément custom `k3ui-menu` avec trigger DOM associé (AutoInit / Select).
 */
export interface K3uiMenuElement extends HTMLElement {
    __triggerElement?: HTMLElement;
}

/** Conteneur flottant du menu (reparenté temporairement dans `body`). */
export interface K3uiMenuContainerElement extends HTMLElement {
    __originalParent?: HTMLElement;
}

/**
 * Associe le déclencheur DOM au conteneur menu avant `Menu.init`.
 * @param menuEl - Élément `k3ui-menu` ou équivalent
 * @param trigger - Bouton ou input déclencheur
 */
export function setMenuTriggerElement(menuEl: HTMLElement, trigger: HTMLElement): void {
    (menuEl as K3uiMenuElement).__triggerElement = trigger;
}

/** `menu-item` généré par Select : lien vers l’`<option>` native. */
export interface K3uiSelectMenuItemElement extends HTMLElement {
    __realOption?: HTMLOptionElement | HTMLOptGroupElement;
}

/**
 * Associe un item de menu virtuel à son option HTML native.
 * @param menuItem - Élément `menu-item`
 * @param option - Option ou optgroup source
 */
export function setSelectMenuItemRealOption(
    menuItem: HTMLElement,
    option: HTMLOptionElement | HTMLOptGroupElement
): void {
    (menuItem as K3uiSelectMenuItemElement).__realOption = option;
}
