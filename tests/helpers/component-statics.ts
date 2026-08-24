/**
 * Accès typé aux champs statiques internes (tests uniquement) — LOT 5.
 */
import { Dialog } from '../../src/components/Dialog';
import { Drawer } from '../../src/components/Drawer';

type DialogStatics = typeof Dialog & {
    _dialogsOpen: number;
    _count: number;
};

type DrawerStatics = typeof Drawer & {
    _drawers: Drawer[];
};

/** Champs statiques Dialog pour reset entre tests. */
export function dialogStatics(): DialogStatics {
    return Dialog as DialogStatics;
}

/** Champs statiques Drawer pour reset entre tests. */
export function drawerStatics(): DrawerStatics {
    return Drawer as DrawerStatics;
}
