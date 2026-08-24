import { AvatarGroup } from '../../components/Avatar';
import { Menu } from '../../components/Menu';
import { DEFAULT_COMPONENT_OPTIONS } from '../../config';
import type { MenuItem, MenuOptions } from '../../types/components/components';
import { isMenuItemClickEvent } from '../../types/components/menu-events';
import { setMenuTriggerElement } from '../../types/dom/k3ui-menu-element';
import { getK3uiGlobal } from '../../types/global/k3ui-window';
import type { AutoInitOptions } from './types';
import { k3uiLogger } from './logger';

type ThemeChoice = 'light' | 'dark' | 'auto' | 'system';

const THEME_BY_ID: Record<string, ThemeChoice> = {
    light: 'light',
    dark: 'dark',
    auto: 'auto',
    system: 'system',
};

function applyThemeFromMenuId(selectedId: string): void {
    const theme = THEME_BY_ID[selectedId];
    const themeManager = getK3uiGlobal()?.ThemeManager;
    if (theme && themeManager) {
        themeManager.setTheme(theme);
    }
}

function readMenuItemSelection(detail: { menuItem?: HTMLElement; item?: MenuItem }): {
    selectedLabel: string | null;
    selectedId: string | null;
    selectedIcon: string | null;
    menuItemEl: HTMLElement | null;
} {
    const menuItem = detail.menuItem;
    let selectedLabel: string | null = null;
    let selectedId: string | null = null;
    let selectedIcon: string | null = null;

    if (menuItem && menuItem.tagName.toLowerCase() === 'menu-item') {
        selectedLabel = menuItem.getAttribute('data-label');
        selectedId = menuItem.getAttribute('data-id');
        selectedIcon = menuItem.getAttribute('data-leading-icon');
    } else if (detail.item) {
        const item = detail.item;
        selectedLabel = item.label || item.text || null;
        selectedId = item.id || null;
        selectedIcon = item.icon || null;
    }

    return { selectedLabel, selectedId, selectedIcon, menuItemEl: menuItem ?? null };
}

/**
 * Initialise les menus simples (ul.menu-content avec data-target)
 */
export function initSimpleMenus(context: HTMLElement, mergedOptions: Partial<AutoInitOptions>): void {
    const simpleMenus = context.querySelectorAll('ul.menu-content:not(.no-autoinit)') as NodeListOf<HTMLElement>;
    if (simpleMenus.length === 0) return;
    const menuOptions = (mergedOptions.Menu ?? DEFAULT_COMPONENT_OPTIONS.Menu) as Partial<MenuOptions>;
    simpleMenus.forEach(menuEl => {
        const menuId = menuEl.getAttribute('id');
        if (menuId) {
            const trigger = context.querySelector(`[data-target="${menuId}"]`) as HTMLElement;
            if (trigger) {
                const wrapper = document.createElement('k3ui-menu');
                menuEl.parentNode?.insertBefore(wrapper, menuEl);
                wrapper.appendChild(menuEl);
                setMenuTriggerElement(wrapper, trigger);
                Menu.init(wrapper, {
                    ...menuOptions,
                    menuEl: menuEl,
                    alignment: trigger.classList.contains('menu--right') ? 'right' : 'left'
                });
            }
        }
    });
    k3uiLogger.info(`${simpleMenus.length} menu${simpleMenus.length > 1 ? 'x' : ''} simple${simpleMenus.length > 1 ? 's' : ''} initialisé${simpleMenus.length > 1 ? 's' : ''}`);
}

/**
 * Initialise les groupes d'avatars
 */
export function initAvatarGroups(context: HTMLElement): void {
    const avatarGroups = context.querySelectorAll('.avatar-group:not(.no-autoinit)') as NodeListOf<HTMLElement>;
    if (avatarGroups.length === 0) return;
    avatarGroups.forEach(groupEl => {
        const stacking = groupEl.classList.contains('avatar-stacked--right') ? 'right' : 'left';
        const maxAttr = groupEl.getAttribute('data-max');
        const isLimited = groupEl.classList.contains('avatar-limited');
        const max = maxAttr ? parseInt(maxAttr, 10) : (isLimited ? 4 : undefined);
        new AvatarGroup(groupEl, { stacking, max });
    });
    k3uiLogger.info(`${avatarGroups.length} groupe${avatarGroups.length > 1 ? 's' : ''} d'avatars initialisé${avatarGroups.length > 1 ? 's' : ''}`);
}

/**
 * Initialise les menus statiques (k3ui-menu avec input.select-menu ou button.select-trigger)
 */
export function initStaticSelectMenus(context: HTMLElement, _mergedOptions: Partial<AutoInitOptions>): void {
    const staticSelectMenus = context.querySelectorAll('k3ui-menu input.select-menu, k3ui-menu input.select-trigger, k3ui-menu button[slot="trigger"]') as NodeListOf<HTMLInputElement | HTMLButtonElement>;
    if (staticSelectMenus.length === 0) return;
    staticSelectMenus.forEach((trigger, index) => {
        const isInput = trigger.tagName === 'INPUT';
        const isButton = trigger.tagName === 'BUTTON';
        const input = isInput ? trigger as HTMLInputElement : null;
        const button = isButton ? trigger as HTMLButtonElement : null;

        const menuEl = trigger.closest('k3ui-menu');
        const field = trigger.closest('k3ui-field');
        const inputField = trigger.closest('.input-field');

        if (!menuEl || !field || !inputField) return;
        const menu = menuEl as HTMLElement;

        if (isButton && button) {
            if (!menu.id) menu.id = `menu-${Date.now()}-${index}`;
            if (field && inputField) {
                const groupName = field.getAttribute('data-group');
                const parent = field.parentElement;
                if (parent) {
                    parent.removeChild(field);
                    const container = document.createElement('div');
                    container.className = 'select-button-container';
                    if (groupName) container.setAttribute('data-group', groupName);
                    container.appendChild(menu);
                    parent.insertBefore(container, field.nextSibling);
                    if (inputField.parentElement) inputField.parentElement.removeChild(inputField);
                    k3uiLogger.debug('Button trigger - Removed field wrapper, kept button and menu');
                }
            }
            setMenuTriggerElement(menu, button);
            const handleItemClick = (e: Event): void => {
                if (!isMenuItemClickEvent(e)) return;
                const { selectedId } = readMenuItemSelection(e.detail);
                const container = menu.closest('.select-button-container') || menu.closest('k3ui-field');
                const groupName = container?.getAttribute('data-group');
                if (groupName === 'theme' && selectedId) {
                    applyThemeFromMenuId(selectedId);
                }
            };
            menu.addEventListener('onItemClick', handleItemClick);
            return;
        }

        let wrapper = inputField.querySelector('.select-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'select-wrapper';
            const variant = field.getAttribute('variant') || 'outlined';
            if (variant === 'filled') inputField.classList.add('filled');
            else inputField.classList.add('outlined');
            if (field.classList.contains('select--right') || trigger.classList.contains('select--right')) wrapper.classList.add('select--right');
            while (inputField.firstChild) inputField.removeChild(inputField.firstChild);
            inputField.appendChild(wrapper);
            if (!menu.id) menu.id = `menu-${Date.now()}-${index}`;
            if (isInput && input) {
                input.removeAttribute('slot');
                wrapper.appendChild(input);
                input.setAttribute('data-target', menu.id);
                setMenuTriggerElement(menu, input);
            } else if (isButton && button) {
                setMenuTriggerElement(menu, button);
            }
            if (!inputField.contains(menu)) inputField.appendChild(menu);
        }

        if (isInput && !wrapper!.querySelector('.caret')) {
            const caret = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            caret.classList.add('caret');
            caret.setAttribute('height', '24');
            caret.setAttribute('width', '24');
            caret.setAttribute('viewBox', '0 0 24 24');
            caret.setAttribute('aria-hidden', 'true');
            caret.innerHTML = `<path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/>`;
            wrapper!.appendChild(caret);
        }

        const menuInstance = Menu.getInstance(menu as HTMLElement);
        if (!menuInstance) {
            k3uiLogger.debug('Menu not initialized, initializing now...', menu.id);
            getK3uiGlobal()?.Menu?.init(menu);
        }

        const handleItemClick = (e: Event): void => {
            if (!isMenuItemClickEvent(e)) return;
            k3uiLogger.debug('Menu item clicked', e.detail);
            const { selectedLabel, selectedId, selectedIcon, menuItemEl } = readMenuItemSelection(e.detail);
            let resolvedIcon = selectedIcon;
            let resolvedLabel = selectedLabel;

            if (!resolvedIcon && selectedId && menu) {
                const menuItemById = menu.querySelector(`menu-item[data-id="${selectedId}"]`) as HTMLElement;
                if (menuItemById) resolvedIcon = menuItemById.getAttribute('data-leading-icon');
            }
            if (!resolvedLabel && selectedId && menu) {
                const menuItemById = menu.querySelector(`menu-item[data-id="${selectedId}"]`) as HTMLElement;
                if (menuItemById) resolvedLabel = menuItemById.getAttribute('data-label');
            }
            const currentFieldOrContainer = field || (isButton ? menu.closest('.select-button-container') : null);
            const groupName = currentFieldOrContainer?.getAttribute('data-group');
            if (groupName === 'theme' && selectedId) {
                k3uiLogger.debug('Theme change - Setting theme to:', THEME_BY_ID[selectedId]);
                applyThemeFromMenuId(selectedId);
            }
            if (resolvedLabel || resolvedIcon) {
                if (isInput && input && resolvedLabel) input.value = resolvedLabel;
                if (isButton && button && resolvedIcon) {
                    const iconElement = button.querySelector('i.k3ui-icon, i[name]') as HTMLElement;
                    if (iconElement) {
                        iconElement.setAttribute('name', resolvedIcon);
                        getK3uiGlobal()?.IconManager?.forceDisplayIcons();
                    }
                }
                const currentFieldOrContainerForSync = field || (isButton ? menu.closest('.select-button-container') : null);
                const groupNameForSync = currentFieldOrContainerForSync?.getAttribute('data-group');
                if (groupNameForSync && (selectedId || resolvedLabel || resolvedIcon)) {
                    const allGroupElements = document.querySelectorAll(`k3ui-field[data-group="${groupNameForSync}"], .select-button-container[data-group="${groupNameForSync}"]`);
                    k3uiLogger.debug('Group sync - Found', allGroupElements.length, 'elements with group', groupNameForSync, 'selectedId:', selectedId, 'selectedLabel:', resolvedLabel, 'selectedIcon:', resolvedIcon);
                    allGroupElements.forEach((otherElement) => {
                        const currentContainer = currentFieldOrContainerForSync;
                        if (otherElement !== currentContainer) {
                            k3uiLogger.debug('Group sync - Processing other element:', otherElement.tagName, otherElement.id || 'no-id');
                            let otherInputField: HTMLElement | null = null;
                            if (otherElement.tagName === 'K3UI-FIELD') otherInputField = otherElement.querySelector('.input-field');
                            else otherInputField = otherElement as HTMLElement;
                            if (otherInputField) {
                                const otherMenu = otherInputField.querySelector('k3ui-menu') || (otherInputField.tagName === 'K3UI-MENU' ? otherInputField : null) as HTMLElement;
                                if (otherMenu) {
                                    if (otherElement.tagName === 'K3UI-FIELD') {
                                        const otherWrapper = otherInputField.querySelector('.select-wrapper');
                                        k3uiLogger.debug('Group sync - Other wrapper found:', !!otherWrapper);
                                        if (otherWrapper) {
                                            const otherInput = otherWrapper.querySelector('input.select-menu, input.select-trigger') as HTMLInputElement;
                                            k3uiLogger.debug('Group sync - Other input found:', !!otherInput, 'tagName:', otherInput?.tagName, 'selectedLabel:', resolvedLabel);
                                            if (otherInput && otherInput.tagName === 'INPUT' && resolvedLabel) {
                                                otherInput.value = resolvedLabel;
                                                k3uiLogger.debug('Group sync - Updated input value to:', resolvedLabel);
                                            }
                                            let iconToUse = resolvedIcon;
                                            if (!iconToUse && selectedId) {
                                                const menuItemById = otherMenu.querySelector(`menu-item[data-id="${selectedId}"]`) as HTMLElement;
                                                if (menuItemById) iconToUse = menuItemById.getAttribute('data-leading-icon');
                                            }
                                            const otherButton = otherMenu.querySelector('button[slot="trigger"]') as HTMLButtonElement;
                                            if (otherButton && iconToUse) {
                                                const otherIconElement = otherButton.querySelector('i.k3ui-icon, i[name]') as HTMLElement;
                                                if (otherIconElement) {
                                                    otherIconElement.setAttribute('name', iconToUse);
                                                    k3uiLogger.debug('Group sync - Updated button icon in field to:', iconToUse);
                                                    getK3uiGlobal()?.IconManager?.forceDisplayIcons();
                                                }
                                            }
                                        } else k3uiLogger.debug('Group sync - No wrapper found in other field');
                                    }
                                    if (otherElement.classList.contains('select-button-container')) {
                                        const otherButton = otherMenu.querySelector('button[slot="trigger"]') as HTMLButtonElement;
                                        k3uiLogger.debug('Group sync - Other button found in container:', !!otherButton, 'selectedIcon:', resolvedIcon);
                                        let iconToUse = resolvedIcon;
                                        if (!iconToUse && selectedId) {
                                            const menuItemById = otherMenu.querySelector(`menu-item[data-id="${selectedId}"]`) as HTMLElement;
                                            if (menuItemById) iconToUse = menuItemById.getAttribute('data-leading-icon');
                                        }
                                        if (otherButton && iconToUse) {
                                            const otherIconElement = otherButton.querySelector('i.k3ui-icon, i[name]') as HTMLElement;
                                            if (otherIconElement) {
                                                otherIconElement.setAttribute('name', iconToUse);
                                                k3uiLogger.debug('Group sync - Updated button icon in container to:', iconToUse);
                                                getK3uiGlobal()?.IconManager?.forceDisplayIcons();
                                            }
                                        }
                                    }
                                    if (selectedId) {
                                        const otherMenuItem = otherMenu.querySelector(`menu-item[data-id="${selectedId}"]`) as HTMLElement;
                                        if (otherMenuItem) {
                                            otherMenu.querySelectorAll('menu-item[data-selected]').forEach((item) => { item.removeAttribute('data-selected'); item.removeAttribute('data-checked'); });
                                            otherMenuItem.setAttribute('data-selected', 'true');
                                            otherMenuItem.setAttribute('data-checked', 'true');
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
                if (menuItemEl && selectedId) {
                    menu.querySelectorAll('menu-item[data-selected]').forEach((item) => { item.removeAttribute('data-selected'); item.removeAttribute('data-checked'); });
                    menuItemEl.setAttribute('data-selected', 'true');
                    menuItemEl.setAttribute('data-checked', 'true');
                }
            }
        };
        menu.addEventListener('onItemClick', handleItemClick);
    });
    k3uiLogger.info(`${staticSelectMenus.length} menu${staticSelectMenus.length > 1 ? 'x' : ''} statique${staticSelectMenus.length > 1 ? 's' : ''} de select initialisé${staticSelectMenus.length > 1 ? 's' : ''}`);
}
