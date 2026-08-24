import type { MenuItem } from './components';

/** Détail de l’événement DOM `onItemClick` émis par `Menu`. */
export interface MenuItemClickEventDetail {
    item: MenuItem;
    menuItem: HTMLElement;
    menuId: string;
}

/** Événement `onItemClick` sur `k3ui-menu`. */
export type MenuItemClickEvent = CustomEvent<MenuItemClickEventDetail>;

/**
 * Type guard pour les handlers `addEventListener('onItemClick', …)`.
 * @param event - Événement DOM
 */
export function isMenuItemClickEvent(event: Event): event is MenuItemClickEvent {
    return event.type === 'onItemClick' && 'detail' in event;
}
