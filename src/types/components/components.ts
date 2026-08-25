/**
 * @fileoverview Types pour tous les composants K3UI
 * @description Centralisation de toutes les interfaces d'options des composants
 * @author K3UI Team
 * @version 1.0.0
 */

import { BaseOptions } from '../base/options';
import { PriorityLevel } from '../base/priority';
import type { HapticFeedbackOptions } from '../managers/haptic';
import type {
    ChartTooltipContextItem,
    ComponentAnimationOptions,
    ComponentCustomData,
    ComponentInstanceCallback,
    ComponentInstanceCallbackOptional,
    TableCellValue,
} from './callbacks';
import type { Avatar } from '../../components/Avatar';
import type { SlideshowCaptions } from '../../components/SlideshowCaptions';
import type { Snow } from '../../extensions/effects/snow/Snow';
import type { Table } from '../../components/Table';
import type { Signature } from '../../extensions/generators/signature/Signature';
import type { List } from '../../components/List';
import type { Badge } from '../../components/Badge';
import type { Button } from '../../components/Button';
import type { Checkbox } from '../../components/Checkbox';
import type { Chip } from '../../components/Chip';
import type { ColorPicker } from '../../components/ColorPicker';
import type { Command } from '../../components/Command';
import type { Counter } from '../../components/Counter';
import type { Countdown } from '../../components/Countdown';
import type { Datepicker } from '../../components/Datepicker';
import type { InfiniteScroll } from '../../components/InfiniteScroll';
import type { Pin } from '../../components/Pin';
import type { Autocomplete } from '../../components/Autocomplete';
import type { Select } from '../../components/Select';
import type { Switch } from '../../components/Switch';
import type { Textarea } from '../../components/Textarea';
import type { Timepicker } from '../../components/Timepicker';
import type { Todo } from '../../components/Todo';
import type { NavigationRail } from '../../components/NavigationRail';
import type { NavigationMenu } from '../../components/NavigationMenu';

// ============================================================================
// TYPES COMMUNS POUR LES COMPOSANTS
// ============================================================================

/**
 * Position possible pour les composants
 */
export type ComponentPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

/**
 * Taille possible pour les composants
 */
export type ComponentSize = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Type d'animation possible
 */
export type AnimationType = 'fade' | 'slide' | 'scale' | 'bounce' | 'shake' | 'pulse';

/**
 * Type de transition possible
 */
export type TransitionType = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';

/**
 * Type de couleur possible
 */
export type ColorType = 'primary' | 'secondary' | 'tertiary' | 'error' | 'warning' | 'info' | 'success';

/**
 * Type de variant possible
 */
export type VariantType = 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';

/**
 * Type de variant pour les input fields (Material Design 3)
 */
export type InputFieldVariant = 'outlined' | 'filled' | 'plain';

// ============================================================================
// INTERFACES DES COMPOSANTS
// ============================================================================

/**
 * Variante du dialog selon Material Design 3
 */
export type DialogVariant = 'basic' | 'alert' | 'fullscreen';

/**
 * Schéma d'animation M3 du dialog (12 springs : expressive|standard × spatial|effects × fast|default|slow).
 * - `expressive` : springs Expressives (défaut, overshoot spatial)
 * - `spatial` : springs Standard spatial/effects (mouvement utilitaire, sans bounce Expressif)
 */
export type DialogAnimation = 'expressive' | 'spatial';

/**
 * Options pour le composant Dialog
 */
import type { HapticFeedbackOptions } from '../managers/haptic';

export interface DialogOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * Opacité du scrim (0–1), appliquée via `--dialog-scrim-opacity`
     * @default 0.4
     */
    opacity: number;
    /**
     * Durée de transition d'ouverture en millisecondes (M3 / material-web : 500)
     * @default 500
     */
    inDuration: number;
    /**
     * Durée de transition de fermeture en millisecondes (M3 / material-web : 150)
     * @default 150
     */
    outDuration: number;
    /**
     * Animation M3 : expressive (défaut) ou spatial (springs Standard)
     * @default 'expressive'
     */
    animation: DialogAnimation;
    /**
     * Empêcher le scroll de la page quand le dialog est ouvert
     * @default true
     */
    preventScrolling: boolean;
    /**
     * Permettre de fermer le dialog par clavier ou clic sur l'overlay
     * @default true
     */
    dismissible: boolean;
    /**
     * Intensité de l'effet de flou sur l'overlay en pixels (extension K3UI)
     * @default 10
     */
    blur: number;
    /**
     * Feedback haptique à l'ouverture (appareils compatibles)
     * @default true
     */
    haptic: boolean;
    /**
     * Container Transform M3 (FLIP depuis le trigger d’ouverture).
     * Nécessite un `trigger` passé à {@link open} / {@link Dialog.show}.
     * @default true
     */
    containerTransform: boolean;
    /**
     * Élément déclencheur pour le pattern Container Transform M3 (FLIP à l’ouverture).
     * Consommé par {@link Dialog.show} puis transmis à {@link open}.
     */
    trigger?: HTMLElement;
    /**
     * Variante M3 du dialog
     * @default 'basic'
     */
    variant?: DialogVariant;
    /**
     * Active le défilement du contenu avec zone scrollable MD3
     * @default false
     */
    scrollable?: boolean;
    /**
     * Nom d'icône optionnelle (hero icon, centrée au-dessus du titre)
     */
    icon?: string;
    /**
     * Force le mouvement réduit pour ce dialog (ignore les animations d'ouverture/fermeture).
     * @default false
     */
    reducedMotion?: boolean;
    /**
     * @deprecated Utiliser {@link reducedMotion}
     */
    quick?: boolean;
    /**
     * @deprecated Mode ancré — utiliser Menu/Popover. Sera supprimé dans une future version.
     */
    placement?: 'auto' | 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'right' | 'right-start' | 'right-end' | 'left' | 'left-start' | 'left-end';
    /**
     * @deprecated Voir `placement`. Sera supprimé dans une future version.
     */
    cover?: boolean;
    /**
     * @deprecated Voir `placement`. Sera supprimé dans une future version.
     */
    anchor?: HTMLElement;
}

/**
 * Élément de commande pour la palette Command (MD3)
 */
export interface CommandItem {
    /** Identifiant unique */
    id: string;
    /** Libellé affiché */
    name: string;
    /** Description secondaire optionnelle */
    description?: string;
    /** Nom de l’icône Material (ex. search, home) */
    icon?: string;
    /** Raccourci clavier affiché (ex. "⌘ K") */
    shortcut?: string;
    /** Groupe pour le regroupement (clé dans groups) */
    group: string;
    /** Action au déclenchement */
    action?: () => void;
}

/**
 * Groupe de commandes pour la palette Command (MD3)
 */
export interface CommandGroupDefinition {
    /** Identifiant du groupe */
    id: string;
    /** Libellé affiché */
    label: string;
    /** Nom de l’icône Material */
    icon?: string;
}

/**
 * Options pour le composant Command (palette de commandes MD3 Expressive)
 */
export interface CommandOptions extends BaseOptions {
    /**
     * Liste des commandes
     * @default []
     */
    commands: CommandItem[];
    /**
     * Groupes (id → label, icon)
     * @default {}
     */
    groups?: Record<string, Omit<CommandGroupDefinition, 'id'>>;
    /**
     * Ordre des groupes (ids)
     * @default []
     */
    groupOrder?: string[];
    /**
     * Sélecteur du déclencheur (bouton ou élément cliquable)
     * @default null
     */
    triggerSelector?: string | null;
    /**
     * Raccourci clavier global (ex. "ctrl+k", "meta+k", "ctrl+alt+t")
     * @default "ctrl+k"
     */
    shortcutKey?: string;
    /**
     * Afficher les en-têtes de groupe
     * @default true
     */
    showGroups?: boolean;
    /**
     * Afficher les icônes des commandes
     * @default true
     */
    showIcons?: boolean;
    /**
     * Afficher les descriptions
     * @default true
     */
    showDescriptions?: boolean;
    /**
     * Afficher les raccourcis clavier
     * @default true
     */
    showShortcuts?: boolean;
    /**
     * Taille de la palette: compact | default | expanded
     * @default "default"
     */
    size?: 'compact' | 'default' | 'expanded';
    /**
     * Callback appelé au début de l'ouverture
     */
    onOpenStart?: ((el: HTMLElement) => void) | null;
    /**
     * Callback appelé après l'ouverture
     */
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    /**
     * Callback appelé au début de la fermeture
     */
    onCloseStart?: ((el: HTMLElement) => void) | null;
    /**
     * Callback appelé après la fermeture
     */
    onCloseEnd?: ((el: HTMLElement) => void) | null;
    /**
     * Callback appelé lorsqu'une commande est sélectionnée
     */
    onCommandSelect?: ((item: CommandItem) => void) | null;
    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel?: PriorityLevel;
}

/**
 * Options pour le composant Snackbar
 */
export type SnackbarPosition =
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
    | 'top-left'
    | 'top-center'
    | 'top-right';

export interface SnackbarOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * The message text to display in the snackbar.
     */
    text: string;

    /**
     * Type of snackbar (default, success, error, warning, info)
     * @default "default"
     */
    type?: 'default' | 'success' | 'error' | 'warning' | 'info';

    /**
     * Action button text. If provided, an action button will be shown.
     */
    actionText?: string;

    /**
     * Callback function for the action button.
     */
    actionCallback?: (() => void) | null;

    /**
     * Duration in milliseconds to display the snackbar.
     * @default 4000
     */
    duration: number;

    /**
     * CSS classes to add to the snackbar element.
     * @default ""
     */
    classes: string;

    /**
     * Whether to show the snackbar immediately or wait for the next frame.
     * @default false
     */
    showImmediately: boolean;

    showClose?: boolean;
    isLongAction?: boolean;
    maxCharsPerLine?: number;
    persistent?: boolean;
    autoFocus?: boolean;
    onAction?: (() => void) | null;
    onClose?: ComponentInstanceCallbackOptional | null;

    /**
     * Priority level for instance management
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;

    /**
     * Position à l'écran
     * @default "bottom-center"
     */
    position?: SnackbarPosition;

    /**
     * Nombre maximum de snackbars visibles simultanément
     * @default 3
     */
    maxSnackbars?: number;
}

/**
 * Placement du toast (pile).
 */
export type ToastPosition =
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
    | 'top-left'
    | 'top-center'
    | 'top-right';

/**
 * Priorité ARIA du toast.
 * - foreground: assertive
 * - background: polite
 */
export type ToastPriority = 'foreground' | 'background';

/**
 * Comportement au survol.
 * - pause: met en pause ce toast
 * - pause-all: met en pause tous les toasts de la même position
 * - null: aucun comportement
 */
export type ToastHoverBehavior = 'pause' | 'pause-all' | null;

/**
 * Variantes visuelles (couleur/ton).
 */
export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

/**
 * Forme du toast (coins).
 */
export type ToastShape = 'default' | 'square' | 'pill';

/**
 * Style d'affichage du timer auto-close.
 * - bar: barre pill en bas du toast
 * - overlay: remplissage plein fond sous le contenu
 */
export type ToastTimerStyle = 'bar' | 'overlay';

/**
 * Thème des icônes par défaut.
 */
export interface ToastIconTheme {
    primary?: string;
    secondary?: string;
}

/**
 * Contexte passé aux renderers custom.
 */
export interface ToastRenderContext {
    id: string;
    visible: boolean;
    dismiss: () => void;
    update: (data: ToastUpdatePayload) => void;
}

/**
 * Entrée API toast (message simple ou options complètes).
 */
export type ToastInput = string | Partial<ToastOptions>;

/**
 * Payload de mise à jour d'un toast existant.
 */
export type ToastUpdatePayload = Partial<
    Pick<
        ToastOptions,
        'title' | 'description' | 'variant' | 'actionText' | 'icon' | 'showIcon' | 'showProgressBar' | 'timerStyle'
    >
>;

/**
 * Messages pour l'API promise.
 */
export interface ToastPromiseMessages<T = unknown> {
    loading?: ToastInput;
    success?: ToastInput | ((data: T) => ToastInput);
    error?: ToastInput | ((err: unknown) => ToastInput);
}

/**
 * Options pour le composant Toast
 */
export interface ToastOptions extends BaseOptions {
    /** Identifiant unique (pour update/dismiss ciblé) */
    id?: string;
    /** Titre optionnel (ligne courte) */
    title?: string;
    /** Description / message */
    description?: string;
    /** Variante visuelle */
    variant?: ToastVariant;
    /** Icône (nom "classic" via <i name="...">). null = auto selon variant */
    icon?: string | null;
    /** Afficher l’icône */
    showIcon?: boolean;
    /** Afficher la barre de progression (auto-close uniquement) */
    showProgressBar?: boolean;
    /** Style du timer : barre basse ou overlay plein fond */
    timerStyle?: ToastTimerStyle;
    /** Type (foreground/background) */
    type?: ToastPriority;
    /** Délai avant fermeture automatique (ms). 0 = persistant */
    closeDelay?: number;
    /** Alias de closeDelay (compat solid-toast) */
    duration?: number;
    /** Délai avant retrait DOM après animation de sortie (ms) */
    unmountDelay?: number;
    /** Comportement au survol */
    hover?: ToastHoverBehavior;
    /** Position du toaster */
    position?: ToastPosition;
    /** Afficher un bouton de fermeture */
    showClose?: boolean;
    /** Texte du bouton d’action */
    actionText?: string;
    /** Callback action */
    onAction?: (() => void) | null;
    /** Classes additionnelles (legacy) */
    classes?: string;
    /** Classe CSS additionnelle sur le conteneur */
    className?: string;
    /** Styles inline sur la surface */
    style?: Record<string, string>;
    /** Forme des coins */
    shape?: ToastShape;
    /** Thème icône */
    iconTheme?: ToastIconTheme;
    /** Espacement entre toasts (px) — gutter solid-toast */
    gutter?: number;
    /** Autoriser titre + description multi-lignes */
    multiline?: boolean;
    /** Contenu HTML/élément custom */
    content?: string | HTMLElement;
    /** Renderer custom (prioritaire sur le template par défaut) */
    customRenderer?: (ctx: ToastRenderContext) => HTMLElement | string;
    /** Affichage immédiat (sans attendre un frame) */
    showImmediately?: boolean;
    /** Niveau de priorité */
    priorityLevel?: PriorityLevel;
}

/**
 * Côté d'ancrage du tooltip
 */
export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

/**
 * Alignement du tooltip sur l'axe perpendiculaire au côté
 */
export type TooltipAlign = 'start' | 'center' | 'end';

/**
 * Placement du tooltip (12 ancrages M3)
 */
export type TooltipPlacement =
    | 'top' | 'top-start' | 'top-end'
    | 'bottom' | 'bottom-start' | 'bottom-end'
    | 'left' | 'left-start' | 'left-end'
    | 'right' | 'right-start' | 'right-end';

/**
 * Déclencheur d'affichage du tooltip
 */
export type TooltipTrigger = 'hover' | 'click' | 'focus';

/**
 * Type visuel du tooltip (couleur)
 */
export type TooltipType = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Mode d'affichage du tooltip (plain = une ligne, rich = titre + corps M3)
 */
export type TooltipMode = 'plain' | 'rich';

/**
 * Schéma motion M3 du tooltip
 */
export type TooltipMotionScheme = 'standard' | 'expressive';

/**
 * Vitesse motion M3 du tooltip
 */
export type TooltipMotionSpeed = 'fast' | 'default' | 'slow';

/**
 * Surface minimale passée aux callbacks d'action tooltip rich
 */
export interface TooltipActionTarget {
    /** Ferme le tooltip */
    close(): void;
    /** Ouvre le tooltip */
    open(): void;
}

/**
 * Action bouton dans un tooltip rich interactif (M3)
 */
export interface TooltipAction {
    /** Libellé du bouton */
    label: string;
    /** Variante visuelle M3 */
    variant?: 'filled' | 'text';
    /** Gestionnaire de clic */
    onClick?: (tooltip: TooltipActionTarget) => void;
    /** Fermer le tooltip après le clic (défaut true) */
    dismissOnClick?: boolean;
}

/**
 * Options pour le composant Tooltips
 */
import type { HapticFeedbackOptions } from '../managers/haptic';

export interface TooltipsOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * Contenu du tooltip (surcharge data-tooltip si défini)
     * @default ""
     */
    content: string;

    /**
     * Type visuel (default, primary, info, success, warning, danger)
     * @default "default"
     */
    type: TooltipType;

    /**
     * Mode plain (texte court) ou rich (titre + texte de support, M3)
     * @default "plain"
     */
    mode: TooltipMode;

    /**
     * Titre du tooltip en mode rich
     * @default ""
     */
    title: string;

    /**
     * Corps du tooltip en mode rich (surcharge data-tooltip-body)
     * @default ""
     */
    body: string;

    /**
     * Boutons d'action en mode rich interactif (role dialog M3).
     * Si omis, les boutons M3 par défaut (Ignorer / OK) sont affichés en mode rich.
     * Passer un tableau vide pour désactiver les boutons.
     */
    actions?: TooltipAction[];

    /**
     * Afficher les boutons d'action M3 par défaut en mode rich
     * @default true
     */
    richActions: boolean;

    /**
     * Schéma motion M3 : expressive (bounce) ou standard
     * @default "expressive"
     */
    motion: TooltipMotionScheme;

    /**
     * Vitesse motion M3
     * @default "default"
     */
    motionSpeed: TooltipMotionSpeed;

    /**
     * Délai auto-dismiss des tooltips plain / rich non interactifs (ms, spec M3 = 1500)
     * @default 1500
     */
    plainDismissDelay: number;

    /**
     * Couleur de fond personnalisée (surcharge type si défini)
     */
    color?: string;

    /**
     * Couleur du texte personnalisée
     */
    textColor?: string;

    /**
     * Placement préféré (Floating UI)
     * @default "bottom"
     */
    placement: TooltipPlacement;

    /**
     * Déclencheur : hover, click ou focus
     * @default "hover"
     */
    trigger: TooltipTrigger;

    /**
     * Décalage en pixels (distance référence / tooltip)
     * @default 10
     */
    offset: number;

    /**
     * Fermer au clic sur la référence (quand trigger === 'click')
     * @default true
     */
    closeOnClickReference: boolean;

    /**
     * Fermer avec la touche Escape
     * @default true
     */
    closeOnKeyEscape: boolean;

    /**
     * Désactiver le tooltip
     * @default false
     */
    disabled: boolean;

    /**
     * Délai avant affichage (ms) — hover/focus
     * @default 0
     */
    showDelay: number;

    /**
     * Délai avant masquage (ms) — hover
     * @default 100
     */
    hideDelay: number;

    /**
     * Callback appelé au début de l'ouverture
     */
    onOpenStart: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé à la fin de l'ouverture
     */
    onOpenEnd: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé au début de la fermeture
     */
    onCloseStart: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé à la fin de la fermeture
     */
    onCloseEnd: ((el: HTMLElement) => void) | null;
}

/**
 * Options pour le composant Avatar
 */
export interface AvatarOptions extends BaseOptions {
    /**
     * Taille de l'avatar
     * @default 'lg'
     */
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

    /**
     * Variant de l'avatar
     * @default 'filled'
     */
    variant: 'filled' | 'outlined' | 'elevated';

    /**
     * Forme de l'avatar
     * @default 'circle'
     */
    shape: 'circle' | 'rounded' | 'square';

    /**
     * Nom de l'avatar (utilisé pour les initiales)
     * @default ''
     */
    name: string;

    /**
     * URL de l'image de l'avatar
     * @default ''
     */
    imageUrl: string;

    /**
     * Palette de couleurs de l'avatar
     * @default 'blue'
     */
    colorPalette: 'blue' | 'red' | 'green' | 'purple' | 'orange' | 'gray';

    /**
     * Badge de statut de l'avatar
     * @default null
     */
    badge: 'online' | 'offline' | 'idle' | 'dnd' | 'busy' | 'away' | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Type pour les placements de menu
 */
export type MenuPlacement =
    | 'auto'
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'left'
    | 'left-start'
    | 'left-end';

/**
 * Options pour le composant Menu
 */
export interface MenuOptions extends BaseOptions, HapticFeedbackOptions {
    /** Items du menu */
    items: MenuItem[];
    /** Placement du menu ('auto' détecte automatiquement) */
    placement?: MenuPlacement;
    /** Alias historique de placement */
    position?: MenuPlacement;
    /** Si le menu recouvre le trigger (même position X/Y) */
    cover?: boolean;
    /** Alignement du sous-menu ('auto' détecte automatiquement) */
    submenuAlignment?: 'auto' | 'left' | 'right';
    /** Position du sous-menu ('auto' détecte automatiquement) */
    submenuPosition?: 'auto' | 'left' | 'right';
    /** Fermer le menu au clic sur un item */
    closeOnClick?: boolean;
    /**
     * Si true (défaut), un clic / clavier sur le trigger ouvre/ferme le menu.
     * Passer false quand un hôte (Select, Autocomplete) pilote l’ouverture
     * pour éviter le double basculement (ex. openOnFocus puis clic → fermeture).
     */
    triggerToggle?: boolean;
    /**
     * Si true (défaut), `close()` remet le focus sur le trigger.
     * Passer false quand l’hôte gère le focus (ex. input Autocomplete).
     */
    restoreFocus?: boolean;
    /** Activer les animations */
    enableAnimations?: boolean;
    /** Durée de l'animation d'ouverture en millisecondes */
    inDuration?: number;
    /** Durée de l'animation de fermeture en millisecondes */
    outDuration?: number;
    /** Callback appelé au clic sur un item */
    onItemClick?: (item: MenuItem, menuId: string) => void;
    /** Niveau de priorité pour la gestion des instances */
    priorityLevel: PriorityLevel;

    // Options du menu
    /** Définit le bord auquel le menu est aligné */
    alignment?: 'left' | 'right';
    /** Si true, le menu couvre le trigger au lieu de s'aligner à son bord */
    coverTrigger?: boolean;
    /** Constraint le menu à rester dans la fenêtre */
    constrainWidth?: boolean;
    /** Conteneur pour le menu */
    container?: HTMLElement | null;
    /** Si true, le premier item reçoit le focus automatiquement */
    autoFocus?: boolean;
    /** Élément menu existant (pour compatibilité avec Select) */
    menuEl?: HTMLElement;
    /** Mode hover pour ouvrir au survol */
    hover?: boolean;
}

/**
 * Options pour le composant MenuContext (menu au clic droit via Menu)
 */
export interface MenuContextOptions extends BaseOptions {
    /**
     * Items du menu (réutilise MenuItem)
     * @default []
     */
    items: MenuItem[];

    /**
     * Portée d’écoute du clic droit : élément hôte ou document entier
     * @default 'document'
     */
    scope: 'element' | 'document';

    /**
     * Empêche le menu contextuel natif du navigateur
     * @default true
     */
    preventDefault: boolean;

    /**
     * Laisse le menu natif sur champs éditables (input, textarea, contenteditable)
     * @default true
     */
    allowNativeOnEditable: boolean;

    /**
     * Sélecteur CSS : zones où le menu contextuel K3UI ne s’ouvre pas
     * @default null
     */
    excludeSelector: string | null;

    /**
     * Active / désactive le gestionnaire de clic droit
     * @default true
     */
    enabled: boolean;

    /**
     * Placement Floating UI du Menu sous-jacent
     * @default 'bottom-start'
     */
    placement: MenuPlacement;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;

    /**
     * Callback appelé au clic sur un item
     */
    onItemClick?: ((item: MenuItem, menuId: string) => void) | null;
}

/**
 * Item de menu
 */
export interface MenuItem {
    /** Texte de l'item (alias pour label) */
    text?: string;
    /** Label de l'item */
    label?: string;
    /** Icône de l'item (optionnel) */
    icon?: string;
    /** ID unique de l'item */
    id?: string;
    /** Valeur associée (ex. options Select) */
    value?: string;
    /** Si l'item est désactivé */
    disabled?: boolean;
    /** Si l'item est un séparateur */
    divider?: boolean;
    /** Type de l'item (pour les dividers) */
    type?: 'divider';
    /** Style de séparateur (`gap` = îlot M3, `line` = trait) */
    dividerType?: 'gap' | 'line' | string;
    /** Sous-menu (optionnel) - alias pour items */
    submenu?: MenuItem[];
    /** Items du sous-menu (optionnel) */
    items?: MenuItem[];
    /** Si l'item a un sous-menu */
    hasSubmenu?: boolean;
    /** Icône trailing (optionnel) */
    trailingIcon?: string;
    /** Texte trailing (optionnel) */
    trailingText?: string;
    /** Si l'item a un gap (espacement visible de type "îlot" Material Design 3) */
    gap?: boolean;
    /** Callback appelé au clic */
    callback?: (event: MouseEvent, item: MenuItem) => void;
    /** Classes CSS personnalisées */
    classes?: string;
}

/**
 * Options pour le composant Select
 */
/**
 * Mode de filtrage Autocomplete (aligné M3E)
 */
export type AutocompleteFilterMode = 'contains' | 'starts-with' | 'ends-with' | 'none';

/**
 * Option Autocomplete (données)
 */
export interface AutocompleteOptionData {
    /** Valeur commitée */
    value: string;
    /** Libellé affiché */
    label: string;
    /** Désactivée */
    disabled?: boolean;
}

/**
 * Options pour le composant Autocomplete
 */
export interface AutocompleteOptions extends BaseOptions {
    /**
     * Mode de filtrage ou callback personnalisé
     * @default 'contains'
     */
    filter: AutocompleteFilterMode | ((option: AutocompleteOptionData, term: string) => boolean);

    /**
     * Filtrage sensible à la casse
     * @default false
     */
    caseSensitive: boolean;

    /**
     * Active automatiquement la première option visible
     * @default false
     */
    autoActivate: boolean;

    /**
     * Oblige une sélection parmi les options (sinon reset au blur)
     * @default false
     */
    required: boolean;

    /**
     * Masque le panneau lorsqu'aucune option ne correspond
     * @default false
     */
    hideNoData: boolean;

    /**
     * Masque le panneau pendant le chargement
     * @default false
     */
    hideLoading: boolean;

    /**
     * État de chargement (lazy / async)
     * @default false
     */
    loading: boolean;

    /**
     * Ferme le panneau après sélection
     * @default true
     */
    closeOnSelect: boolean;

    /**
     * Ouvre le panneau au focus de l'input
     * @default true
     */
    openOnFocus: boolean;

    /**
     * Classes CSS additionnelles sur le panneau
     * @default ''
     */
    panelClass: string;

    /**
     * Id de l'input cible (`for` / `data-for`)
     * @default null
     */
    for: string | null;

    /**
     * Options fournies en JS (sinon lues depuis le DOM)
     * @default null
     */
    options: AutocompleteOptionData[] | null;

    /**
     * Surligne le terme correspondant dans les options
     * @default true
     */
    highlightMatches: boolean;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;

    /**
     * Callback avant ouverture du panneau
     */
    onOpenStart: ((instance: Autocomplete) => void) | null;

    /**
     * Callback après ouverture du panneau
     */
    onOpenEnd: ((instance: Autocomplete) => void) | null;

    /**
     * Callback avant fermeture du panneau
     */
    onCloseStart: ((instance: Autocomplete) => void) | null;

    /**
     * Callback après fermeture du panneau
     */
    onCloseEnd: ((instance: Autocomplete) => void) | null;

    /**
     * Callback lorsque la requête change (focus / saisie)
     */
    onQuery: ((term: string, instance: Autocomplete) => void) | null;

    /**
     * Callback lorsque la valeur commitée change
     */
    onChange: ((value: string | null, label: string | null, instance: Autocomplete) => void) | null;

    /**
     * Callback lors de la sélection d'une option
     */
    onSelect: ((option: AutocompleteOptionData, instance: Autocomplete) => void) | null;
}

export interface SelectOptions extends BaseOptions {
    /**
         * Variant du select : 'filled' ou 'outlined'
         * @default 'outlined'
     */
    variant?: 'filled' | 'outlined';

    /**
     * Si true, le select est désactivé
     * @default false
     */
    disabled?: boolean;

    /**
     * Valeur sélectionnée par défaut
     * @default null
     */
    selectedValue?: string | null;

    /**
     * Options du menu
     */
    menuOptions?: {
        /**
         * Si true, le menu couvre le trigger
         * @default false
         */
        coverTrigger?: boolean;
        /**
         * Si true, le menu se ferme au clic
         * @default true
         */
        closeOnClick?: boolean;
        /**
         * Durée d'animation d'ouverture
         * @default 300
         */
        inDuration?: number;
        /**
         * Durée d'animation de fermeture
         * @default 225
         */
        outDuration?: number;
        onItemClick?: (item: MenuItem, menuId: string) => void;
    };

    /**
     * Callback appelé lors du changement de valeur
     */
    onSelect?: ((value: string, text: string, instance: Select) => void) | null;

    /**
     * Callback appelé lors de la sélection d'une option
     */
    onOptionSelect?: ((el: HTMLSelectElement, value: string) => void) | null;

    /**
     * Icône leading pour le select
     */
    leadingIcon?: string | null;

    /**
     * Classes CSS personnalisées
     */
    classes?: string;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Drawer
 */
export interface DrawerOptions extends BaseOptions {
    /**
     * Côté de l'écran depuis lequel le Drawer apparaît (navigation drawer M3).
     * Drawer gère uniquement left / right. Pour top / bottom, utiliser Sheet.
     * @default 'left'
     */
    edge: 'left' | 'right';

    /**
     * Si true, le Drawer peut être glissé pour s'ouvrir/fermer.
     * @default true
     */
    draggable: boolean;

    /**
     * Durée de l'animation d'ouverture en millisecondes.
     * @default 250
     */
    inDuration: number;

    /**
     * Durée de l'animation de fermeture en millisecondes.
     * @default 200
     */
    outDuration: number;

    /**
     * Si true, le Drawer se ferme automatiquement lors du clic sur l'overlay.
     * @default true
     */
    dismissible: boolean;

    /**
     * Si true, empêche le scroll de la page quand le Drawer est ouvert.
     * @default true
     */
    preventScrolling: boolean;

    /**
     * Si true, le Drawer est ouvert par défaut.
     * @default false
     */
    open: boolean;

    /**
     * Largeur du Drawer en pixels ou en pourcentage.
     * @default '280px'
     */
    width: string | number;

    /**
     * Si true, le Drawer est en mode modal (avec overlay).
     * @default true
     */
    modal: boolean;

    /**
     * Opacité de l'overlay (0.0 à 1.0). Aligné scrim M3 (32 %).
     * @default 0.32
     */
    overlayOpacity: number;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;

    /**
     * Largeur de la zone de glissement (poignée) pour ouvrir/fermer au toucher.
     * @default '10px'
     */
    dragTargetWidth?: string;
}

/**
 * Options pour le composant Sheet
 */
export interface SheetOptions extends BaseOptions {
    /**
     * Position du sheet (bottom / top sheet M3).
     * Sheet gère uniquement top / bottom. Pour left / right, utiliser Drawer.
     * @default 'bottom'
     */
    type: 'top' | 'bottom';

    /**
     * Position du sheet (alias pour type)
     * @default 'bottom'
     */
    position: 'top' | 'bottom';

    /**
     * Taille du sheet (M3 Expressive) — détente initiale (peek / half / large / full).
     * Largeur : 100% compact, plafond 640 dp medium+.
     * @default 'medium'
     */
    size: 'small' | 'medium' | 'large' | 'half' | 'full';

    /**
     * Si true, la feuille occupe toute la largeur (ignore le plafond M3 640 dp).
     * Classe CSS : `sheet--full-width` — attribut HTML : `full-width`.
     * @default false
     */
    fullWidth: boolean;

    /**
     * Si true, le sheet est ouvert par défaut
     * @default false
     */
    open: boolean;

    /**
     * Si true, le sheet peut être fermé en cliquant sur l'overlay
     * @default true
     */
    dismissible: boolean;

    /**
     * Si true, empêche le scroll de la page quand le sheet est ouvert
     * @default true
     */
    preventScrolling: boolean;

    /**
     * Affiche la bordure bas du header (et l’outline si `sheet--outlined` côté markup).
     * @default false
     */
    border: boolean;

    /**
     * Durée de l'animation d'ouverture en millisecondes
     * @default 300
     */
    inDuration: number;

    /**
     * Durée de l'animation de fermeture en millisecondes
     * @default 250
     */
    outDuration: number;

    /**
     * Opacité de l'overlay (0.0 à 1.0)
     * @default 0.32
     */
    overlayOpacity: number;
    opacity?: number;

    /**
     * Intensité de l'effet de flou sur l'overlay en pixels
     * @default 4
     */
    blur: number;
    draggable?: boolean;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Card
 */
export interface CardOptions extends BaseOptions {
    /**
     * Variante de la carte
     * @default 'elevated'
     */
    variant: CardVariant;

    /**
     * Taille de la carte
     * @default 'medium'
     */
    size: CardSize;

    /**
     * Si true, la carte est cliquable
     * @default false
     */
    clickable?: boolean;

    /**
     * Si true, la carte est sélectionnable
     * @default false
     */
    selectable?: boolean;

    /**
     * Si true, la carte est sélectionnée
     * @default false
     */
    selected?: boolean;

    /**
     * Données de la carte
     * @default null
     */
    data?: CardData | null;

    /**
     * Si true, la carte est interactive (cliquable, focusable)
     * @default false
     */
    interactive: boolean;

    /**
     * Forme expressive M3
     * @default 'medium'
     */
    shape?: CardShape;

    /**
     * Si true, la carte peut être cochée (état selected)
     * @default false
     */
    checkable?: boolean;

    /**
     * Si true, autorise le HTML dans le contenu
     * @default false
     */
    allowHTML?: boolean;

    /**
     * Active l'effet ripple sur carte interactive
     * @default true
     */
    ripple?: boolean;

    elevation?: number;
    radius?: string;
    horizontalActions?: boolean;
    verticalActions?: boolean;
    fullWidth?: boolean;
    height?: string | number | null;
    width?: string | number | null;

    /**
     * Callback appelé lors du clic sur la carte
     * @param el Élément DOM de la carte
     * @param data Données de la carte
     */
    onClick?: (el: HTMLElement, data: CardData) => void;

    /**
     * Callback appelé lors du clic sur une action
     * @param el Élément DOM de la carte
     * @param action Action cliquée
     * @param data Données de la carte
     */
    onActionClick?: (el: HTMLElement, action: CardAction, data: CardData) => void;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel?: PriorityLevel;
}

/**
 * Variants de carte disponibles
 */
export type CardVariant = 'elevated' | 'filled' | 'outlined';

/**
 * Tailles de carte disponibles
 */
export type CardSize = 'small' | 'medium' | 'large';

/**
 * Formes M3 Expressive pour les cartes
 */
export type CardShape = 'medium' | 'largeIncreased' | 'extraLargeIncreased';

/**
 * Action de carte
 */
export interface CardAction {
    /** Identifiant de l'action */
    id?: string;
    /** Texte de l'action */
    text: string;
    /** Type d'action */
    type?: 'button' | 'icon' | 'link' | 'toggle';
    /** Icône de l'action (optionnel) */
    icon?: string;
}

/**
 * Données de carte
 */
export interface CardData {
    /** Identifiant de la carte */
    id?: number | string;
    /** Titre de la carte */
    title?: string;
    /** Sous-titre de la carte */
    subtitle?: string;
    /** Contenu de la carte (HTML) */
    content?: string;
    /** Image de la carte */
    image?: string;
    /** Actions de la carte */
    actions?: CardAction[];
}

/**
 * Options pour le composant Chip
 */
export interface ChipOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * Données des chips à afficher
     * @default []
     */
    data: ChipData[];

    /**
     * Variant du composant chip (input, filter, choice, etc.)
     * @default 'input'
     */
    variant?: 'input' | 'filter' | 'choice' | 'action';

    /**
     * Taille des chips
     * @default 'medium'
     */
    size: ChipSize;

    /**
     * Si true, les chips peuvent être supprimés
     * @default false
     */
    removable: boolean;

    /**
     * Si true, les chips sont sélectionnables
     * @default false
     */
    selectable: boolean;

    /**
     * Si true, les chips sont en mode multi-sélection
     * @default false
     */
    multiSelect: boolean;

    /**
     * Placeholder pour le champ de saisie
     * @default ''
     */
    placeholder?: string;

    /**
     * Placeholder secondaire (quand il y a des chips)
     * @default ''
     */
    secondaryPlaceholder?: string;

    /**
     * Limite du nombre de chips
     * @default null
     */
    limit?: number | null;

    /**
     * Si true, permet la saisie utilisateur
     * @default true
     */
    allowUserInput?: boolean;

    /**
     * Classe CSS pour l'icône de fermeture
     * @default 'icon-close'
     */
    closeIconClass?: string;

    /**
     * Callback appelé lors du clic sur un chip
     */
    onChipClick?: ((el: HTMLElement, chipElement: HTMLElement, chip: ChipData) => void) | null;

    /**
     * Callback appelé lors de la sélection d'un chip (alias pour onSelect)
     */
    onChipSelect?: ((el: HTMLElement, chipElement: HTMLElement, chip: ChipData) => void) | null;

    /**
     * Callback appelé lors de l'ajout d'un chip
     */
    onChipAdd?: ((chip: ChipData, instance: Chip) => void) | null;

    /**
     * Callback appelé lors de la suppression d'un chip
     */
    onRemove?: ((chip: ChipData, instance: Chip) => void) | null;

    /**
     * Callback appelé lors de la suppression d'un chip (alias pour onRemove)
     */
    onChipDelete?: ((el: HTMLElement, chipElement: HTMLElement, chip: ChipData) => void) | null;

    /**
     * Callback appelé lors de la sélection d'un chip
     */
    onSelect?: ((chip: ChipData, instance: Chip) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Données d'un chip
 */
export interface ChipData {
    /** Texte du chip */
    text: string;
    /** Icône du chip (optionnel) */
    icon?: string;
    /** Image du chip (optionnel) */
    image?: string;
    /** Si le chip est sélectionné */
    selected?: boolean;
    /** Si le chip est désactivé */
    disabled?: boolean;
    /** ID unique du chip */
    id?: string;
    /** Données personnalisées */
    data?: ComponentCustomData;
}

/**
 * Tailles de chip disponibles
 */
export type ChipSize = 'small' | 'medium' | 'large';

/**
 * Options pour le composant Forms
 */
export interface FormsOptions extends BaseOptions {
    /**
     * Active la validation en temps réel
     * @default true
     */
    realTimeValidation: boolean;

    /**
     * Active la validation au blur
     * @default true
     */
    validateOnBlur: boolean;

    /**
     * Active la validation au submit
     * @default true
     */
    validateOnSubmit: boolean;

    /**
     * Messages d'erreur personnalisés
     */
    errorMessages?: Record<string, string>;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}


/**
 * Section du sommaire ScrollSpy
 */
export interface ScrollSpySection {
    /** Identifiant de la section (id du heading) */
    id: string;
    /** Libellé affiché dans le sommaire */
    label: string;
    /** Niveau de titre (h2 ou h3) */
    level?: 2 | 3;
}

/**
 * Options pour le composant ScrollSpy (sommaire « Sur cette page »)
 */
export interface ScrollSpyOptions extends BaseOptions {
    /**
     * Sections du sommaire ; si absent, auto-génération depuis les headings
     */
    sections?: ScrollSpySection[];
    /**
     * Sélecteur racine du contenu à scanner
     * @default 'main, [data-scrollspy-content]'
     */
    selector: string;
    /**
     * Sélecteur des titres à inclure
     * @default 'h2'
     */
    headings: string;
    /**
     * Titre affiché au-dessus de la liste
     */
    title?: string;
    /**
     * Overline au-dessus du titre
     * @default i18n scrollspy.onThisPage
     */
    overline?: string;
    /**
     * Marge haute pour considérer une section active (px)
     * @default 96
     */
    offset: number;
    /**
     * Conteneur scrollable ; null = document/window
     * @default null
     */
    scrollRoot: string | HTMLElement | null;
    /**
     * Afficher l'indicateur de progression de lecture
     * @default false
     */
    progress: boolean;
    /**
     * Breakpoint mobile (px) sous lequel ScrollSpy devient un drawer
     * @default 960
     */
    mobileBreakpoint: number;
    /**
     * Ancrage desktop via position fixed au scroll ; false = sticky CSS natif (colonne sidebar)
     * @default true
     */
    pinDesktop: boolean;
    /**
     * Activer la première section au chargement (sans hash) ; false = aucun item actif tant que l'utilisateur n'a pas scrollé ou cliqué
     * @default true
     */
    autoActivateInitial: boolean;
    /**
     * Callback lors de la sélection d'une section
     */
    onSelect: ((id: string) => void) | null;
    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Moteur de parallaxe : simpleParallax.js, classique (PixelCog), pointeur/gyro ou auto.
 */
export type ParallaxEngine = 'auto' | 'simple' | 'classic' | 'pointer';

/**
 * Axes réactifs (moteur pointer, et scroll horizontal/vertical du moteur classic).
 */
export type ParallaxAxis = 'x' | 'y' | 'both';

/**
 * Orientation du déplacement (simpleParallax.js).
 */
export type ParallaxOrientation =
    | 'up'
    | 'right'
    | 'down'
    | 'left'
    | 'up left'
    | 'up right'
    | 'down left'
    | 'down right';

/**
 * Options pour le composant Parallax (simpleParallax.js + repli classique PixelCog + pointeur)
 */
export interface ParallaxOptions extends BaseOptions {
    /**
     * Moteur : `simple` (simpleParallax.js sur img/vidéo), `classic` (parallax.js PixelCog),
     * `pointer` (calques `data-depth` au pointeur / gyroscope),
     * `auto` : pointer si calques depth, sinon simple si média, sinon classic.
     * @default 'auto'
     */
    engine: ParallaxEngine;
    /**
     * Axes actifs : `y` (scroll vertical / pointeur Y), `x` (horizontal), `both`.
     * @default 'y' (classic/simple) — le moteur `pointer` utilise `both` si non surchargé via data-axis
     */
    axis: ParallaxAxis;
    /**
     * Coefficient PixelCog (moteur classic) : le fond se déplace à `speed` × la vitesse du scroll ;
     * en moteur simple, sert de repli pour dériver `scale` si non défini.
     * @default 0.2
     */
    speed: number;
    /**
     * Marge supplémentaire en px autour du bloc (équivalent `bleed` de parallax.js).
     * @default 0
     */
    bleed: number;
    /**
     * URL de l’image : insertion d’une balise img pour des dimensions naturelles (recommandé).
     * Vide si fond défini uniquement en CSS.
     * @default ''
     */
    image: string;
    /**
     * URL vidéo optionnelle (moteur simple) : insère un élément video si absent.
     * @default ''
     */
    video: string;
    /**
     * Intensité du parallaxe simpleParallax (doit être > 1).
     * @default 1.5
     */
    scale: number;
    /**
     * Direction du déplacement (simpleParallax).
     * @default 'up'
     */
    orientation: ParallaxOrientation;
    /**
     * Autorise le débordement du média hors du conteneur (simpleParallax).
     * @default false
     */
    overflow: boolean;
    /**
     * Délai de transition après scroll en secondes (simpleParallax).
     * @default 0.4
     */
    delay: number;
    /**
     * Courbe CSS de transition liée au délai (simpleParallax).
     * @default 'cubic-bezier(0,0,0,1)'
     */
    transition: string;
    /**
     * Limite l’amplitude du parallaxe en % de la fenêtre (1–99, 0 = illimité).
     * @default 0
     */
    maxTransition: number;
    /**
     * Sans `image` : ratio de repli pour le calcul (hauteur du calque = hauteur boîte × ce facteur).
     * @default 1.5
     */
    imageHeight: number;
    /**
     * Conteneur de scroll (fenêtre si absent). Sélecteur CSS ou HTMLElement.
     */
    scrollContainer?: string | HTMLElement;
    /**
     * Désactive le déplacement si prefers-reduced-motion: reduce.
     * @default true
     */
    respectReducedMotion: boolean;
    /**
     * Sélecteur des calques (moteur pointer). Défaut : éléments avec data-depth.
     * @default '[data-depth],[data-depth-x],[data-depth-y]'
     */
    depthSelector: string;
    /**
     * Entrée pointeur relative à la scène (true) ou à la fenêtre (false). Moteur pointer.
     * @default true
     */
    relativeInput: boolean;
    /**
     * Borne l’entrée relative aux limites de la scène. Moteur pointer.
     * @default true
     */
    clipRelativeInput: boolean;
    /**
     * Ne réagit qu’au survol de la scène (sinon suit le document). Moteur pointer.
     * @default false
     */
    hoverOnly: boolean;
    /**
     * Course max en px (profondeur = 1) sur X. Moteur pointer.
     * @default 150
     */
    strengthX: number;
    /**
     * Course max en px (profondeur = 1) sur Y. Moteur pointer.
     * @default 150
     */
    strengthY: number;
    /**
     * Inverse le sens sur X (calques fuient le pointeur). Moteur pointer.
     * @default true
     */
    invertX: boolean;
    /**
     * Inverse le sens sur Y. Moteur pointer.
     * @default true
     */
    invertY: boolean;
    /**
     * Lissage vers la cible, 0..1 (plus haut = plus vif). Moteur pointer.
     * @default 0.12
     */
    smoothing: number;
    /**
     * Origine X (fraction 0..1). Moteur pointer.
     * @default 0.5
     */
    originX: number;
    /**
     * Origine Y (fraction 0..1). Moteur pointer.
     * @default 0.5
     */
    originY: number;
    /**
     * Active le gyroscope (deviceorientation). Moteur pointer.
     * @default true
     */
    gyroscope: boolean;
    /**
     * Degrés d’inclinaison pour la course complète. Moteur pointer.
     * @default 30
     */
    gyroRange: number;
    /**
     * Arrondi en décimales pour les transforms (réduit les micro-repaints). Moteur pointer.
     * @default 2
     */
    precision: number;
    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Direction de défilement du composant Page
 */
export type PageDirection = 'vertical' | 'horizontal';

/**
 * Configuration de la navigation par points du composant Page
 */
export interface PageNavigationOptions {
    /** Couleur du texte des infobulles */
    textColor?: string;
    /** Couleur des bordures des points */
    bulletsColor?: string;
    /** Position de la barre de navigation */
    position?: 'left' | 'right';
    /** Infobulles par section */
    tooltips?: string[];
}

/**
 * Direction du défilement entre sections Page
 */
export type PageScrollDirection = 'up' | 'down';

/**
 * Options pour le composant Page (empilement plein écran)
 */
export interface PageOptions extends BaseOptions {
    /** Direction du scroll entre sections */
    direction: PageDirection;
    /** Sélecteur du menu externe lié aux ancres */
    menu: string | null;
    /** Centrage vertical du contenu des sections */
    verticalCentered: boolean;
    /** Couleurs de fond par section */
    sectionsColor: string[];
    /** Ancres URL (#) par section */
    anchors: string[];
    /** Durée de transition en ms */
    scrollingSpeed: number;
    /** Courbe CSS de transition */
    easing: string;
    /** Boucle vers la dernière section depuis la première (scroll up) */
    loopTop: boolean;
    /** Boucle vers la première section depuis la dernière (scroll down) */
    loopBottom: boolean;
    /** Utiliser les transforms CSS3 */
    css3: boolean;
    /** Barre de navigation par points (false = désactivée) */
    navigation: PageNavigationOptions | false;
    /** Sélecteurs d'éléments à exclure du scroll automatique */
    normalScrollElements: string | null;
    /** Profondeur DOM pour détecter normalScrollElements au touch */
    normalScrollElementTouchThreshold: number;
    /** Sensibilité du swipe (% de la fenêtre) */
    touchSensitivity: number;
    /** Navigation au clavier */
    keyboardScrolling: boolean;
    /** Sélecteur des sections enfants */
    sectionSelector: string;
    /** Animer le scroll vers l'ancre au chargement */
    animateAnchor: boolean;
    /** Délai anti-rebond entre scrolls (ms) */
    scrollDelay: number;
    /** Mode plein écran : occupe le viewport et verrouille le scroll document */
    fullscreen: boolean;
    /** Respecter prefers-reduced-motion */
    respectReducedMotion: boolean;
    /** Callback après chargement d'une section */
    afterLoad: ((anchorLink: string | undefined, index: number) => void) | null;
    /** Callback avant de quitter une section */
    onLeave: ((index: number, nextIndex: number, direction: PageScrollDirection) => void) | null;
    /** Callback après le rendu initial */
    afterRender: (() => void) | null;
    /** Niveau de priorité pour la gestion des instances */
    priorityLevel: PriorityLevel;
}

/**
 * Mode tactile pour la rotation Tilt
 */
export type TiltRotateTouchMode = boolean | 'scroll-x' | 'scroll-y';

/**
 * Options pour le composant Tilt (effet 3D parallax natif K3UI)
 */
export interface TiltOptions extends BaseOptions {
    /** Toujours actif (sans hover) */
    alwaysActive: boolean;
    /** Décalage Z à l'activation (px) */
    activeOffset: number;
    /** Décalage de l'ombre (px) */
    shadowOffset: number;
    /** Échelle de l'ombre */
    shadowScale: number;
    /** Durée des transitions (ms) */
    duration: number;
    /** Active la rotation 3D */
    rotate: boolean;
    /** Rotation au toucher (true, false, scroll-x, scroll-y) */
    rotateTouch: TiltRotateTouchMode;
    /** Rotation X max (degrés) */
    rotateXMax: number;
    /** Rotation Y max (degrés) */
    rotateYMax: number;
    /** Inverser l'axe X */
    rotateXInvert: boolean;
    /** Inverser l'axe Y */
    rotateYInvert: boolean;
    /** Étirement X (%) */
    stretchX: number;
    /** Étirement Y (%) */
    stretchY: number;
    /** Étirement Z (px) */
    stretchZ: number;
    /** Origine de transformation commune */
    commonOrigin: boolean;
    /** Afficher l'ombre */
    shadow: boolean;
    /** Afficher le reflet (highlight) */
    highlight: boolean;
    /** Élément déclencheur (sélecteur ou HTMLElement), défaut = racine */
    eventsEl?: string | HTMLElement;
    /** Désactive l'effet si prefers-reduced-motion */
    respectReducedMotion: boolean;
    /** Force la désactivation complète de l'effet (playground / override instance) */
    reducedMotion: boolean;
    /** Callback à chaque rotation (rotateX, rotateY en degrés) */
    onRotate: ((rotateX: number, rotateY: number) => void) | null;
    /** Niveau de priorité pour la gestion des instances */
    priorityLevel: PriorityLevel;
    /** Callback avant activation (survol / touch) */
    onOpenStart: ((el: HTMLElement) => void) | null;
    /** Callback après activation */
    onOpenEnd: ((el: HTMLElement) => void) | null;
    /** Callback avant désactivation */
    onCloseStart: ((el: HTMLElement) => void) | null;
    /** Callback après désactivation */
    onCloseEnd: ((el: HTMLElement) => void) | null;
}

/**
 * Options pour le composant Field
 */
export interface FieldOptions extends BaseOptions {
    /**
     * Variant du field
     * @default 'filled'
     */
    variant: 'filled' | 'outlined' | 'plain';

    /**
     * Type de champ (text, email, password, etc.)
     * @default 'text'
     */
    type: string;

    /** Attribut name du contrôle */
    name?: string;

    /**
     * Label du champ
     * @default ''
     */
    label?: string;

    /**
     * Placeholder du champ
     * @default ''
     */
    placeholder?: string;

    /**
     * Valeur par défaut (formulaires)
     */
    defaultValue?: string;

    /**
     * Valeur par défaut
     * @default ''
     */
    value?: string;

    /**
     * Si true, le champ est désactivé
     * @default false
     */
    disabled?: boolean;

    /**
     * Si true, le champ est requis
     * @default false
     */
    required?: boolean;

    /** Texte d’aide (court) */
    helper?: string | undefined;

    /** Afficher l’aide uniquement au focus */
    helperOnFocus: boolean;

    /** Bouton effacer */
    clearable: boolean;
    clearIcon: string;

    /** Aligner le contenu fin de ligne (MD) */
    endAligned: boolean;

    prefix?: string | undefined;
    suffix?: string | undefined;

    /**
     * Message d'aide (alias long)
     * @default ''
     */
    helperText?: string;

    /**
     * Message d'erreur
     * @default ''
     */
    errorText?: string;

    errorIcon: string;

    /**
     * Si true, le champ est en erreur
     * @default false
     */
    error?: boolean;

    /**
     * Icône de début (leading icon)
     * @default ''
     */
    leadingIcon?: string;

    /**
     * Icône de fin (trailing icon)
     * @default ''
     */
    trailingIcon?: string;

    /**
     * Label ARIA pour l’icône trailing quand elle est cliquable (onTrailingIconClick)
     * @default ''
     */
    trailingIconLabel?: string;

    readonly: boolean;
    rows: number | null;
    autosize: boolean;
    minRows: number | null;
    maxRows: number | null;
    minLength: number | null;
    maxLength: number | null;
    counter: boolean;
    minCounter: number | null;
    maxCounter: number | null;
    step: number | null;
    pattern: string | null;
    togglePassword: boolean;
    showPasswordIcon: string;
    hidePasswordIcon: string;
    autocapitalize: string | null;
    autocorrect: string | null;
    autocomplete: string | null;
    enterkeyhint: string | null;
    spellcheck: boolean;
    inputmode: string | null;

    /**
     * Token de fond pour le variant filled (highest, high, low, surface ou suffixe MD complet)
     * @default null
     */
    filledBg?: string | null;

    /**
     * Fond de l’encoche label (outlined) — override de `--k3ui-field-outlined-notch-bg`.
     * Token MD (`surface`, `surface-container`, `high`…) ou couleur CSS (`#fff`, `rgb(…)`).
     * Sinon : hérité du host (Card, Dialog, Collapse…) puis fallback `surface`.
     * @default null
     */
    notchBg?: string | null;

    /**
     * Callback appelé au clic sur l’icône trailing (ex. copier, comme masquer/afficher mot de passe)
     * @default null
     */
    onTrailingIconClick?: ((instance: unknown) => void) | null;

    /**
     * Callback appelé lors du changement de valeur
     */
    onInput?: ((el: HTMLElement, value: string) => void) | null;

    onChange?: ((el: HTMLElement, value: string) => void) | null;

    /**
     * Callback appelé lors du focus
     */
    onFocus?: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé lors du blur
     */
    onBlur?: ((el: HTMLElement) => void) | null;

    validationMessage: string | null;
    onInvalid?: ((el: HTMLElement, validity: ValidityState) => void) | null;
    onClear?: ((instance: unknown) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;

    /**
     * Densité du champ : default, comfortable ou compact.
     * Héritée du premier ancêtre `[density]` si absente.
     */
    density?: 'default' | 'comfortable' | 'compact' | '';
}

/**
 * Options pour le composant Fieldset
 */
export interface FieldsetOptions extends BaseOptions {
    /** Titre du groupe affiché dans l'entaille */
    headline?: string;

    /** Texte d'aide sous le titre */
    supportingText?: string;

    /** Densité : default, comfortable ou compact */
    density: 'default' | 'comfortable' | 'compact';

    /** Nombre de colonnes de la grille de champs */
    columns: number;

    /** Groupe repliable */
    collapsible: boolean;

    /** État ouvert (si collapsible) */
    open: boolean;

    /** Désactive tous les contrôles du groupe */
    disabled: boolean;

    /** Message d'erreur de groupe */
    error?: string | null;

    /** Icône chevron du bouton replier/déplier */
    chevronIcon: string;

    /** Icône d'erreur de groupe */
    errorIcon: string;

    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Hero
 */
export interface HeroOptions extends BaseOptions {
    /**
     * Titre du hero
     * @default ''
     */
    title: string;

    /**
     * Sous-titre du hero
     * @default ''
     */
    subtitle?: string;

    /**
     * Image de fond du hero
     * @default ''
     */
    backgroundImage?: string;

    /**
     * Couleur de fond du hero
     * @default ''
     */
    backgroundColor?: string;

    /**
     * Hauteur du hero
     * @default 'auto'
     */
    height?: string;

    /**
     * Classe CSS pour le titre (vide par défaut, style géré par le module hero)
     * @default ''
     */
    titleClass: string;

    /**
     * Classe CSS pour le sous-titre (vide par défaut, style géré par le module hero)
     * @default ''
     */
    subtitleClass: string;

    /**
     * Si true, le hero est en mode plein écran
     * @default false
     */
    fullscreen?: boolean;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Textarea
 */
export interface TextareaOptions extends BaseOptions {
    /**
     * Variant du textarea (filled ou outlined)
     * @default 'filled'
     */
    variant: 'filled' | 'outlined';

    /**
     * Label du textarea
     * @default ''
     */
    label?: string;

    /**
     * Placeholder du textarea
     * @default ''
     */
    placeholder?: string;

    /**
     * Valeur par défaut
     * @default ''
     */
    value?: string;

    /**
     * Nombre de lignes
     * @default 3
     */
    rows: number;

    /**
     * Si true, le textarea est désactivé
     * @default false
     */
    disabled?: boolean;

    /**
     * Si true, le textarea est requis
     * @default false
     */
    required?: boolean;

    /**
     * Message d'aide
     * @default ''
     */
    helperText?: string;

    /**
     * Message d'erreur
     * @default ''
     */
    errorText?: string;

    /**
     * Si true, le textarea est en erreur
     * @default false
     */
    error?: boolean;

    /**
     * Nombre maximum de caractères
     * @default null
     */
    maxLength?: number | null;

    /**
     * Nom du textarea (pour les formulaires)
     * @default ''
     */
    name?: string;

    /**
     * Si true, le textarea est en lecture seule
     * @default false
     */
    readonly?: boolean;

    /**
     * Si true, le textarea s'ajuste automatiquement à son contenu
     * @default false
     */
    autosize?: boolean;

    /**
     * Si true, afficher le compteur de caractères
     * @default false
     */
    showCounter?: boolean;

    /**
     * Callback appelé lors du changement de valeur
     */
    onInput?: ((value: string, instance: Textarea) => void) | null;

    /**
     * Callback appelé lors du changement (change event)
     */
    onChange?: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé lors de la validation invalide
     */
    onInvalid?: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé lors du focus
     */
    onFocus?: ((instance: Textarea) => void) | null;

    /**
     * Callback appelé lors du blur
     */
    onBlur?: ((value: string, instance: Textarea) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Shape
 */
export interface ShapeOptions extends BaseOptions {
    /**
     * Forme de base à appliquer (basée sur les fichiers SVG disponibles)
     * @default 'heart'
     */
    shape: 'arch' | 'arrow' | 'boom' | 'boomsoft' | 'bun' | 'burst' | 'burstsoft' | 'circle' | 'clamshell' | 'diamond' | 'fan' | 'flower' | 'gem' | 'ghost' | 'heart' | 'leaf4' | 'leaf8' | 'oval' | 'octagonal-circle' | 'pentagon' | 'pill' | 'pixelcircle' | 'pixeltriangle' | 'puffy' | 'puffydiamond' | 'semicircle' | 'sides4' | 'sides6' | 'sides7' | 'sides9' | 'sides12' | 'slanted' | 'square' | 'sunny' | 'sunnysoft' | 'triangle';

    /**
     * Variant de la forme
     * @default 'mask'
     */
    variant: 'mask' | 'clip-path' | 'background' | 'outline' | 'filled' | 'gradient';

    /**
     * Taille de la forme
     * @default 'md'
     */
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

    /**
     * Couleur de la forme
     * @default ''
     */
    color?: string;
    hover?: boolean;
    animate?: boolean;
    assetsPath?: string;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Gradient
 */
export interface GradientOptions extends BaseOptions {
    /**
     * Couleurs du dégradé textuel
     * @default ['#C937E4', '#0099ff']
     */
    colors: string[];

    /**
     * Angle du dégradé en degrés
     * @default 90
     */
    angle: number;

    /**
     * Texte à afficher dans le composant.
     * Si vide, le contenu texte existant de l'élément est conservé.
     * @default ''
     */
    text: string;

    /**
     * Taille de fond du dégradé
     * @default '100%'
     */
    backgroundSize: string;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/** Variante visuelle du halo */
export type HaloVariant = 'default' | 'dual' | 'rainbow' | 'glow' | 'pulse';

/** Taille du liseré et du flou */
export type HaloSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Sens de rotation du halo */
export type HaloDirection = 'cw' | 'ccw';

/** Mode de déclenchement du halo */
export type HaloTrigger = 'always' | 'hover';

/**
 * Options pour le composant Halo
 */
export interface HaloOptions extends BaseOptions {
    /**
     * Style visuel du halo
     * @default 'default'
     */
    variant: HaloVariant;

    /**
     * Épaisseur du liseré et intensité du flou
     * @default 'md'
     */
    size: HaloSize;

    /**
     * Sens de rotation (variantes animées)
     * @default 'cw'
     */
    direction: HaloDirection;

    /**
     * Déclencheur d'affichage
     * @default 'always'
     */
    trigger: HaloTrigger;

    /**
     * Fige l'animation
     * @default false
     */
    paused: boolean;

    /**
     * Affichage en block au lieu d'inline-block
     * @default false
     */
    block: boolean;

    /**
     * Couleur CSS du halo (variantes default, dual, glow, pulse)
     * @default ''
     */
    color: string;

    /**
     * Rayon de bordure — doit correspondre à l'enfant
     * @default ''
     */
    radius: string;

    /**
     * Durée du cycle d'animation (ex. '6s', '3000ms')
     * @default ''
     */
    duration: string;

    /**
     * Épaisseur du liseré, surcharge `size`
     * @default ''
     */
    padding: string;

    /**
     * Détecte automatiquement le border-radius du premier enfant
     * @default true
     */
    autoRadius: boolean;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/** Axe de retournement Flip */
export type FlipAxis = 'x' | 'y';

/** Courbe motion Flip */
export type FlipMotion = 'standard' | 'expressive';

/** Déclencheur Flip */
export type FlipTrigger = 'hover' | 'click';

/**
 * Options pour le composant Flip (retournement 3D recto/verso)
 */
export interface FlipOptions extends BaseOptions {
    /** Axe de rotation */
    axis: FlipAxis;
    /** Courbe d'animation M3 */
    motion: FlipMotion;
    /** Déclencheur hover ou click */
    trigger: FlipTrigger;
    /** Durée de transition (ms) */
    duration: number;
    /** Perspective CSS (px) */
    perspective: number;
    /** État retourné (mode contrôlé) */
    flipped: boolean;
    /** Label ARIA en mode click */
    label: string;
    /** Callback changement d'état */
    onFlipChange: ((flipped: boolean) => void) | null;
    priorityLevel: PriorityLevel;
}

/** Variante foil Holo (inspiré pokemon-cards-151) */
export type HoloVariant = 'rayon' | 'space' | 'rainbow';

/** Mode autoplay Holo */
export type HoloAutoplay = 'auto' | boolean;

/**
 * Options pour le composant Holo (foil holographique irisé)
 */
export interface HoloOptions extends BaseOptions {
    /** Texture foil */
    variant: HoloVariant;
    /** Intensité du foil (0–1) — multiplie --card-opacity */
    strength: number;
    /** Animation autonome sur tactile */
    autoplay: HoloAutoplay;
    priorityLevel: PriorityLevel;
}

/** Nom de shape utilisable par Loader (même liste que Shape) */
export type LoaderShapeName = ShapeOptions['shape'];

/**
 * Mode d'animation du Loader
 * - morph: path morphing Material (une forme se déforme en la suivante)
 * - cycle: rotation + changement d'image (35 shapes)
 */
export type LoaderMode = 'morph' | 'cycle';

/**
 * Options pour le composant Loader
 * @description Indicateur de chargement : mode morph (Material) ou cycle (images)
 */
export interface LoaderOptions extends BaseOptions {
    /**
     * Mode d'animation : 'morph' (path morphing, style Material) ou 'cycle' (rotation + images)
     * @default 'morph'
     */
    mode: LoaderMode;
    /**
     * Séquence de noms de shapes pour le morphing (uniquement en mode 'morph').
     * Seuls les noms présents dans MORPHABLE_SHAPE_NAMES sont utilisés.
     * @default séquence recommandée Material (9 shapes)
     */
    morphShapeSequence: string[];
    /**
     * Durée en ms d'un cycle complet de morphing (SHAPE_COUNT × spatial-slow-duration).
     * Dérivée des tokens motion ; surcharge possible.
     * @default 4550 (7 × 650ms expressive spatial-slow)
     */
    morphDuration: number;
    /**
     * @deprecated Ignoré — morph piloté par tokens motion spatial-slow
     * @default true
     */
    morphUseSpring: boolean;
    /**
     * @deprecated Ignoré — voir tokens --md-sys-motion-spatial-slow-*
     * @default 0
     */
    morphRotationStiffness: number;
    /**
     * @deprecated Ignoré
     * @default 0
     */
    morphRotationDamping: number;
    /**
     * @deprecated Ignoré
     * @default 0
     */
    morphMorphStiffness: number;
    /**
     * @deprecated Ignoré
     * @default 0
     */
    morphMorphDamping: number;
    /**
     * @deprecated Ignoré — transitions continues sans hold
     * @default 0
     */
    morphHoldMs: number;
    /**
     * Progression déterminée 0..1 (morph piloté par progress). Null = indéterminé (boucle).
     * @default null
     */
    progress: number | null;
    /**
     * Met l'animation en pause
     * @default false
     */
    paused: boolean;
    /**
     * Couleur de l'indicateur (shape morphante). Défaut : primary M3.
     */
    indicatorColor: string;
    /**
     * Couleur du fond container (variante contained). Défaut : secondary-container M3.
     */
    containerColor: string;
    /**
     * Taille en pixels (dp) du conteneur. Material : 24–240 dp, défaut 48.
     * Le ratio container/indicateur reste constant au redimensionnement.
     * @default 48
     */
    size: number;
    /**
     * Afficher un fond type container (primary-container). Avec ou sans selon besoin.
     * @default false
     */
    container: boolean;
    /**
     * Activer un flou derrière le loader (backdrop blur 6px). Nécessite un fond semi-transparent pour être visible.
     * @default false
     */
    blur: boolean;
    /**
     * Centrer le loader (margin: auto)
     * @default true
     */
    center: boolean;
    /**
     * Délai en ms entre chaque changement de shape en mode 'cycle'
     * @default 1500
     */
    cycleInterval: number;
    /**
     * Durée en ms d'une rotation CSS complète (360deg) en mode 'cycle'
     * @default 1500
     */
    rotationDuration: number;
    /**
     * Chemin de base des assets shapes (SVG). Utilisé en mode 'cycle' ; optionnel en 'morph'.
     * @default ''
     */
    assetsPath: string;
    /**
     * Niveau de priorité
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
    /**
     * Callback appelé avant l'ouverture
     */
    onOpenStart: ((el: HTMLElement) => void) | null;
    /**
     * Callback appelé après l'ouverture
     */
    onOpenEnd: ((el: HTMLElement) => void) | null;
    /**
     * Callback appelé avant la fermeture
     */
    onCloseStart: ((el: HTMLElement) => void) | null;
    /**
     * Callback appelé après la fermeture
     */
    onCloseEnd: ((el: HTMLElement) => void) | null;
}

/**
 * Point de données pour le composant Heatmap (un jour)
 */
export interface HeatmapDataPoint {
    /** Date au format YYYY-MM-DD */
    date: string;
    /** Valeur (ex. nombre de connexions, contributions) */
    count: number;
}

/**
 * Options pour le composant Heatmap
 * @description Grille type contribution (année, 7×~53, intensité par jour)
 */
export interface HeatmapOptions extends BaseOptions {
    /**
     * Année affichée
     * @default année courante
     */
    year: number;
    /**
     * Données par jour (date YYYY-MM-DD → count)
     * @default []
     */
    data: HeatmapDataPoint[];
    /**
     * Nombre de niveaux d'intensité (couleurs), 2 à 5
     * @default 5
     */
    levels: number;
    /**
     * Premier jour de la semaine (0 = dimanche, 1 = lundi)
     * @default 1 (lundi)
     */
    firstDayOfWeek: 0 | 1;
    /**
     * Afficher les labels des mois au-dessus de la grille
     * @default true
     */
    showMonthLabels: boolean;
    /**
     * Afficher les labels des jours à gauche
     * @default true
     */
    showWeekdayLabels: boolean;
    /**
     * Taille prédéfinie : small (12×12), medium (14×14), large (16×16). Gap 3 px pour toutes.
     * Si défini, remplace cellSize et cellGap.
     */
    size?: 'small' | 'medium' | 'large' | string;
    /**
     * Taille d'une cellule en pixels
     * @default 12
     */
    cellSize: number;
    /**
     * Espacement entre cellules en pixels
     * @default 3
     */
    cellGap: number;
    /**
     * Niveau de priorité
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel?: PriorityLevel;
    /**
     * Callback appelé avant l'ouverture
     */
    onOpenStart: ((el: HTMLElement) => void) | null;
    /**
     * Callback appelé après l'ouverture
     */
    onOpenEnd: ((el: HTMLElement) => void) | null;
    /**
     * Callback appelé avant la fermeture
     */
    onCloseStart: ((el: HTMLElement) => void) | null;
    /**
     * Callback appelé après la fermeture
     */
    onCloseEnd: ((el: HTMLElement) => void) | null;
}

/**
 * Options pour le composant Switch
 */
export interface SwitchOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * État initial du switch (activé ou désactivé)
     * @default false
     */
    checked: boolean;

    /**
     * Si true, le switch est désactivé
     * @default false
     */
    disabled: boolean;

    /**
     * Taille du switch
     * @default 'medium'
     */
    size: 'small' | 'medium' | 'large';

    /**
     * Label du switch
     * @default ''
     */
    label?: string;
    showLabel?: boolean;
    labelPosition?: 'left' | 'right';
    textUnchecked?: string | null;
    textChecked?: string | null;
    traffic?: boolean;
    style?: 'normal' | 'compact';
    name?: string;
    value?: string;
    showIcon?: boolean;
    icon?: string | null;
    iconType?: string;
    iconCheck?: string | null;
    iconUncheck?: string | null;
    activation?: string;

    /**
     * Callback appelé lors du changement d'état
     */
    onChange?: ((el: HTMLElement, checked: boolean) => void) | null;
    onToggle?: ((el: HTMLElement, checked: boolean) => void) | null;
    onFocus?: ((el: HTMLElement) => void) | null;
    onBlur?: ((el: HTMLElement) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Direction des onglets (barre et items)
 */
export type TabsDirection = 'horizontal' | 'vertical';

/**
 * Comportement de défilement de la barre d'onglets
 */
export type TabsScrollable = 'auto' | 'always' | 'none';

/**
 * Position de l'indicateur par rapport aux onglets
 */
export type TabsIndicatorPosition = 'normal' | 'reverse';

/**
 * Variante des onglets (Material Design 3 You Expressive)
 * - primary : icône au-dessus du libellé (IconManager)
 * - secondary : texte seul
 */
export type TabsVariant = 'primary' | 'secondary';

/**
 * Options pour le composant Tabs (Material Design 3)
 */
export interface TabsOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * Variante d'affichage : primary (icône + label) ou secondary (texte seul)
     * @default 'secondary'
     */
    variant: TabsVariant;
    /**
     * Index ou nom de l'onglet actif (0-based)
     * @default 0
     */
    active: number | string;

    /**
     * Direction de la barre d'onglets
     * @default 'horizontal'
     */
    layoutDirection: TabsDirection;

    /**
     * Direction des items (panels)
     * @default 'horizontal'
     */
    itemDirection: TabsDirection;

    /**
     * Défilement de la barre : 'auto' (si besoin), 'always', 'none'
     * @default 'auto'
     */
    scrollable: TabsScrollable;

    /**
     * Position de l'indicateur : 'normal' (sous les onglets), 'reverse' (au-dessus)
     * @default 'normal'
     */
    indicatorPosition: TabsIndicatorPosition;

    /**
     * Couleur de l'onglet actif
     */
    activeColor?: string;

    /**
     * Couleur des onglets inactifs
     */
    inactiveColor?: string;

    /**
     * Couleur des onglets désactivés
     */
    disabledColor?: string;

    /**
     * Couleur de l'indicateur (défaut: activeColor ou primary)
     */
    indicatorColor?: string;

    /**
     * Épaisseur de l'indicateur (px ou string)
     * @default 2
     */
    indicatorSize: number | string;

    /**
     * Activer le swipe entre les panneaux (tabs-items)
     * @default true
     */
    canSwipe: boolean;

    /**
     * Activer les transitions entre panneaux
     * @default true
     */
    animated: boolean;

    /**
     * Callback appelé au clic sur un onglet
     */
    onClick?: ((active: number | string) => void) | null;

    /**
     * Callback appelé au changement d'onglet actif
     */
    onChange?: ((active: number | string) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Checkbox
 */
export interface CheckboxOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * État initial du checkbox (coché ou décoché)
     * @default false
     */
    checked: boolean;

    /**
     * Si true, le checkbox est désactivé
     * @default false
     */
    disabled: boolean;

    /**
     * Si true, le checkbox est en état indéterminé
     * @default false
     */
    indeterminate: boolean;

    /**
     * Si true, le checkbox est en erreur
     * @default false
     */
    error: boolean;

    /**
     * Label du checkbox
     * @default ''
     */
    label?: string;

    /**
     * Si true, afficher le label
     * @default true
     */
    showLabel?: boolean;

    /**
     * Nom du checkbox (pour les formulaires)
     * @default ''
     */
    name?: string;

    /**
     * Valeur du checkbox (pour les formulaires)
     * @default ''
     */
    value?: string;
    animation?: ComponentAnimationOptions | null;

    /**
     * Callback appelé lors du changement d'état
     */
    onChange?: ((checked: boolean, instance: Checkbox) => void) | null;

    /**
     * Callback appelé lors du focus
     */
    onFocus?: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé lors du blur
     */
    onBlur?: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé lors du toggle
     */
    onToggle?: ((el: HTMLElement, checked: boolean) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel?: PriorityLevel;
}

/**
 * Options pour le composant Radio
 */
export interface RadioOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * État initial du radio (sélectionné ou non)
     * @default false
     */
    checked: boolean;

    /**
     * Si true, le radio est désactivé
     * @default false
     */
    disabled: boolean;

    /**
     * Si true, le radio est en erreur
     * @default false
     */
    error: boolean;

    /**
     * Label du radio
     * @default ''
     */
    label?: string;

    /**
     * Si true, afficher le label
     * @default false
     */
    showLabel?: boolean;

    /**
     * Nom du groupe de radios
     * @default ''
     */
    name?: string;

    /**
     * Valeur du radio
     * @default ''
     */
    value?: string;

    /**
     * Callback appelé lors du changement d'état
     */
    onChange?: ((el: HTMLElement, checked: boolean) => void) | null;

    /**
     * Callback appelé lors du focus
     */
    onFocus?: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé lors du blur
     */
    onBlur?: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé lors du toggle
     */
    onToggle?: ((el: HTMLElement, checked: boolean) => void) | null;
    priority?: PriorityLevel;
    animation?: ComponentAnimationOptions | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel?: PriorityLevel;
}

/**
 * Options pour le composant Tile
 */
export interface TileOptions extends BaseOptions {
    /**
     * État initial (sélectionné ou non)
     * @default false
     */
    checked: boolean;

    /**
     * Si true, l'élément est désactivé
     * @default false
     */
    disabled: boolean;

    /**
     * Label affiché
     * @default ''
     */
    label?: string;

    /**
     * Si true, afficher le label
     * @default true
     */
    showLabel?: boolean;

    /**
     * Nom du groupe (exclusif, type radio)
     * @default ''
     */
    name?: string;

    /**
     * Valeur soumise avec le groupe
     * @default ''
     */
    value?: string;

    /**
     * Variante visuelle (mode expressive uniquement)
     * @default 'v1'
     */
    variant: 'v1' | 'v2';

    /**
     * Taille (mode expressive : MD3 ; ignorée en mode tile généré)
     * @default 'md'
     */
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

    /**
     * Mode de présentation : expressive (MD3) ou tile (tuiles bordées)
     * @default 'expressive'
     */
    layout: 'expressive' | 'tile';

    /**
     * Afficher une icône interne générée via IconManager
     * @default false
     */
    showIcon?: boolean;

    /**
     * Nom d'icône (IconManager)
     * @default null
     */
    icon?: string | null;

    /**
     * Type d'icône (classic, brand, etc.)
     * @default 'classic'
     */
    iconType?: string;

    /**
     * Callback appelé lors du changement d'état
     */
    onChange?: ((el: HTMLElement, checked: boolean) => void) | null;

    /**
     * Callback appelé lors du focus
     */
    onFocus?: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé lors du blur
     */
    onBlur?: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé lors du toggle
     */
    onToggle?: ((el: HTMLElement, checked: boolean) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Todo
 */
export interface TodoOptions extends BaseOptions {
    /**
     * Liste initiale de tâches
     * @default []
     */
    items: TodoItem[];

    /**
     * Filtre actif (all, active, completed)
     * @default 'all'
     */
    filter: 'all' | 'active' | 'completed';

    /**
     * Si true, les tâches sont persistées dans le localStorage
     * @default true
     */
    persistToStorage: boolean;

    /**
     * Clé de stockage dans le localStorage
     * @default 'k3ui-todo'
     */
    storageKey: string;

    /**
     * Placeholder pour le champ de saisie
     * @default 'Ajouter une tâche...'
     */
    placeholder: string;

    /**
     * Si true, permet l'édition en double-cliquant sur une tâche
     * @default true
     */
    allowEditOnDoubleClick: boolean;

    /**
     * Si true, affiche le compteur de tâches
     * @default true
     */
    showCounter: boolean;

    /**
     * Si true, affiche le bouton pour effacer les tâches complétées
     * @default true
     */
    showClearCompleted: boolean;

    /**
     * Callback appelé lors de l'ajout d'une tâche
     */
    onAdd?: ((item: TodoItem, instance: Todo) => void) | null;

    /**
     * Callback appelé lors de la modification d'une tâche
     */
    onUpdate?: ((item: TodoItem, instance: Todo) => void) | null;

    /**
     * Callback appelé lors de la suppression d'une tâche
     */
    onDelete?: ((item: TodoItem, instance: Todo) => void) | null;

    /**
     * Callback appelé lors de la suppression d'une tâche (alias pour onDelete)
     */
    onRemove?: ((item: TodoItem, instance: Todo) => void) | null;

    /**
     * Callback appelé lors de l'édition d'une tâche
     */
    onEdit?: ((item: TodoItem, instance: Todo) => void) | null;

    /**
     * Callback appelé lors du changement de filtre
     */
    onFilterChange?: ((filter: TodoFilter, instance: Todo) => void) | null;

    /**
     * Callback appelé lors du changement d'état d'une tâche
     */
    onToggle?: ((item: TodoItem, instance: Todo) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Type de filtre pour Todo
 */
export type TodoFilter = 'all' | 'active' | 'completed';

/**
 * Item de tâche Todo
 */
export interface TodoItem {
    /** ID unique de la tâche */
    id: string;
    /** Texte de la tâche */
    text: string;
    /** Si la tâche est complétée */
    completed: boolean;
    /** Date de création */
    createdAt?: Date;
    /** Date de modification */
    updatedAt?: Date;
}

/**
 * Options pour le composant Datepicker
 */
export interface DatepickerOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * Mode de sélection : 'single' pour une date unique, 'range' pour une plage de dates
     * @default 'single'
     */
    mode: 'single' | 'range';

    /**
     * Date sélectionnée par défaut (pour mode 'single')
     * @default null
     */
    selectedDate: Date | null;

    /**
     * Plage de dates sélectionnée par défaut (pour mode 'range')
     * @default null
     */
    selectedRange?: { start: Date | null; end: Date | null } | null;

    /**
     * Locale pour l'affichage des dates
     * @default 'fr-FR'
     */
    locale: string;

    /**
     * Format d'affichage de la date
     * @default 'DD/MM/YYYY'
     */
    dateFormat: string;

    /**
     * Variant du datepicker
     * @default 'filled'
     */
    variant: 'filled' | 'outlined';

    /**
     * Date minimum sélectionnable
     * @default null
     */
    minDate?: Date | null;

    /**
     * Date maximum sélectionnable
     * @default null
     */
    maxDate?: Date | null;

    /**
     * Date de début (pour mode range)
     * @default null
     */
    startDate?: Date | null;

    /**
     * Date de fin (pour mode range)
     * @default null
     */
    endDate?: Date | null;

    /**
     * Dates désactivées
     * @default []
     */
    disabledDates?: Date[] | ((date: Date) => boolean);

    /**
     * Mode d'affichage
     * @default 'calendar'
     */
    viewMode?: 'calendar' | 'months' | 'years' | 'month' | 'year' | 'input';

    /**
     * Format d'affichage personnalisé
     * @default null
     */
    displayFormat?: string | null;

    /**
     * Placeholder pour le champ de saisie
     * @default ''
     */
    placeholder?: string;

    /**
     * Label du champ
     * @default ''
     */
    label?: string;

    /**
     * Texte d'aide
     * @default ''
     */
    helper?: string;

    /**
     * Message d'erreur
     * @default ''
     */
    errorMessage?: string;

    /**
     * Variant du champ de saisie
     * @default 'filled'
     */
    inputVariant?: 'filled' | 'outlined';

    /**
     * Icône du champ
     * @default null
     */
    icon?: string | null;

    /**
     * Premier jour de la semaine (0 = dimanche, 1 = lundi, etc.)
     * @default 1
     */
    firstDayOfWeek?: number;

    /**
     * Séparateur pour les plages de dates
     * @default ' - '
     */
    rangeSeparator?: string;

    /**
     * Si true, le champ est en erreur
     * @default false
     */
    error?: boolean;

    /**
     * Si true, le champ est en lecture seule
     * @default false
     */
    readonly?: boolean;

    /**
     * Si true, le champ est requis
     * @default false
     */
    required?: boolean;

    /**
     * Activer l'animation haptique
     * @default true
     */
    haptic?: boolean;

    /**
     * Si true, afficher l'icône
     * @default false
     */
    showIcon?: boolean;

    /**
     * Si true, afficher le bouton "Aujourd'hui"
     * @default false
     */
    showTodayButton?: boolean;
    todayButtonText?: string;

    /**
     * Si true, afficher le bouton "Effacer"
     * @default false
     */
    showClearButton?: boolean;
    clearButtonText?: string;

    /**
     * Si true, afficher le bouton "Annuler"
     * @default false
     */
    showCancelButton?: boolean;

    /**
     * Si true, afficher le bouton "Confirmer"
     * @default false
     */
    showConfirmButton?: boolean;
    cancelButtonText?: string;
    confirmButtonText?: string;

    /**
     * Si true, permettre la saisie manuelle
     * @default true
     */
    allowInput?: boolean;

    /**
     * Si true, permettre la navigation au clavier
     * @default true
     */
    allowKeyboardNavigation?: boolean;

    /**
     * Si true, empêcher le scroll de la page
     * @default true
     */
    preventScrolling?: boolean;

    /**
     * Durée d'animation d'entrée en millisecondes
     * @default 250
     */
    inDuration?: number;

    /**
     * Durée d'animation de sortie en millisecondes
     * @default 250
     */
    outDuration?: number;

    /**
     * Opacité de l'overlay
     * @default 0.32
     */
    opacity?: number;

    /**
     * Si true, le datepicker est désactivé
     * @default false
     */
    disabled?: boolean;

    /**
     * Callback appelé lors de la sélection d'une date
     */
    onSelect?: ((date: Date | { start: Date | null; end: Date | null } | null, instance: Datepicker) => void) | null;

    /**
     * Callback appelé lors du changement (alias pour onSelect)
     */
    onChange?: ((date: Date | { start: Date | null; end: Date | null } | null, instance: Datepicker) => void) | null;

    /**
     * Callback appelé lors de l'ouverture
     */
    onOpen?: ComponentInstanceCallback | null;

    /**
     * Callback appelé lors de la fermeture
     */
    onClose?: ComponentInstanceCallback | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Pin
 */
export interface PinOptions extends BaseOptions, HapticFeedbackOptions {
    /** Variant visuel (filled ou outlined) @default 'filled' */
    variant: 'filled' | 'outlined';
    /** Texte d'aide sous le composant @default null */
    pinHelper?: string | null;
    /** Afficher le compteur du code */
    pinCounter?: boolean;
    /** Nombre de caractères du PIN @default 6 */
    length: number;
    /** Type de champ (text ou password) @default 'password' */
    type: 'text' | 'password';
    /** Type de saisie attendue */
    inputType?: 'numbers' | 'text' | 'alphanumeric' | 'letters' | 'mixed';
    /** Validation sensible à la casse */
    caseSensitive?: boolean;
    /** Activer la validation embarquée */
    enableValidation?: boolean;
    /** Délai de focus auto */
    focusDelay?: number;
    /** Autoriser backspace inter-champs */
    allowBackspace?: boolean;
    /** Autoriser le collage */
    allowPaste?: boolean;
    /** Code attendu pour validation */
    expectedCode?: string | null;
    /** Si true, le PIN est désactivé @default false */
    disabled?: boolean;
    /** Valeur par défaut @default '' */
    value?: string;
    /** Callback appelé lors de la saisie complète @default null */
    onComplete?: ((el: HTMLElement, value: string) => void) | null;
    /** Callback appelé lors de chaque changement @default null */
    onChange?: ((el: HTMLElement, value: string) => void) | null;
    /** Callback focus */
    onFocus?: ((index: number, instance?: Pin) => void) | null;
    /** Callback blur */
    onBlur?: ((index: number, instance?: Pin) => void) | null;
    /** Callback validation OK */
    onValid?: ((value: string) => void) | null;
    /** Callback validation KO */
    onInvalid?: ((value: string) => void) | null;
    /** Niveau de priorité pour la gestion des instances @default PriorityLevel.MEDIUM */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Timepicker
 */
export interface TimepickerOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * Heure sélectionnée par défaut (format 24h)
     * @default null
     */
    selectedTime: { hours: number; minutes: number } | null;

    /**
     * Locale pour l'affichage de l'heure
     * @default 'fr-FR'
     */
    locale: string;

    /**
     * Format d'affichage de l'heure
     * @default 'HH:mm'
     */
    timeFormat: string;

    /**
     * Format d'heure (12h ou 24h)
     * @default '24h'
     */
    format: '12h' | '24h';

    /**
     * Variant du timepicker
     * @default 'filled'
     */
    variant: 'filled' | 'outlined';

    /**
     * Placeholder pour le champ de saisie
     * @default ''
     */
    placeholder?: string;

    /**
     * Label du champ
     * @default ''
     */
    label?: string;

    /**
     * Texte d'aide
     * @default ''
     */
    helper?: string;

    /**
     * Message d'erreur
     * @default ''
     */
    errorMessage?: string;

    /**
     * Variant du champ de saisie
     * @default 'filled'
     */
    inputVariant?: 'filled' | 'outlined';

    /**
     * Icône du champ
     * @default null
     */
    icon?: string | null;

    /**
     * Pas pour les minutes
     * @default 1
     */
    minuteStep?: number;

    /**
     * Pas pour les heures
     * @default 1
     */
    hourStep?: number;

    /**
     * Heure minimum sélectionnable
     * @default null
     */
    minTime?: { hours: number; minutes: number } | null;

    /**
     * Heure maximum sélectionnable
     * @default null
     */
    maxTime?: { hours: number; minutes: number } | null;

    /**
     * Si true, le champ est en erreur
     * @default false
     */
    error?: boolean;

    /**
     * Si true, le champ est en lecture seule
     * @default false
     */
    readonly?: boolean;

    /**
     * Si true, le champ est requis
     * @default false
     */
    required?: boolean;

    /**
     * Activer l'animation haptique
     * @default true
     */
    haptic?: boolean;

    /**
     * Si true, afficher l'icône
     * @default false
     */
    showIcon?: boolean;

    /**
     * Si true, afficher le bouton "Annuler"
     * @default false
     */
    showCancelButton?: boolean;

    /**
     * Texte du bouton "Annuler"
     * @default 'Annuler'
     */
    cancelButtonText?: string;

    /**
     * Si true, afficher le bouton "Confirmer"
     * @default false
     */
    showConfirmButton?: boolean;

    /**
     * Texte du bouton "Confirmer"
     * @default 'Confirmer'
     */
    confirmButtonText?: string;

    /**
     * Si true, permettre la saisie manuelle
     * @default true
     */
    allowInput?: boolean;

    /**
     * Si true, permettre la navigation au clavier
     * @default true
     */
    allowKeyboardNavigation?: boolean;

    /**
     * Si true, empêcher le scroll de la page
     * @default true
     */
    preventScrolling?: boolean;

    /**
     * Durée d'animation d'entrée en millisecondes
     * @default 250
     */
    inDuration?: number;

    /**
     * Durée d'animation de sortie en millisecondes
     * @default 250
     */
    outDuration?: number;

    /**
     * Opacité de l'overlay
     * @default 0.32
     */
    opacity?: number;

    /**
     * Si true, le timepicker est désactivé
     * @default false
     */
    disabled?: boolean;

    /**
     * Callback appelé lors de la sélection d'une heure
     */
    onSelect?: ((time: { hours: number; minutes: number } | null, instance: Timepicker) => void) | null;

    /**
     * Callback appelé lors du changement (alias pour onSelect)
     */
    onChange?: ((time: { hours: number; minutes: number } | null, instance: Timepicker) => void) | null;

    /**
     * Callback appelé lors de l'ouverture
     */
    onOpen?: ComponentInstanceCallback | null;

    /**
     * Callback appelé lors de la fermeture
     */
    onClose?: ComponentInstanceCallback | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Slider
 */
export interface SliderOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * Valeur initiale du slider (pour single slider)
     * @default 50
     */
    value: number;

    /**
     * Valeur minimale
     * @default 0
     */
    min: number;

    /**
     * Valeur maximale
     * @default 100
     */
    max: number;

    /**
     * Pas d'incrémentation
     * @default 1
     */
    step: number;

    /**
     * Taille du slider
     * @default 'm'
     */
    size: 'xs' | 's' | 'm' | 'l' | 'xl';

    /**
     * Si true, le slider est désactivé
     * @default false
     */
    disabled?: boolean;

    /**
     * Label du slider
     * @default ''
     */
    label?: string;
    name?: string;
    icon?: string | null;
    direction?: 'auto' | 'ltr' | 'rtl';
    valueStart?: number;
    valueEnd?: number;
    discrete?: boolean;
    vertical?: boolean;
    centered?: boolean;
    range?: boolean;
    showLabel?: boolean;
    labelPosition?: 'before' | 'after' | 'top' | 'bottom' | 'left' | 'right';
    showValueLabel?: boolean;
    showStopIndicators?: boolean;

    /**
     * Callback appelé lors du changement de valeur
     */
    onChange?: ((el: HTMLElement, value: number | [number, number]) => void) | null;
    onDragStart?: ((el: HTMLElement, value?: number | [number, number]) => void) | null;
    onDrag?: ((el: HTMLElement, value: number | [number, number]) => void) | null;
    onDragEnd?: ((el: HTMLElement, value?: number | [number, number]) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant ColorPicker
 */
export interface ColorPickerOptions extends BaseOptions {
    /**
     * Couleur initiale (hex #RRGGBB)
     * @default '#6750A4'
     */
    value: string;

    /**
     * Afficher un toast "Copié !" lors de la copie d'un format
     * @default true
     */
    showToastOnCopy: boolean;

    /**
     * Callback appelé lorsque la couleur change
     */
    onChange: ((hex: string, instance: ColorPicker) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Effet de perspective pour le composant Perspective
 */
export type PerspectiveEffectType =
    | 'wave'
    | 'coverflow'
    | 'carousel'
    | 'cube'
    | 'classic'
    | 'concave'
    | 'arc'
    | 'spiral-right'
    | 'spiral-left';

/**
 * Options pour le composant Perspective (slider 3D)
 */
export interface PerspectiveOptions extends BaseOptions {
    /**
     * Effet visuel 3D
     * @default 'wave'
     */
    effect: PerspectiveEffectType;

    /**
     * Index de la slide initiale
     * @default 0
     */
    focus: number;

    /**
     * Orientation du carousel : horizontal ou vertical
     * @default 'horizontal'
     */
    orientation: 'horizontal' | 'vertical';

    /**
     * Options d'ombre 3D
     */
    shadows: { enabled: boolean };

    /**
     * Options de navigation (flèches)
     */
    navigation: { enabled: boolean };

    /**
     * Options d'autoplay
     */
    autoplay: { enabled: boolean; speed: number };

    /**
     * Boucle infinie
     */
    loop: { enabled: boolean };

    /**
     * Listeners activés (clavier, touch, clic, scroll, drag)
     */
    listeners: {
        keys: boolean;
        touches: boolean;
        clicks: boolean;
        scroll: boolean;
        drag: boolean;
    };

    /**
     * Callback appelé au changement de slide
     */
    onChange: ((event: { index: number; slide: HTMLElement }) => void) | null;

    /**
     * Empêcher le scroll de la page pendant l'interaction (touch, wheel, drag)
     * @default true
     */
    preventScrolling: boolean;

    /**
     * Durée d'entrée de la transition (ms)
     * @default 250
     */
    inDuration: number;

    /**
     * Durée de sortie de la transition (ms)
     * @default 200
     */
    outDuration: number;

    /**
     * Afficher les indicateurs (points) pour la slide active
     * @default false
     */
    indicators: boolean;

    /**
     * Position des indicateurs : haut ou bas (défaut bas)
     * @default 'bottom'
     */
    indicatorsPosition: 'top' | 'bottom';

    /**
     * Nombre d'items visibles (avant/après la slide active)
     * @default 5
     */
    numVisible: number;

    /**
     * Callback appelé quand une nouvelle slide est affichée (alias de onChange)
     */
    onCycleTo: ((event: { index: number; slide: HTMLElement }) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Thèmes visuels du composant Pace
 */
export type PaceTheme = 'minimal' | 'flash' | 'fill' | 'counter' | 'flat' | 'barber' | 'material';

/**
 * Options pour le composant Pace (barre de chargement de page)
 */
export interface PaceOptions extends BaseOptions {
    /** Classe CSS additionnelle sur la barre */
    className: string;
    /** Couleur de la piste (rail) en hex. Vide = couleurs SCSS du thème */
    colorOnTrack: string;
    /** Couleur du remplissage (barre) en hex. Vide = couleurs SCSS du thème */
    colorOnProgress: string;
    /** Thème visuel : minimal, flash, fill, counter, flat, barber, material (loader centré M3) */
    theme: PaceTheme;
    /** Afficher un backdrop (blur plein écran) derrière la barre/card. Tous thèmes. */
    backdrop: boolean;
    /** Temps pour rattraper la progression réelle (ms) */
    catchupTime: number;
    /** Vitesse initiale (0–1) */
    initialRate: number;
    /** Durée minimale d'affichage (ms) */
    minTime: number;
    /** Délai avant masquage après 100% (ms) */
    ghostTime: number;
    /** Progression max par frame (%) */
    maxProgressPerFrame: number;
    /** Facteur d'easing */
    easeFactor: number;
    /** Démarrer au chargement */
    startOnPageLoad: boolean;
    /** Redémarrer sur pushState/replaceState */
    restartOnPushState: boolean;
    /** Redémarrer après requête en cours (ms) */
    restartOnRequestAfter: number;
    /** Cible d'injection (sélecteur) */
    target: string;
    /** Suivi des éléments */
    elements: { checkInterval: number; selectors: string[] };
    /** Détection event lag */
    eventLag: { minSamples: number; sampleCount: number; lagThreshold: number };
    /** Suivi AJAX */
    ajax: {
        trackMethods: string[];
        trackWebSockets: boolean;
        ignoreURLs: (string | RegExp)[];
    };
    /** Niveau de priorité */
    priorityLevel: PriorityLevel;
    onOpenStart: ((el: HTMLElement) => void) | null;
    onOpenEnd: ((el: HTMLElement) => void) | null;
    onCloseStart: ((el: HTMLElement) => void) | null;
    onCloseEnd: ((el: HTMLElement) => void) | null;
}

/**
 * Options pour le composant Confetti
 */
export interface ConfettiOptions extends BaseOptions {
    /**
     * Nombre de particules
     * @default 50
     */
    particleCount: number;

    /**
     * Angle de tir en degrés
     * @default 90
     */
    angle: number;

    /**
     * Écart de diffusion en degrés
     * @default 45
     */
    spread: number;

    /**
     * Vitesse initiale des particules
     * @default 45
     */
    startVelocity: number;

    /**
     * Décroissance de la vitesse (0-1)
     * @default 0.9
     */
    decay: number;

    /**
     * Gravité (pixels par frame)
     * @default 1
     */
    gravity: number;

    /**
     * Dérive horizontale (pixels par frame)
     * @default 0
     */
    drift: number;

    /**
     * Nombre de frames d'animation
     * @default 200
     */
    ticks: number;

    /**
     * Point d'origine (x, y en pourcentage)
     * @default { x: 0.5, y: 0.5 }
     */
    origin: { x: number; y: number };

    /**
     * Formes des particules
     * @default ['square']
     */
    shapes: string[];

    /**
     * Z-index du canvas
     * @default 1000
     */
    zIndex: number;

    /**
     * Couleurs des particules
     * @default ['#ff0000', '#00ff00', '#0000ff']
     */
    colors: string[];

    /**
     * Désactiver pour mouvement réduit
     * @default true
     */
    disableForReducedMotion: boolean;

    /**
     * Facteur d'échelle
     * @default 1
     */
    scalar: number;

    /**
     * Si true, les particules sont plates
     * @default false
     */
    flat: boolean;

    /**
     * Si true, le canvas se redimensionne automatiquement
     * @default true
     */
    resize: boolean;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/** Variante de pane pour layouts multi-colonnes M3 Expressive */
export type PanelContentVariant = 'leading' | 'layout' | 'trailing';

/**
 * Options pour le composant PanelContent (surface M3 Expressive scrollable)
 */
export interface PanelContentOptions extends BaseOptions {
    /**
     * Variante de pane : leading (nav), layout (contenu), trailing (TOC / aside)
     * @default 'layout'
     */
    variant: PanelContentVariant;

    /**
     * Rayon des coins (CSS length)
     * @default '28px'
     */
    radius: string;

    /**
     * Couleur de surface (CSS color). Laisser vide pour utiliser le token M3
     * `surface-container-lowest` (carte sur canvas `surface-container-low`).
     * @default ''
     */
    surface: string;

    /**
     * Active le scroll vertical sur la pane
     * @default true
     */
    scrollable: boolean;

    /**
     * Pane trailing vide (colonne réservée sans contenu)
     * @default false
     */
    empty: boolean;

    /**
     * Libellé accessible pour la pane
     * @default null
     */
    ariaLabel: string | null;
}



/** Orientation du composant PanelSplit */
export type PanelSplitOrientation = 'horizontal' | 'vertical';

/**
 * Options pour le composant PanelSplit (dual-view M3E avec poignée drag)
 */
export interface PanelSplitOptions extends BaseOptions {
    /**
     * Orientation du split : horizontal (colonnes) ou vertical (lignes)
     * @default 'vertical'
     */
    orientation: PanelSplitOrientation;

    /**
     * Position de la poignée en pourcentage (pane start)
     * @default 50
     */
    value: number;

    /**
     * Valeur minimale en pourcentage
     * @default 0
     */
    min: number;

    /**
     * Valeur maximale en pourcentage
     * @default 100
     */
    max: number;

    /**
     * Pas clavier / incrément
     * @default 2
     */
    step: number;

    /**
     * Désactive le drag et le clavier sur la poignée
     * @default false
     */
    disabled: boolean;

    /**
     * Libellé accessible de la poignée (aria-label)
     * @default 'Ajuster les panes'
     */
    label: string;

    /**
     * Taille du conteneur de poignée (CSS length)
     * @default '24px'
     */
    handleSize: string;
}

/**
 * Options pour le composant Chart
 */
export interface ChartOptions extends BaseOptions {
    /**
     * Type de graphique K3UI (preset)
     * @default 'pie-pad-angle'
     */
    type: ChartType;

    /**
     * Données du graphique
     * @default { labels: [], datasets: [] }
     */
    data?: ChartData | SimpleChartData[];

    /**
     * Thème du graphique
     * @default 'auto'
     */
    theme?: 'auto' | 'light' | 'dark';

    /**
     * Si true, affiche la grille
     * @default true
     */
    showGrid: boolean;

    /**
     * Si true, affiche la légende
     * @default true
     */
    showLegend: boolean;

    /**
     * Si true, affiche les labels sur les séries
     * @default true
     */
    showLabels: boolean;

    /**
     * Si true, affiche les infobulles
     * @default true
     */
    showTooltip: boolean;

    /**
     * Si true, active les animations
     * @default true
     */
    animation: boolean;

    /**
     * Couleurs personnalisées pour le graphique
     * @default []
     */
    colors?: string[];

    /**
     * Durée de l'animation en millisecondes
     * @default 1000
     */
    animationDuration?: number;

    /**
     * Angle de séparation pour pie-pad-angle (degrés)
     * @default 4
     */
    padAngle?: number;

    /**
     * Rayon de bordure des barres/secteurs
     * @default 8
     */
    borderRadius?: number;

    /**
     * Valeur max pour les graphiques radar
     * @default 100
     */
    radarMax?: number;

    /**
     * Valeur max pour les jauges circulaires (preset ring-gauge)
     * @default 100
     */
    gaugeMax?: number;

    /**
     * Épaisseur des anneaux (preset ring-gauge)
     * @default 40
     */
    gaugeRingWidth?: number;

    /**
     * Nombre de clusters pour scatter-clustering
     * @default 6
     */
    clusterCount?: number;

    /**
     * Configuration des mises à jour temps réel (preset dynamic)
     */
    liveUpdate?: ChartLiveUpdateConfig;

    /**
     * Libellé ARIA du graphique (rôle img). Sinon libellé i18n selon le type.
     */
    accessibilityLabel?: string;

    /**
     * Texte additionnel référencé par aria-describedby
     */
    accessibilityDescription?: string;

    /**
     * Résumé textuel des données pour lecteurs d'écran
     */
    accessibilitySummary?: string;

    /**
     * Affiche un tableau HTML masqué visuellement avec les données brutes
     * @default false
     */
    showAccessibilityTable?: boolean;

    /**
     * Callback après mise à jour des données (preset dynamic)
     */
    onDataUpdate?: ((data: ChartData) => void) | null;

    /**
     * Callback au clic sur une série
     */
    onSeriesClick?: ((payload: ChartSeriesClickPayload) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Configuration des mises à jour temps réel
 */
export interface ChartLiveUpdateConfig {
    /** Intervalle en ms */
    interval?: number;
    /** Nombre max de points affichés */
    maxPoints?: number;
    /** Générateur personnalisé de données */
    generator?: (current: ChartData) => ChartData;
}

/**
 * Payload du callback onSeriesClick
 */
export interface ChartSeriesClickPayload {
    seriesName?: string;
    name?: string;
    value?: unknown;
    dataIndex?: number;
}

/**
 * Dataset de graphique
 */
export interface ChartDataset {
    /** Label du dataset */
    label?: string;
    /** Données (format selon le type de graphique) */
    data: number[] | number[][] | ChartScatterPoint[];
    /** Couleur de la série */
    color?: string;
    /** Type de série (preset mixed-line-bar) */
    seriesType?: 'bar' | 'line';
    /** Index d'axe Y (preset mixed-line-bar) */
    yAxisIndex?: number;
}

/**
 * Nœud hiérarchique (preset sunburst-rounded)
 */
export interface ChartTreeNode {
    /** Nom du nœud */
    name: string;
    /** Valeur (feuilles) */
    value?: number;
    /** Enfants */
    children?: ChartTreeNode[];
}

/**
 * Lien entre nœuds (preset basic-chord)
 */
export interface ChartLink {
    /** Nœud source */
    source: string;
    /** Nœud cible */
    target: string;
    /** Poids du flux */
    value: number;
}

/**
 * Point scatter [x, y]
 */
export interface ChartScatterPoint {
    value: [number, number];
    name?: string;
}

/**
 * Type de graphique K3UI
 */
export type ChartType =
    | 'pie-pad-angle'
    | 'nightingale'
    | 'funnel'
    | 'heatmap'
    | 'bar'
    | 'bar-horizontal'
    | 'scatter'
    | 'scatter-clustering'
    | 'candlestick'
    | 'radar'
    | 'radar-multiple'
    | 'line'
    | 'line-smooth'
    | 'area'
    | 'line-stacked'
    | 'area-stacked'
    | 'bump'
    | 'basic-chord'
    | 'sunburst-rounded'
    | 'mixed-line-bar'
    | 'bar-negative'
    | 'ring-gauge';

/**
 * Données d'un graphique K3UI
 */
export interface ChartData {
    /** Labels des axes ou catégories */
    labels: string[];
    /** Labels de l'axe Y (preset heatmap) */
    yLabels?: string[];
    /** Datasets du graphique */
    datasets: ChartDataset[];
    /** Liens entre nœuds (preset basic-chord) */
    links?: ChartLink[];
    /** Arbre hiérarchique (preset sunburst-rounded) */
    tree?: ChartTreeNode[];
    /** Noms des axes Y (preset mixed-line-bar) */
    axisNames?: string[];
}

/**
 * Données d'un graphique (format simple)
 */
export interface SimpleChartData {
    /** Label de la donnée */
    label: string;
    /** Valeur de la donnée */
    value: number;
    /** Couleur de la donnée */
    color?: string;
}

/**
 * Options pour le composant Table
 */
export interface TableOptions extends BaseOptions {
    /**
     * Label ARIA pour la table (sinon clé i18n table.defaultAriaLabel)
     */
    ariaLabel?: string;

    /**
     * Si true, la table est triable
     * @default false
     */
    sortable: boolean;

    /**
     * Si true, la table est sélectionnable
     * @default false
     */
    selectable: boolean;

    /**
     * Si true, la sélection multiple est activée
     * @default false
     */
    multiSelect: boolean;

    /**
     * Données de la table
     * @default []
     */
    data?: TableRow[];

    /**
     * Colonnes de la table
     * @default []
     */
    columns?: TableColumn[];

    /**
     * Configuration de la pagination
     */
    pagination?: {
        enabled?: boolean;
        itemsPerPage?: number;
        currentPage?: number;
    } | boolean;

    /**
     * Si true, la table est recherchable
     * @default false
     */
    searchable?: boolean;

    /**
     * Placeholder pour le champ de recherche (sinon clé i18n table.searchPlaceholder)
     */
    searchPlaceholder?: string;

    /**
     * Nombre d'éléments par page (si pagination activée)
     * @default 10
     */
    itemsPerPage?: number;

    /**
     * Callback appelé lors du tri
     */
    onSort?: ((column: TableColumn | number, direction: 'asc' | 'desc', instance?: Table) => void) | null;

    /**
     * Callback appelé lors de la sélection
     */
    onSelect?: ((rows: TableRow[], instance: Table) => void) | null;

    /**
     * Callback appelé lors de la sélection d'une ligne (alias pour onSelect)
     */
    onRowSelect?: ((selectedIndices: number[], index: number, selected: boolean) => void) | null;

    /**
     * Callback appelé lors d'une action sur une ligne
     */
    onRowAction?: ((rowIndex: number, trigger: HTMLElement) => void) | null;

    /**
     * Callback appelé lors de la recherche
     */
    onSearch?: ((query: string, resultCount: number) => void) | null;

    /**
     * Callback appelé lors du changement de page
     */
    onPageChange?: ((page: number, totalPages: number) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Colonne de table
 */
export interface TableColumn {
    /** Clé de la colonne */
    key: string;
    /** Label de la colonne */
    label: string;
    /** Si la colonne est triable */
    sortable?: boolean;
    /** Si la colonne est alignée à droite */
    alignRight?: boolean;
    /** Fonction de formatage personnalisée */
    formatter?: (value: TableCellValue, row: TableRow) => string;
}

/**
 * Ligne de table
 */
export interface TableRow {
    /** ID unique de la ligne */
    id?: string;
    /** Données de la ligne */
    [key: string]: TableCellValue | undefined;
}

/**
 * Type de tir pyrotechnique
 */
export type FireworkShellType =
    | 'Random'
    | 'Crackle'
    | 'Crossette'
    | 'Crysanthemum'
    | 'Falling Leaves'
    | 'Floral'
    | 'Ghost'
    | 'Horse Tail'
    | 'Palm'
    | 'Ring'
    | 'Strobe'
    | 'Willow';

/** Qualité graphique : 1 = basse, 2 = normale, 3 = haute */
export type FireworkQuality = 1 | 2 | 3;

/** Illumination du ciel : 0 = aucune, 1 = légère, 2 = normale */
export type FireworkSkyLighting = 0 | 1 | 2;

/** Mode audio du moteur */
export type FireworkSoundMode = 'synth' | 'samples';

/**
 * Calque d'empilement du canvas
 * - behind : derrière le contenu (z-index négatif)
 * - front : devant le contenu, sans bloquer souris/clavier (pointer-events: none)
 */
export type FireworkLayer = 'behind' | 'front';

/**
 * Salve d'une séquence personnalisée
 */
export interface FireworkSequenceSalvo {
    count?: number;
    finale?: boolean;
    finaleCount?: number;
    wait?: number;
    shell?: FireworkShellType;
    size?: number;
    delay?: number;
}

/**
 * Options d'une séquence personnalisée
 */
export interface FireworkSequenceOptions {
    loop?: boolean;
    onEnd?: () => void;
}

/**
 * Options pour le composant Firework
 */
export interface FireworkOptions extends BaseOptions {
    quality: FireworkQuality;
    shell: FireworkShellType;
    size: number;
    autoLaunch: boolean;
    finale: boolean;
    skyLighting: FireworkSkyLighting;
    longExposure: boolean;
    /** Traînées colorées pendant le vol (canvas trails) */
    trails: boolean;
    /** Empreintes persistantes sur le canvas après le passage des particules */
    imprints: boolean;
    scaleFactor: number;
    soundEnabled: boolean;
    soundMode: FireworkSoundMode;
    soundBaseUrl: string;
    soundSources?: Partial<Record<string, string[]>>;
    transparentBackground: boolean;
    /** Calque d'empilement (résolu en zIndex si z-index non explicite) */
    layer: FireworkLayer;
    zIndex: number;
    highDPI: boolean;
    autoStart: boolean;
    container?: HTMLElement;
    themeFlip: boolean;
    themeFlipTailMs: number;
    restoreTheme?: string;
    disableForReducedMotion: boolean;
    priorityLevel: PriorityLevel;
    onOpenStart: ((el: HTMLElement) => void) | null;
    onOpenEnd: ((el: HTMLElement) => void) | null;
    onCloseStart: ((el: HTMLElement) => void) | null;
    onCloseEnd: ((el: HTMLElement) => void) | null;
}

/**
 * Options pour le composant Snow
 */
export interface SnowOptions extends BaseOptions {
    /**
     * Nombre de particules de neige
     * @default 999
     */
    particleCount: number;

    /**
     * Vitesse de chute des particules
     * @default 1
     */
    speed: number;

    /**
     * Force du vent
     * @default 0
     */
    wind: number;

    /**
     * Variance du vent
     * @default 0.5
     */
    windVariance: number;

    /**
     * Z-index du canvas
     * @default 1000
     */
    zIndex: number;

    /**
     * Si true, démarre automatiquement
     * @default false
     */
    autoStart: boolean;

    /**
     * Mode d'activation (manual ou auto)
     * @default 'manual'
     */
    mode: 'manual' | 'auto';

    /**
     * Si true, le canvas se redimensionne automatiquement
     * @default true
     */
    resize: boolean;

    /**
     * Désactiver pour mouvement réduit
     * @default true
     */
    disableForReducedMotion: boolean;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant SlideshowCaptions
 */
export interface SlideshowCaptionsOptions extends BaseOptions {
    /**
     * `synergy` (défaut) : paires de lignes en séquence, croisement au milieu de la largeur de référence (1ʳᵉ gauche→droite, 2ᵉ droite→gauche).
     * `marquee` : défilement infini sur les 2 premières lignes seulement.
     */
    mode: 'marquee' | 'synergy';
    /**
     * Synergy : nombre max d’enfants directs pris en compte, traités par **paires** (2+2+…) ; chaque paire se croise au centre de la largeur de référence.
     * Marquee : seules les **2 premières** lignes sont utilisées.
     */
    maxCaptionLines: number;
    /** Vitesse du défilement infini (px/s), mode marquee uniquement */
    marqueeSpeed: number;
    /** Espace entre les deux segments dupliqués (px), mode marquee */
    marqueeSegmentGap: number;
    /** Durée GSAP d’un passage (secondes), mode synergy uniquement */
    duration: number;
    /** Espacement vertical entre les lignes (px) */
    lineGap: number;
    /** Réservé (px) ; ne modifie plus le centrage synergy — conserver pour compatibilité API / data-width-extra. */
    widthExtra: number;
    /** Lancer `play()` après init ; défaut `true`, désactiver uniquement si explicitement `false` (attribut ou options). */
    autoStart: boolean;
    /** Relancer automatiquement à la fin du cycle (synergy) ; défaut `true`, désactiver avec `data-loop=&quot;false&quot;` ou options. */
    loop: boolean;
    /**
     * `container` : croisement au milieu de l’élément racine.
     * `window` : croisement au milieu du viewport, exprimé dans le repère local du conteneur (bloc étroit possible).
     */
    viewport: 'window' | 'container';
    /**
     * Easing synergy : chaîne GSAP (ex. `sine.inOut`) ou `synergy.slowCross` (défaut, ralentissement au croisement,
     * proche du thème Synergy `SlowMo`) ; alias `synergy.theme`.
     */
    ease: string;
    /** Respecter prefers-reduced-motion quand true */
    disableForReducedMotion: boolean;
    priorityLevel: PriorityLevel;
    /** Début du cycle d’animation */
    onCycleStart?: ((instance: SlideshowCaptions) => void) | null;
    /** Fin du cycle (toutes les lignes ont terminé) */
    onCycleComplete?: ((instance: SlideshowCaptions) => void) | null;
}

/**
 * Options pour le composant Signature
 */
export interface SignatureOptions extends BaseOptions {
    /**
     * Couleur du stylo
     * @default 'black'
     */
    penColor: string;

    /**
     * Couleur de fond
     * @default 'white'
     */
    backgroundColor: string;

    /**
     * Largeur minimale du trait
     * @default 0.5
     */
    minWidth: number;

    /**
     * Largeur maximale du trait
     * @default 2.5
     */
    maxWidth: number;

    /**
     * Taille du point
     * @default 0.5
     */
    dotSize: number;

    /**
     * Distance minimale entre les points
     * @default 2
     */
    minDistance: number;

    /**
     * Délai de throttling en millisecondes
     * @default 16
     */
    throttle: number;

    /**
     * Poids du filtre de vélocité
     * @default 0.7
     */
    velocityFilterWeight: number;

    /**
     * Opération de composition
     * @default 'source-over'
     */
    compositeOperation: GlobalCompositeOperation;

    /**
     * Options du contexte canvas
     * @default {}
     */
    canvasContextOptions: CanvasRenderingContext2DSettings;

    /**
     * Label ARIA pour l'accessibilité
     * @default 'Zone de signature'
     */
    ariaLabel: string;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant PaginationNav (cartes Précédent / Suivant)
 */
export interface PaginationNavOptions extends BaseOptions {
    /** Page précédente @default null */
    previous: PaginationNavPage | null;
    /** Page suivante @default null */
    next: PaginationNavPage | null;
    /** Callback clic Previous */
    onPreviousClick: ((event: MouseEvent, instance: unknown) => void) | null;
    /** Callback clic Next */
    onNextClick: ((event: MouseEvent, instance: unknown) => void) | null;
    /** Niveau de priorité @default PriorityLevel.MEDIUM */
    priorityLevel: PriorityLevel;
    /** Callback avant ouverture */
    onOpenStart: ((instance: unknown) => void) | null;
    /** Callback après ouverture */
    onOpenEnd: ((instance: unknown) => void) | null;
    /** Callback avant fermeture */
    onCloseStart: ((instance: unknown) => void) | null;
    /** Callback après fermeture */
    onCloseEnd: ((instance: unknown) => void) | null;
}

/**
 * Page pour PaginationNav (lien précédent / suivant en carte)
 */
export interface PaginationNavPage {
    /** URL de la page */
    url: string;
    /** Titre affiché sous le label */
    title?: string;
    /** Label (ex. Précédent / Suivant) */
    label?: string;
    /** Si le lien est désactivé */
    disabled?: boolean;
}

/**
 * Taille pour PaginationAlpha (boutons lettres)
 */
export type PaginationAlphaSize = 'sm' | 'md' | 'lg';

/**
 * Orientation pour PaginationAlpha
 */
export type PaginationAlphaOrientation = 'horizontal' | 'vertical';

/**
 * Schéma de couleurs PaginationAlpha (MD3 Expressive)
 */
export type PaginationAlphaColorScheme = 'primary' | 'secondary' | 'neutral';

/**
 * Densité d'espacement PaginationAlpha
 */
export type PaginationAlphaDensity = 'compact' | 'normal' | 'spacious';

/**
 * Options pour le composant PaginationAlpha (index alphabétique A–Z)
 */
export interface PaginationAlphaOptions extends BaseOptions {
    /**
     * Liste de chaînes utilisées pour calculer les comptages par lettre (premier caractère)
     * @default []
     */
    items: string[];
    /**
     * Lettre active (A–Z)
     * @default 'A'
     */
    activeLetter: string;
    /**
     * Callback appelé lors de la sélection d'une lettre
     */
    onSelect: ((letter: string) => void) | null;
    /**
     * Taille des boutons : sm, md, lg
     * @default 'md'
     */
    size: PaginationAlphaSize;
    /**
     * Direction d'affichage : horizontal ou vertical
     * @default 'horizontal'
     */
    orientation: PaginationAlphaOrientation;
    /**
     * Afficher le nombre d'entrées par lettre
     * @default false
     */
    showCount: boolean;
    /**
     * Afficher les lettres sans entrée (désactivées)
     * @default true
     */
    showDisabled: boolean;
    /**
     * Activer les transitions (hover, active)
     * @default true
     */
    animated: boolean;
    /**
     * Schéma de couleurs : primary, secondary, neutral
     * @default 'primary'
     */
    colorScheme: PaginationAlphaColorScheme;
    /**
     * Densité d'espacement : compact, normal, spacious
     * @default 'normal'
     */
    density: PaginationAlphaDensity;
    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
    onOpenStart?: ((el: HTMLElement) => void) | null;
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    onCloseStart?: ((el: HTMLElement) => void) | null;
    onCloseEnd?: ((el: HTMLElement) => void) | null;
}

/**
 * Mode d'activation du composant InfiniteScroll
 */
export type InfiniteScrollTriggerEvent = 'click' | 'scroll' | 'both';

/**
 * Options pour le composant InfiniteScroll (scroll infini / load more)
 * Composant autonome : il n'est pas couplé au composant Pagination.
 */
export interface InfiniteScrollOptions extends BaseOptions {
    /**
     * Activer le composant
     * @default true
     */
    enabled: boolean;
    /**
     * Page courante (1-based)
     * @default 1
     */
    currentPage: number;
    /**
     * Nombre maximum de pages chargeables
     * @default 10
     */
    maxPages: number;
    /**
     * Seuil en pixels avant le bas du composant pour déclencher le chargement au scroll
     * @default 120
     */
    threshold: number;
    /**
     * Activer le chargement automatique au scroll
     * @default true
     */
    autoLoadOnScroll: boolean;
    /**
     * Événement déclencheur principal
     * @default 'both'
     */
    triggerEvent: InfiniteScrollTriggerEvent;
    /**
     * Désactive le composant
     * @default false
     */
    disabled: boolean;
    /**
     * Nom du paramètre GET utilisé pour charger la page suivante
     * @default false
     */
    get: string | false;
    /**
     * Sélecteur du container d'items dans la réponse HTTP
     * @default null
     */
    itemsContainerSelector: string | null;
    /**
     * Sélecteur des items à injecter
     * @default null
     */
    itemSelector: string | null;
    /**
     * Affiche le statut (page x/y ou fin)
     * @default true
     */
    showStatus: boolean;
    /**
     * Texte affiché pendant le chargement
     * @default 'Chargement...'
     */
    loadingText: string;
    /**
     * Texte affiché quand toutes les pages sont chargées
     * @default 'Tous les éléments ont été chargés'
     */
    finishedText: string;
    /**
     * Libellé du bouton de chargement
     * @default 'Afficher plus'
     */
    triggerLabel: string;
    /**
     * Active le prefetch de la prochaine page
     * @default true
     */
    prefetch: boolean;
    /**
     * Callback asynchrone/synchrone appelé lors du chargement d'une nouvelle page
     */
    onLoadMore: ((page: number, instance: InfiniteScroll) => Promise<void> | void) | null;
    /**
     * Callback appelé après changement de page
     */
    onPageChange: ((page: number, instance: InfiniteScroll) => void) | null;
    /**
     * Callback appelé en cas d'erreur de chargement
     */
    onError: ((error: unknown, instance: InfiniteScroll) => void) | null;
    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
    onOpenStart?: ((el: HTMLElement) => void) | null;
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    onCloseStart?: ((el: HTMLElement) => void) | null;
    onCloseEnd?: ((el: HTMLElement) => void) | null;
}

/**
 * Mode du composant Marquee.
 */
export type MarqueeMode = 'infinite' | 'classic';

/**
 * Direction du composant Marquee.
 */
export type MarqueeDirection = 'left' | 'right';

/**
 * Rotation visuelle du composant Marquee.
 */
export type MarqueeRotate = 'clockwise' | 'counterclockwise' | null;

/**
 * Options pour le composant Marquee.
 */
export interface MarqueeOptions extends BaseOptions {
    /**
     * Activer le composant.
     * @default true
     */
    enabled: boolean;
    /**
     * Mode de défilement.
     * @default 'infinite'
     */
    mode: MarqueeMode;
    /**
     * Direction de défilement.
     * @default 'left'
     */
    direction: MarqueeDirection;
    /**
     * Rotation visuelle du ruban.
     * Valeurs autorisées: 'clockwise' | 'counterclockwise' | null
     * @default null
     */
    rotate: MarqueeRotate;
    /**
     * Longueur visible du ruban rotaté (px).
     * @default 300
     */
    rotateLength: number;
    /**
     * Durée d'un cycle en secondes (mode sans speed explicite).
     * @default 20
     */
    duration: number;
    /**
     * Vitesse en pixels/seconde. Si null, duration est utilisée.
     * @default null
     */
    speed: number | null;
    /**
     * Espace en pixels entre les éléments.
     * @default 80
     */
    gap: number;
    /**
     * Met en pause au hover.
     * @default false
     */
    pauseOnHover: boolean;
    /**
     * Démarrage automatique.
     * @default true
     */
    autoplay: boolean;
    /**
     * Désactive le fade latéral.
     * @default false
     */
    noFade: boolean;
    /**
     * Active l'aller-retour en mode classic.
     * @default false
     */
    pingPong: boolean;
    /**
     * Nombre de boucles en mode classic (0 = infini).
     * @default 0
     */
    loop: number;
    /**
     * Délai de démarrage en millisecondes (classic uniquement).
     * @default 0
     */
    startDelay: number;
    /**
     * Niveau de priorité pour la gestion des instances.
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
    onOpenStart?: ((el: HTMLElement) => void) | null;
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    onCloseStart?: ((el: HTMLElement) => void) | null;
    onCloseEnd?: ((el: HTMLElement) => void) | null;
}

/** Direction du roulement ShuffleNumber */
export type ShuffleNumberDirection = 'up' | 'down';

/** Tendance de direction des chiffres (inspiré NumberFlow) */
export type ShuffleNumberTrend =
    | 'auto'
    | 'up'
    | 'down'
    | 'none'
    | number
    | ((oldValue: number, value: number) => number);

/** Fonction de couleur par index */
export type ShuffleNumberColorFn = (index: number, total: number) => string;

/** Options d'animation pour set() / flash() / update() */
export interface ShuffleNumberRollOptions {
    direction?: ShuffleNumberDirection;
    stagger?: number;
    duration?: number;
    exitOffset?: number;
    easing?: string;
    bounce?: number;
    color?: string | ShuffleNumberColorFn;
    colorFade?: number;
    skipUnchanged?: boolean;
    interrupt?: boolean;
    continuous?: boolean;
}

/** Options pour flash() */
export interface ShuffleNumberFlashOptions {
    /** Délai avant retour au texte précédent (ms) */
    revertAfter?: number;
    /** Options du roulement entrant */
    enter?: ShuffleNumberRollOptions;
    /** Options du roulement de retour */
    exit?: ShuffleNumberRollOptions;
}

/**
 * Options pour ShuffleNumber (animation type NumberFlow / machine à sous).
 * @see https://number-flow.barvian.me/
 */
export interface ShuffleNumberOptions extends BaseOptions {
    /**
     * Texte initial affiché (si `value` n'est pas fourni).
     * @default ''
     */
    text: string;
    /**
     * Valeur numérique initiale (prioritaire sur `text` si définie).
     * @default null
     */
    value: number | null;
    /**
     * Options Intl.NumberFormat pour formater `value`.
     */
    format?: Intl.NumberFormatOptions;
    /**
     * Locale(s) pour le formatage.
     */
    locales?: Intl.LocalesArgument;
    /**
     * Préfixe affiché avant le nombre (ex. `$`).
     * @default ''
     */
    prefix: string;
    /**
     * Suffixe affiché après le nombre (ex. `/mo`).
     * @default ''
     */
    suffix: string;
    /**
     * Contrôle la direction du roulement selon la variation.
     * @default 'auto'
     */
    trend: ShuffleNumberTrend;
    /**
     * Active les animations.
     * @default true
     */
    animated: boolean;
    /**
     * Respecte prefers-reduced-motion.
     * @default true
     */
    respectMotionPreference: boolean;
    /**
     * Passe par les chiffres intermédiaires (plugin continuous NumberFlow).
     * @default false
     */
    continuous: boolean;
    /**
     * Applique will-change sur les faces animées.
     * @default false
     */
    willChange: boolean;
    /**
     * Direction par défaut du roulement.
     * @default 'down'
     */
    direction: ShuffleNumberDirection;
    /**
     * Délai entre caractères (ms).
     * @default 45
     */
    stagger: number;
    /**
     * Durée par caractère (ms).
     * @default 300
     */
    duration: number;
    /**
     * Délai avant sortie de l'ancien caractère (ms).
     * @default 50
     */
    exitOffset: number;
    /**
     * Courbe d'accélération CSS.
     * @default 'cubic-bezier(0.34, 1.56, 0.64, 1)'
     */
    easing: string;
    /**
     * Amplitude du rebond / personnalité par lettre (0–1).
     * @default 0.6
     */
    bounce: number;
    /**
     * Durée du fondu couleur vers la couleur de repos (ms).
     * @default 280
     */
    colorFade: number;
    /**
     * Ne pas ré-animer les caractères identiques.
     * @default true
     */
    skipUnchanged: boolean;
    /**
     * Interrompre une animation en cours.
     * @default true
     */
    interrupt: boolean;
    /**
     * Délai par défaut avant revert pour flash() (ms).
     * @default 1400
     */
    revertAfter: number;
    /**
     * Active l'effet chromatique (arc-en-ciel) sur set/flash/update.
     * @default false
     */
    useChromatic: boolean;
    priorityLevel: PriorityLevel;
    onOpenStart: ((instance: import('../../components/ShuffleNumber').ShuffleNumber) => void) | null;
    onOpenEnd: ((instance: import('../../components/ShuffleNumber').ShuffleNumber) => void) | null;
    onCloseStart: ((instance: import('../../components/ShuffleNumber').ShuffleNumber) => void) | null;
    onCloseEnd: ((instance: import('../../components/ShuffleNumber').ShuffleNumber) => void) | null;
    /** Déclenché au début des animations de transition */
    onAnimationsStart: ((instance: import('../../components/ShuffleNumber').ShuffleNumber) => void) | null;
    /** Déclenché à la fin des animations de transition */
    onAnimationsFinish: ((instance: import('../../components/ShuffleNumber').ShuffleNumber) => void) | null;
}

/** @deprecated Utiliser ShuffleNumberDirection */
export type SlotDirection = ShuffleNumberDirection;
/** @deprecated Utiliser ShuffleNumberColorFn */
export type SlotColorFn = ShuffleNumberColorFn;
/** @deprecated Utiliser ShuffleNumberRollOptions */
export type SlotRollOptions = ShuffleNumberRollOptions;
/** @deprecated Utiliser ShuffleNumberFlashOptions */
export type SlotFlashOptions = ShuffleNumberFlashOptions;
/** @deprecated Utiliser ShuffleNumberOptions */
export type SlotOptions = ShuffleNumberOptions;

/**
 * Direction de défilement d'une colonne WheelPicker
 */
export type WheelPickerDirection = -1 | 1;

/**
 * Options pour le composant WheelPicker (sélecteur de caractères rotatif).
 */
export interface WheelPickerOptions extends BaseOptions {
    /**
     * Nombre de colonnes / caractères sélectionnables
     * @default 3
     */
    length: number;
    /**
     * Jeu de caractères autorisés (chaîne consécutive)
     * @default 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
     */
    allowedChars: string;
    /**
     * Valeur initiale (chaîne ou tableau de caractères)
     * @default ''
     */
    value: string | string[];
    /**
     * Afficher la pilule de prévisualisation au-dessus des colonnes
     * @default true
     */
    showPreview: boolean;
    /**
     * Afficher le bouton de soumission
     * @default true
     */
    showSubmitButton: boolean;
    /**
     * Libellé du bouton de soumission
     * @default 'Sauvegarder'
     */
    submitText: string;
    /**
     * Libellé affiché après soumission réussie
     * @default 'Enregistré !'
     */
    submittedText: string;
    /**
     * Callback appelé à chaque changement de valeur
     * @default null
     */
    onChange: ((value: string) => void) | null;
    /**
     * Callback appelé lors de la soumission
     * @default null
     */
    onSubmit: ((value: string) => void) | null;
    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Élément du fil d'Ariane (Breadcrumb)
 */
export interface BreadcrumbItem {
    /** Texte affiché */
    text: string;
    /** URL du lien (optionnel pour l'élément courant) */
    href?: string;
    /** Nom de l'icône K3UI (ex. "house", "bars") */
    icon?: string;
    /** True si c'est la page courante (non cliquable, mis en avant) */
    current?: boolean;
}

/**
 * Type de séparateur entre les éléments du fil d'Ariane
 */
export type BreadcrumbSeparator = 'chevron' | 'slash' | 'dot' | 'arrow';

/**
 * Variante visuelle du fil d'Ariane (MD3 Expressive)
 */
export type BreadcrumbVariant = 'plain' | 'tonal' | 'filled';

/**
 * Options pour le composant Breadcrumb (fil d'Ariane)
 */
export interface BreadcrumbOptions extends BaseOptions {
    /**
     * Liste des éléments du fil d'Ariane
     * @default []
     */
    items: BreadcrumbItem[];
    /**
     * Variante visuelle : plain, tonal, filled (MD3 Expressive)
     * @default 'plain'
     */
    variant: BreadcrumbVariant;
    /**
     * Type de séparateur entre les éléments : chevron, slash, dot, arrow
     * @default 'chevron'
     */
    separator: BreadcrumbSeparator;
    /**
     * Taille : small, medium, large
     * @default 'medium'
     */
    size: ComponentSize;
    /**
     * Afficher les icônes sur les éléments (si définies dans items)
     * @default true
     */
    showIcons: boolean;
    /**
     * Nombre d'éléments visibles avant collapse (reste : premier, ..., dernier). null = pas de collapse
     * @default null
     */
    collapseAfter: number | null;
    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
    /**
     * Callback appelé au clic sur un élément (event, item, index)
     */
    onItemClick: ((event: MouseEvent, item: BreadcrumbItem, index: number) => void) | null;
    /** Callback appelé avant l'ouverture */
    onOpenStart?: ((el: HTMLElement) => void) | null;
    /** Callback appelé après l'ouverture */
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    /** Callback appelé avant la fermeture */
    onCloseStart?: ((el: HTMLElement) => void) | null;
    /** Callback appelé après la fermeture */
    onCloseEnd?: ((el: HTMLElement) => void) | null;
}

/**
 * Options pour le composant List
 */
export interface ListOptions extends BaseOptions {
    /**
     * Variante visuelle : standard (items espacés) ou segmented (items connectés)
     * @default 'standard'
     */
    variant?: 'standard' | 'segmented';

    /**
     * Type de liste : single-action (une zone tappable) ou multi-action (content + trailing séparés)
     * @default 'single-action'
     */
    listType?: 'single-action' | 'multi-action';

    /**
     * Mode de sélection : none, single (un seul item) ou multiple (plusieurs items).
     * En 'single', un seul item peut être sélectionné à la fois.
     * @default 'none'
     */
    selectionMode?: 'none' | 'single' | 'multiple';

    /**
     * Items de la liste
     * @default []
     */
    items?: ListItem[];
    config?: ListConfig;
    selectedId?: string | number | null;
    checked?: Record<string | number, boolean>;
    switches?: Record<string | number, boolean>;

    /**
     * Si true, affiche les séparateurs entre les items
     * @default false
     */
    dividers?: boolean;

    /**
     * Si true, la liste est en mode dense (moins d'espacement)
     * @default false
     */
    dense?: boolean;

    /**
     * Si true, la liste est désactivée
     * @default false
     */
    disabled?: boolean;

    /**
     * Callback appelé lors du clic sur un item (zone principale, pas le trailing en multi-action)
     */
    onItemClick?: ((item: ListItem, index: number, instance: List) => void) | null;

    /**
     * Callback appelé lors de la sélection d'un item. En selectionMode 'single', la liste ne garde qu'un seul item sélectionné.
     */
    onItemSelect?: ((item: ListItem, index: number, instance: List) => void) | null;
    onSelect?: ((item: ListItem, index: number, instance: List) => void) | null;

    /**
     * Callback appelé lors du clic sur la zone trailing (multi-action) ou sur le switch trailing
     */
    onTrailingAction?: ((item: ListItem, index: number, instance: List) => void) | null;

    /**
     * Callback appelé quand l'état du trailing switch change
     */
    onTrailingSwitchChange?: ((item: ListItem, index: number, checked: boolean, instance: List) => void) | null;
    onSwitch?: ((item: ListItem, checked: boolean, instance: List) => void) | null;
    onCheck?: ((item: ListItem, checked: boolean, instance: List) => void) | null;

    /**
     * Mode expandable (FAQ) : 'accordion' (un seul item ouvert) ou 'multiple' (plusieurs ouverts)
     * @default 'multiple'
     */
    expandableMode?: 'accordion' | 'multiple';

    /**
     * Activer la transition expand/collapse (spring). Si false, pas de transition (instant).
     * @default true
     */
    animation?: boolean;

    /**
     * Activer la vibration au toggle si navigator.vibrate existe (mobile).
     * @default true
     */
    haptic?: boolean;

    /**
     * Durée d'ouverture du contenu expandable (ms)
     * @default 250
     */
    inDuration?: number;

    /**
     * Durée de fermeture du contenu expandable (ms)
     * @default 350
     */
    outDuration?: number;

    /**
     * Si true, permet le drag and drop des items
     * @default false
     */
    draggable?: boolean;

    /**
     * Callback appelé au début du drag d'un item
     */
    onDragStart?: ((item: ListItem, index: number, instance: List) => void) | null;

    /**
     * Callback appelé pendant le drag d'un item
     */
    onDrag?: ((item: ListItem, index: number, instance: List) => void) | null;

    /**
     * Callback appelé à la fin du drag d'un item
     */
    onDragEnd?: ((item: ListItem, index: number, instance: List) => void) | null;

    /**
     * Callback appelé quand un item est réorganisé (changé de position)
     */
    onDragReorder?: ((item: ListItem, oldIndex: number, newIndex: number, instance: List) => void) | null;
    onReorder?: ((items: ListItem[], instance: List) => void) | null;
    onDelete?: ((item: ListItem, instance: List) => void) | null;
    onArchive?: ((item: ListItem, instance: List) => void) | null;
    showSnackbarUndo?: boolean;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel?: PriorityLevel;

    /**
     * Callback appelé à l'ouverture (instance du composant List)
     */
    onOpen?: ((instance: List) => void) | null;

    /**
     * Callback appelé à la fermeture (instance du composant List)
     */
    onClose?: ((instance: List) => void) | null;
}

/** Variante visuelle ListMaker */
export type ListMakerVariant = 'filled' | 'tonal';

/** Taille ListMaker */
export type ListMakerSize = 'small' | 'medium' | 'large';

/**
 * Orientation du marqueur pill :
 * - `vertical` : ButtonIcon XS narrow (28×48) droit
 * - `horizontal` : même pill, rotation 90° (pas de wide)
 */
export type ListMakerOrientation = 'vertical' | 'horizontal';

/**
 * Options pour le composant ListMaker (liste à marqueur pill MD3)
 */
export interface ListMakerOptions extends BaseOptions {
    /**
     * Variante du marqueur : filled (primary) ou tonal (primary-container)
     * @default 'filled'
     */
    variant: ListMakerVariant;

    /**
     * Taille du marqueur et du libellé
     * @default 'medium'
     */
    size: ListMakerSize;

    /**
     * Orientation du pill marqueur (`horizontal` = rotation 90°, pas de wide)
     * @default 'vertical'
     */
    orientation: ListMakerOrientation;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;

    /**
     * Callback appelé avant l'ouverture
     */
    onOpenStart: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé après l'ouverture
     */
    onOpenEnd: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé avant la fermeture
     */
    onCloseStart: ((el: HTMLElement) => void) | null;

    /**
     * Callback appelé après la fermeture
     */
    onCloseEnd: ((el: HTMLElement) => void) | null;
}

/**
 * Item de liste
 */
export interface ListItem {
    /** ID unique de l'item */
    id?: string;
    /** Texte principal de l'item */
    primaryText: string;
    /** Texte secondaire de l'item (optionnel) - support 1 ou 2 lignes max */
    secondaryText?: string;
    /** Texte tertiaire de l'item (optionnel) */
    tertiaryText?: string;
    /** Overline (MD3 — texte au-dessus du titre, ex. "News • 2 hours ago") */
    overline?: string;
    /** Icône de début (leading icon) */
    leadingIcon?: string;
    /** Image de début (leading image/avatar) */
    leadingImage?: string;
    /** Avatar leading historique */
    avatar?: string | ListItemAvatar;
    /** Icône leading historique */
    icon?: string;
    /** Titre historique */
    headline?: string;
    /** Sous-ligne 1 historique */
    sub1?: string;
    /** Sous-ligne 2 historique */
    sub2?: string;
    /** Icône de fin (trailing icon) - peut être checkmark pour selected */
    trailingIcon?: string;
    /** Texte de fin (trailing text) - pour les raccourcis clavier par exemple */
    trailingText?: string;
    /** Meta (MD3 — texte trailing type heure, durée, ex. "3:45", "10:30") */
    meta?: string;
    /** Badge trailing historique */
    badge?: string | number;
    /** Heure trailing historique */
    time?: string;
    /** Si true, affiche un switch dans le slot trailing (MD3 Trailing switch) */
    trailingSwitch?: boolean;
    /** État du trailing switch (checked) */
    trailingSwitchChecked?: boolean;
    /** Si l'item est sélectionné */
    selected?: boolean;
    /** Si l'item est désactivé */
    disabled?: boolean;
    /** Si l'item a un séparateur après */
    divider?: boolean;
    /** Si l'item a un gap (espacement visible de type "îlot" Material Design 3) */
    gap?: boolean;
    /** Si l'item est un subheader (32px, non-interactif) */
    subheader?: boolean;
    /** Si l'item fait partie d'un groupe (role="group") */
    group?: boolean;
    /** Label du groupe (pour optgroup) */
    groupLabel?: string;
    /** Si l'item est expandable (contenu révélé au clic, animation spring MD3 Expressive) */
    expandable?: boolean;
    /** Contenu HTML ou texte du bloc expandable */
    expandableContent?: string;
    /** État étendu (true = ouvert) */
    expanded?: boolean;
    /** Données personnalisées */
    data?: ComponentCustomData;
    /** Classes CSS personnalisées */
    classes?: string;
}

export type ListItemData = ListItem;

export interface ListItemAvatar {
    src?: string;
    alt?: string;
    icon?: string;
    label?: string;
    color?: string;
    textColor?: string;
}

export interface ListConfig {
    variant?: 'standard' | 'segmented';
    grouped?: boolean;
    lines?: 1 | 2 | 3 | '1' | '2' | '3';
    selection?: 'none' | 'single' | 'multiple';
    withSwitches?: boolean;
    expandCollapse?: boolean;
    accordion?: boolean;
    swipe?: boolean;
    drag?: boolean;
    trailing?: 'none' | 'icon' | 'badge' | 'time' | 'arrow';
    leading?: 'none' | 'icon' | 'avatar' | 'image';
    overline?: boolean;
    withTasks?: boolean;
    selectionMode?: 'none' | 'single' | 'multiple';
    swipeActions?: boolean;
    dragAndDrop?: boolean;
}

export interface NavigationBarOptions extends BaseOptions, HapticFeedbackOptions {
    id?: string;
    activeIndex: number;
    displayMode: 'portable' | 'desktop' | 'always';
    compact: boolean;
    onChange?: ((destination: string | number, index: number) => void) | null;
    onClick?: ((destination: string | number, index: number) => void) | null;
    onOpenStart?: ((el: HTMLElement) => void) | null;
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    onCloseStart?: ((el: HTMLElement) => void) | null;
    onCloseEnd?: ((el: HTMLElement) => void) | null;
    priorityLevel: PriorityLevel;
}

export interface NavigationRailOptions extends BaseOptions {
    id?: string;
    activeIndex: number;
    expanded: boolean;
    /**
     * Mode d’expansion du rail.
     * - `push` : pousse le contenu (comportement historique)
     * - `modal` : overlay + scrim, sans pousser (comme Drawer)
     * @default 'push'
     */
    expandMode: 'push' | 'modal';
    /**
     * Opacité du scrim en mode `modal` (0–1).
     * @default 0.32
     */
    overlayOpacity: number;
    /**
     * En mode `modal`, un clic sur le scrim referme le rail.
     * @default true
     */
    dismissible: boolean;
    /**
     * En mode `modal`, bloque le scroll du document tant que le rail est étendu.
     * @default true
     */
    preventScrolling: boolean;
    /**
     * Affiche un divider trait au-dessus du footer (destinations secondaires).
     * Par défaut `false` : séparation par gap 4px (même modèle que `.menu-group`).
     * @default false
     */
    footerDividerEnabled: boolean;
    /**
     * Affiche la bordure inline-end du rail (et des îlots main/footer).
     * @default false
     */
    border: boolean;
    onChange?: ((destination: string | number, index: number) => void) | null;
    onClick?: ((destination: string | number, index: number) => void) | null;
    onToggleExpand?: ((expanded: boolean, instance: NavigationRail) => void) | null;
    onOpenStart?: ((el: HTMLElement) => void) | null;
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    onCloseStart?: ((el: HTMLElement) => void) | null;
    onCloseEnd?: ((el: HTMLElement) => void) | null;
    priorityLevel: PriorityLevel;
}

export interface NavigationMenuOptions extends BaseOptions, HapticFeedbackOptions {
    id?: string;
    onItemSelect?: ((item: HTMLElement, menu: NavigationMenu) => void) | null;
    onItemOpen?: ((item: HTMLElement, menu: NavigationMenu) => void) | null;
    onItemClose?: ((item: HTMLElement, menu: NavigationMenu) => void) | null;
    onChange?: ((item: HTMLElement | null, menu: NavigationMenu) => void) | null;
    onOpenStart?: ((el: HTMLElement) => void) | null;
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    onCloseStart?: ((el: HTMLElement) => void) | null;
    onCloseEnd?: ((el: HTMLElement) => void) | null;
    priorityLevel: PriorityLevel;
}

export interface SkeletonOptions extends BaseOptions {
    variant: 'text' | 'circular' | 'rectangular' | 'rounded';
    animation: 'pulse' | 'wave' | 'none';
    width?: number | string;
    height?: number | string;
    autoDisableForReducedMotion?: boolean;
    onOpenStart?: ((el: HTMLElement) => void) | null;
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    onCloseStart?: ((el: HTMLElement) => void) | null;
    onCloseEnd?: ((el: HTMLElement) => void) | null;
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Upload
 * @description Compose DropZone + Uploader + ProgressIndicator
 */
export interface UploadOptions extends BaseOptions {
    /**
     * URL de destination pour l'upload HTTP
     * @default ''
     */
    url: string;

    /**
     * Méthode HTTP
     * @default 'POST'
     */
    method: 'POST' | 'PUT';

    /**
     * Headers HTTP personnalisés
     * @default {}
     */
    headers: Record<string, string>;

    /**
     * Types MIME / extensions acceptés (ex: 'image/*', '.pdf,.doc')
     * @default tous types de fichiers (wildcard MIME)
     */
    accept: string;

    /**
     * Autoriser plusieurs fichiers
     * @default true
     */
    multiple: boolean;

    /**
     * Taille maximale par fichier en octets
     * @default 10485760 (10 Mo)
     */
    maxSize: number;

    /**
     * Nombre maximum de fichiers
     * @default 10
     */
    maxFiles: number;

    /**
     * Désactiver le composant
     * @default false
     */
    disabled: boolean;

    /**
     * Afficher la prévisualisation des images
     * @default true
     */
    showPreview: boolean;

    /**
     * Lancer l'upload automatiquement après sélection / drop
     * @default false
     */
    autoUpload: boolean;

    /**
     * Afficher les boutons Envoyer / Effacer (ignoré si autoUpload)
     * @default true
     */
    showActions: boolean;

    /**
     * Générer des thumbnails pour les images (Uploader)
     * @default true
     */
    generateThumbnails: boolean;

    /**
     * Taille des chunks en octets
     * @default 5242880 (5 Mo)
     */
    chunkSize: number;

    /**
     * Nombre maximum de tentatives
     * @default 3
     */
    maxRetries: number;

    /**
     * Texte principal de la zone de dépôt
     */
    label?: string;

    /**
     * Texte d'aide secondaire
     */
    hint?: string;

    /**
     * Liste blanche (extensions `.pdf` et/ou MIME `image/*`)
     * Si vide : pas de whitelist supplémentaire (blacklist + accept restent actifs)
     * @default []
     */
    whitelist: string[];

    /**
     * Liste noire additionnelle (fusionnée avec la blacklist dangereuse par défaut)
     * @default []
     */
    blacklist: string[];

    /**
     * Appliquer la blacklist dangereuse par défaut (exe, bat, php, js, …)
     * @default true
     */
    useDefaultBlacklist: boolean;

    /**
     * Vérifier les signatures magiques (contenu vs extension)
     * @default true
     */
    checkMagicBytes: boolean;

    /**
     * Bloquer les doubles extensions suspectes (`facture.pdf.exe`)
     * @default true
     */
    blockDoubleExtensions: boolean;

    /**
     * Rejeter les fichiers vides
     * @default true
     */
    rejectEmpty: boolean;

    /**
     * URL d’un endpoint antivirus serveur (FormData `file` → `{ safe: boolean }`)
     * @default ''
     */
    scanUrl: string;

    /**
     * Timeout du scan antivirus (ms)
     * @default 30000
     */
    scanTimeout: number;

    /**
     * Callback — fichiers acceptés
     */
    onFilesAdded?: ((files: File[], el: HTMLElement) => void) | null;

    /**
     * Callback — fichiers rejetés
     */
    onFilesRejected?: ((files: File[], reason: string, el: HTMLElement) => void) | null;

    /**
     * Callback — preview image prête
     */
    onPreviewReady?: ((file: File, preview: string, el: HTMLElement) => void) | null;

    /**
     * Callback — progression d'un fichier
     */
    onProgress?: ((file: File, progress: number, loaded: number, total: number) => void) | null;

    /**
     * Callback — succès d'un fichier
     */
    onSuccess?: ((file: File, response: unknown) => void) | null;

    /**
     * Callback — erreur d'un fichier
     */
    onError?: ((file: File, error: Error) => void) | null;

    /**
     * Callback — début du batch d'upload
     */
    onUploadStart?: ((files: File[], el: HTMLElement) => void) | null;

    /**
     * Callback — fin du batch d'upload
     */
    onUploadComplete?: ((files: File[], el: HTMLElement) => void) | null;

    onOpenStart?: ((el: HTMLElement) => void) | null;
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    onCloseStart?: ((el: HTMLElement) => void) | null;
    onCloseEnd?: ((el: HTMLElement) => void) | null;
    priorityLevel: PriorityLevel;
}

/** Placement horizontal d’une bulle de conversation */
export type BubblePlacement = 'start' | 'end';

/** Variante de couleur du corps de bulle */
export type BubbleColor =
    | 'default'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'neutral'
    | 'info'
    | 'success'
    | 'warning'
    | 'error';

/** Orientation du trait du séparateur */
export type DividerOrientation = 'horizontal' | 'vertical';

/** Placement du libellé sur le séparateur */
export type DividerPlacement = 'start' | 'end' | 'center';

/** Variante de couleur du séparateur */
export type DividerColor =
    | 'default'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'neutral'
    | 'info'
    | 'success'
    | 'warning'
    | 'error';

/**
 * Options pour le composant Divider (séparateur avec libellé optionnel)
 */
export interface DividerOptions extends BaseOptions {
    /**
     * Libellé affiché au centre, au début ou à la fin du trait
     * @default ''
     */
    text: string;

    /**
     * Orientation du trait : horizontal (entre blocs empilés) ou vertical (entre blocs côte à côte)
     * @default 'horizontal'
     */
    orientation: DividerOrientation;

    /**
     * Position du libellé le long du trait
     * @default 'center'
     */
    placement: DividerPlacement;

    /**
     * Couleur sémantique du trait et du libellé
     * @default 'default'
     */
    color: DividerColor;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.LOW
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Bubble (ligne de conversation)
 */
export interface BubbleOptions extends BaseOptions {
    /**
     * Alignement horizontal (start = début, end = fin)
     * @default 'start'
     */
    placement: BubblePlacement;

    /**
     * Couleur du corps de la bulle
     * @default 'default'
     */
    color: BubbleColor;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Entrée de citation (texte + auteur)
 */
export interface QuoteItem {
    /** Texte de la citation */
    quote: string;
    /** Nom de l'auteur */
    author: string;
}

/**
 * Couleurs / palettes du composant Alert
 */
export type AlertColor = 'primary' | 'alert' | 'info' | 'warning' | 'note' | 'tips' | 'hint';

/** @deprecated Utiliser AlertColor */
export type AlertVariant = AlertColor;

/**
 * Position de l'encoche titre sur l'encart Alert
 */
export type AlertNotchPosition =
    | 'top-start'
    | 'top-end'
    | 'bottom-start'
    | 'bottom-end'
    | 'top-center'
    | 'bottom-center'
    | 'left-center'
    | 'right-center';

/**
 * Options pour le composant Collapse (accordion M3 Expressive)
 */
export interface CollapseOptions extends BaseOptions {
    /**
     * Un seul item ouvert à la fois
     * @default true
     */
    exclusive: boolean;

    /**
     * Index ouvert au montage (mode exclusif). Ignoré si des items ont data-open.
     * @default null
     */
    openIndex: number | null;

    /**
     * Durée d'animation d'expansion (ms)
     * @default 450
     */
    animationDuration: number;

    /**
     * Nom d'icône IconManager pour le chevron trailing
     * @default 'chevron-down'
     */
    chevronIcon: string;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;

    /**
     * Callback après changement d'état (openIndex exclusif + liste des indexes ouverts)
     */
    onChange: ((openIndex: number | null, openIndexes: number[]) => void) | null;
}

/**
 * Options pour le composant Alert (encart d'information)
 */
export interface AlertOptions extends BaseOptions {
    /**
     * Palette tonal (primary par défaut si seuls titre et texte sont renseignés)
     * @default 'primary'
     */
    color: AlertColor;

    /**
     * Position de l'encoche titre
     * @default 'top-end'
     */
    position: AlertNotchPosition;

    /**
     * Titre affiché dans l'encoche (ex. HINT, INFO)
     * @default ''
     */
    title: string;

    /**
     * Contenu textuel de l'encart
     * @default ''
     */
    text: string;

    /**
     * @deprecated Utiliser color
     */
    variant?: AlertColor;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Quote (citation motivante)
 */
export interface QuoteOptions extends BaseOptions {
    /**
     * Texte de la citation (mode statique)
     * @default ''
     */
    quote: string;

    /**
     * Auteur de la citation (mode statique)
     * @default ''
     */
    author: string;

    /**
     * Liste de citations pour random / daily
     * @default []
     */
    quotes: QuoteItem[];

    /**
     * Tirer une citation aléatoire dans quotes[]
     * @default false
     */
    random: boolean;

    /**
     * Une seule citation par jour (localStorage)
     * @default false
     */
    daily: boolean;

    /**
     * Longueur maximale quote + author pour le tirage aléatoire
     * @default 140
     */
    maxLength: number;

    /**
     * Clic sur le composant pour afficher une nouvelle citation
     * @default false
     */
    refreshOnClick: boolean;

    /**
     * Callback après rafraîchissement de la citation
     */
    onRefresh: ((item: QuoteItem) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Badge
 */
export interface BadgeOptions extends BaseOptions {
    /**
     * Variante du badge ('small' pour un point uniquement, 'large' pour afficher du contenu)
     * @default 'large'
     */
    variant: 'small' | 'large';

    /**
     * Position du badge par rapport à l'élément parent
     * @default 'top-right'
     */
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

    /**
     * Contenu du badge (nombre ou texte). Pour la variante 'small', le contenu est ignoré
     * @default null
     */
    content: string | number | null;

    /**
     * Couleur de fond du badge
     * @default '#ee4540'
     */
    backgroundColor: string;

    /**
     * Couleur du texte du badge
     * @default '#ffffdd'
     */
    textColor: string;

    /**
     * Auto-désactiver les animations pour les utilisateurs avec prefers-reduced-motion
     * @default true
     */
    autoDisableForReducedMotion: boolean;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant ButtonFab (FAB / Extended FAB)
 */
export interface ButtonFabOptions extends BaseOptions, HapticFeedbackOptions {
    mode: 'fab' | 'extended' | 'morph';
    expandTrigger: 'scroll' | 'hover' | 'click';
    scrollContainer: HTMLElement | Window | null;
    size: 'small' | 'medium' | 'large';
    shape: 'rounded' | 'square';
    variant:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'primary-container'
    | 'secondary-container'
    | 'tertiary-container'
    | 'surface';
    icon: string;
    label: string;
    lowered: boolean;
    disabled: boolean;
    ripple: boolean;
    /**
     * Ancrage fixed coin d’écran (décale selon navigation-rail via --k3ui-rail-inset-*)
     * @default false
     */
    fixed: boolean;
    /**
     * Coin d’ancrage si fixed
     * @default 'bottom-right'
     */
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    onClick: ((event: Event, instance: unknown) => void) | null;
    onExpandStart: ((instance: unknown) => void) | null;
    onExpandEnd: ((instance: unknown) => void) | null;
    onShrinkStart: ((instance: unknown) => void) | null;
    onShrinkEnd: ((instance: unknown) => void) | null;
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Button
 */
export interface ButtonOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * Activer l'effet ripple
     * @default true
     */
    ripple: boolean;


    /**
     * Taille du bouton (xs/xsmall, sm/small, md/medium, lg/large, xl/xlarge)
     * @default 'md'
     */
    size: 'xs' | 'xsmall' | 'sm' | 'small' | 'md' | 'medium' | 'lg' | 'large' | 'xl' | 'xlarge';

    /**
     * Mode du bouton (default, narrow, wide)
     * @default 'default'
     */
    mode: 'default' | 'narrow' | 'wide';

    /**
     * Type de bouton (filled, tonal, elevated, outlined, text)
     * @default 'filled'
     */
    type: 'filled' | 'tonal' | 'elevated' | 'outlined' | 'text';

    /**
     * Forme du bouton (rounded, square, ou par défaut selon la taille)
     * @default undefined (utilise le border-radius par défaut de la taille)
     */
    shape?: 'rounded' | 'square';

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant ButtonIcon (bouton d'action / icon button)
 * Material Design 3 Expressive — référence unique pour les boutons avec icône uniquement
 */
export interface ButtonIconOptions extends BaseOptions, HapticFeedbackOptions {
    /** Activer l'effet ripple @default true */
    ripple: boolean;
    /** Taille : xs, sm, md, lg, xl @default 'md' */
    size: 'xs' | 'xsmall' | 'sm' | 'small' | 'md' | 'medium' | 'lg' | 'large' | 'xl' | 'xlarge';
    /** Largeur : narrow (étroit), default (défaut), wide (large) @default 'default' */
    width: 'narrow' | 'default' | 'wide';
    /** Variante : standard, filled, tonal, outlined. Filled + selected = état sélectionné @default 'standard' */
    variant: 'standard' | 'filled' | 'tonal' | 'outlined';
    /** État sélectionné (pour variant filled) @default false */
    selected: boolean;
    priorityLevel: PriorityLevel;
}

/** Shapes autorisées pour ButtonShape */
export type ButtonShapeName = 'sunny' | 'octagonal-circle';

/**
 * Options pour le composant ButtonShape (pastille M3 + slots shape overhang)
 */
export interface ButtonShapeOptions extends BaseOptions, HapticFeedbackOptions {
    /** Activer l'effet ripple @default true */
    ripple: boolean;
    /**
     * Morph press/release du border-radius (pastille → coin réduit), comme Button rounded
     * @default true
     */
    morph: boolean;
    /** Taille expressive : xs, sm, md, lg, xl @default 'md' */
    size: 'xs' | 'xsmall' | 'sm' | 'small' | 'md' | 'medium' | 'lg' | 'large' | 'xl' | 'xlarge';
    /** Variante : filled | tonal uniquement @default 'filled' */
    variant: 'filled' | 'tonal';
    /** Forme du slot leading — sunny | octagonal-circle @default 'sunny' */
    leadingShape?: ButtonShapeName;
    /** Forme du slot trailing — sunny | octagonal-circle @default 'sunny' */
    trailingShape?: ButtonShapeName;
    /** Chemin des assets SVG shapes (détection auto si omis) */
    assetsPath?: string;
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant ButtonArrow (split-button flèches M3 Expressive)
 * Paires ← → (horizontal) ou ↑ ↓ (vertical) pour parcourir une liste
 */
export interface ButtonArrowOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * Orientation des flèches
     * @default 'horizontal'
     */
    direction: 'horizontal' | 'vertical';

    /**
     * Variante visuelle M3
     * @default 'filled'
     */
    variant: 'filled' | 'tonal' | 'outlined';

    /**
     * Liste des valeurs à parcourir (cycle)
     * @default []
     */
    list: string[];

    /**
     * Index initial dans la liste
     * @default 0
     */
    initialIndex: number;

    /**
     * Callback lors d'un changement de valeur
     * @param value - Valeur courante
     * @param index - Index courant
     * @param instance - Instance ButtonArrow
     */
    onChange?: ((
        value: string,
        index: number,
        instance: import('../../components/ButtonArrow').ButtonArrow
    ) => void) | null;

    /** Niveau de priorité */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant ButtonGrid (grille 3×3 M3 Expressive)
 * FAB animé (reveal) ou pad toujours déployé (auto si prefers-reduced-motion)
 */
export interface ButtonGridOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * Libellés des 9 cellules (ordre lecture LTR)
     * @default ['1','2','3','4','5','6','7','8','9']
     */
    labels: string[];

    /**
     * Variante visuelle M3
     * @default 'filled'
     */
    variant: 'filled' | 'tonal' | 'outlined';

    /**
     * true = FAB trigger + animation reveal/collapse
     * false = pad toujours déployé
     * Forcé à false si prefers-reduced-motion: reduce
     * @default true
     */
    triggerFAB: boolean;

    /**
     * Callback lors de la sélection d'une cellule
     * @param index - Index 1–9
     * @param label - Libellé de la cellule
     * @param instance - Instance ButtonGrid
     */
    onSelect?: ((
        index: number,
        label: string,
        instance: import('../../components/ButtonGrid').ButtonGrid
    ) => void) | null;

    /** Niveau de priorité */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant ButtonPad (pad 4 directions M3 Expressive)
 * Mode cardinal (grille rotée 45° : ↑ → ↓ ←) ou diagonal (grille 0° : ↖ ↗ ↙ ↘)
 */
export interface ButtonPadOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * Mode de navigation
     * - `cardinal` : grille rotée 45° (↑ → ↓ ←)
     * - `diagonal` : grille à 0° (↖ ↗ ↙ ↘)
     * @default 'diagonal'
     */
    mode: 'cardinal' | 'diagonal';

    /**
     * Variante visuelle M3
     * @default 'filled'
     */
    variant: 'filled' | 'tonal' | 'outlined';

    /**
     * Callback lors d'une navigation directionnelle
     * @param direction - Direction émise (`up`|`down`|`left`|`right` ou `nw`|`ne`|`sw`|`se`)
     * @param instance - Instance ButtonPad
     */
    onNavigate?: ((
        direction: string,
        instance: import('../../components/ButtonPad').ButtonPad
    ) => void) | null;

    /** Niveau de priorité */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant ButtonSmart (tuile réglages rapides Material You)
 */
export interface ButtonSmartOptions extends BaseOptions, HapticFeedbackOptions {
    /** Libellé principal de la tuile @default '' */
    label: string;
    /** Sous-titre affiché quand la tuile est active @default 'Activé' */
    activeSubtitle: string;
    /** Sous-titre affiché quand la tuile est inactive ('' = masqué) @default '' */
    inactiveSubtitle: string;
    /** État actif (ON) @default false */
    active: boolean;
    /** Désactive la tuile @default false */
    disabled: boolean;
    /** Durée de vibration haptique en ms (0 = motif par défaut) @default 15 */
    hapticDuration: number;
    /** Niveau de priorité pour la gestion des instances */
    priorityLevel: PriorityLevel;
    /** Callback après bascule — reçoit l'élément et le nouvel état */
    onToggle?: ((el: HTMLElement, active: boolean) => void) | null;
}

/**
 * Élément d'un groupe de boutons (Material Design 3 Button Groups)
 */
export interface ButtonGroupItem {
    /** Libellé du bouton (optionnel si icône seule — M3 icon button in group) */
    label?: string;
    /** Nom de l'icône (IconManager) */
    icon?: string;
    /** Valeur optionnelle pour les callbacks */
    value?: string;
    /** Classes CSS additionnelles sur le bouton (ex: k3ui-isofilter__control) */
    className?: string;
    /** Attributs HTML optionnels (ex: data-isofilter-filter pour IsoFilter) */
    attributes?: Record<string, string>;
    /** Style inline additionnel (concaténé après les styles internes du bouton) */
    style?: string;
}

/**
 * Options pour le composant ButtonGroups (Material Design 3 Expressive)
 */
export interface ButtonGroupsOptions extends BaseOptions {
    /**
     * Liste des boutons du groupe
     * @default []
     */
    buttons: ButtonGroupItem[];

    /**
     * Variante M3 (filled, tonal, outlined, elevated)
     * @default 'filled'
     */
    variant: 'filled' | 'tonal' | 'outlined' | 'elevated';

    /**
     * Taille (xs, sm, md, lg, xl) — hauteurs M3: 28/36/40/48/56dp
     * @default 'md'
     */
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

    /**
     * Forme des boutons (round = pill M3, square = coins réduits)
     * @default 'round'
     */
    shape: 'round' | 'square';

    /**
     * Type de groupe : standard (gap) ou connected/segmented (liés, gap 2dp)
     * @default 'standard'
     * @note « segmented » est un alias accepté de « connected »
     */
    type: 'standard' | 'connected' | 'segmented';

    /**
     * Density M3 des boutons (0 par défaut, -1 à -3 plus compact)
     * @default 0
     */
    density?: 0 | -1 | -2 | -3;

    /**
     * Débordement : none (défaut), wrap (retour à la ligne), menu (boutons masqués + menu)
     * @default 'none'
     */
    overflowMode: 'none' | 'wrap' | 'menu';

    /**
     * Icône du bouton overflow (mode menu)
     * @default 'ellipsis-vertical'
     */
    overflowButtonIcon: string;

    /**
     * Ratio d’élargissement au press — groupe standard (M3 ExpandedRatio, 0.15)
     * @default 0.15
     */
    expandedRatio: number;

    /**
     * Autoriser la sélection multiple
     * @default false
     */
    multiSelect: boolean;

    /**
     * Indices des boutons sélectionnés par défaut
     * @default [0]
     */
    defaultSelected: number[];

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;

    /**
     * Callback appelé lorsque la sélection change (indices sélectionnés)
     */
    onSelect?: ((selectedIndices: number[]) => void) | null;

    /** Callback appelé avant ouverture */
    onOpenStart?: ((instance: unknown) => void) | null;
    /** Callback appelé après ouverture */
    onOpenEnd?: ((instance: unknown) => void) | null;
    /** Callback appelé avant fermeture */
    onCloseStart?: ((instance: unknown) => void) | null;
    /** Callback appelé après fermeture */
    onCloseEnd?: ((instance: unknown) => void) | null;
}

/**
 * Item d'une toolbar M3 (icône + tooltip ; dualAction = ButtonSplit)
 */
export type ToolbarItemWidth = 'default' | 'narrow' | 'wide';

/** Ton visuel item (Meet : destructive = raccrocher, emphasized = actif) */
export type ToolbarItemTone = 'default' | 'destructive' | 'emphasized';

/** Variantes de relief toolbar (= buttons elevated | filled | tonal) */
export type ToolbarVariant = 'elevated' | 'filled' | 'tonal';

export interface ToolbarItem {
    id: string;
    icon: string;
    /** Libellé accessible / fallback tooltip (jamais affiché comme label visible) */
    label?: string;
    tooltip?: string;
    disabled?: boolean;
    selected?: boolean;
    ariaLabel?: string;
    width?: ToolbarItemWidth;
    secondaryIcon?: string;
    secondaryAriaLabel?: string;
    dualAction?: boolean;
    tone?: ToolbarItemTone;
}

/**
 * Options Toolbar M3 Expressive (floating | docked)
 */
export interface ToolbarOptions extends BaseOptions {
    /** floating (pill) ou docked (pleine largeur) */
    layout: 'floating' | 'docked';
    /**
     * Relief conteneur (= buttons) : elevated | filled | tonal
     * @default 'tonal'
     */
    variant: ToolbarVariant;
    orientation: 'horizontal' | 'vertical';
    /** Conteneur pill visible (false = items seuls, style Google Meet) */
    showContainer: boolean;
    /** Items sur surface sombre (Google Meet) */
    inverseSurface: boolean;
    /** Initialiser Tooltips sur les items (recommandé ; défaut true) */
    showTooltips: boolean;
    /** Placement par défaut des tooltips */
    tooltipPlacement: TooltipPlacement;
    /** Items sélectionnables (toggle) */
    checkable: boolean;
    multiSelect: boolean;
    defaultSelected: number[];
    items: ToolbarItem[];
    onSelect?: ((selectedIndices: number[]) => void) | null;
    onItemClick?: ((payload: { item: ToolbarItem; index: number; part: 'primary' | 'secondary' }) => void) | null;
    onOpenStart?: ((el: HTMLElement) => void) | null;
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    onCloseStart?: ((el: HTMLElement) => void) | null;
    onCloseEnd?: ((el: HTMLElement) => void) | null;
}

/**
 * Configuration d'un contrôle de playground (groupe de boutons lié à une option)
 */
export interface PlaygroundControlConfig {
    /** Identifiant unique du contrôle (clé dans l'état) */
    id: string;
    /** Libellé affiché au-dessus du groupe */
    label: string;
    /** Boutons du groupe (label + value) */
    buttons: Array<{ label: string; value: string }>;
    /** Indice(s) sélectionné(s) par défaut @default [0] */
    defaultSelected?: number[];
    /** Variante M3 pour les boutons du groupe @default 'tonal' */
    variant?: 'filled' | 'tonal' | 'outlined' | 'elevated';
    /** Taille @default 'sm' */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Forme @default 'rounded' */
    shape?: 'rounded' | 'square';
    /** Type de groupe @default 'connected' */
    type?: 'standard' | 'connected';
}

/**
 * Options pour le composant Playground (zone de démo interactive : contrôles + preview)
 */
export interface PlaygroundOptions extends BaseOptions {
    /**
     * Liste des contrôles (chaque contrôle est rendu via ButtonGroups)
     * @default []
     */
    controls: PlaygroundControlConfig[];

    /**
     * Callback appelé lorsque l'état change (après sélection dans un contrôle)
     * state : { [controlId]: selectedValue }
     */
    onStateChange?: ((state: Record<string, string>) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant ButtonSplit (Material Design 3 Expressive — Split Button)
 * Spec M3 : main + trailing (chevron/arrow), gap 3dp, inner radius 4dp (L=8dp, XL=12dp)
 */
export interface ButtonSplitOptions extends BaseOptions {
    /**
     * Libellé du bouton principal
     * @default 'Label'
     */
    label: string;

    /**
     * Variante M3 (filled, tonal, outlined, elevated)
     * @default 'filled'
     */
    variant: 'filled' | 'tonal' | 'outlined' | 'elevated';

    /**
     * Taille M3 Expressive (xs=32, sm=40, md=56, lg=96, xl=136 dp)
     * @default 'md'
     */
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

    /**
     * Forme : rounded (pill) ou square
     * @default 'rounded'
     */
    shape: 'rounded' | 'square';

    /**
     * Type d’icône trailing : chevron, arrow ou ellipsis vertical
     * @default 'chevron'
     */
    iconType: 'chevron' | 'arrow' | 'ellipsis';

    /**
     * Nom de l’icône leading (IconManager), ex. "edit" / "pen"
     * @default 'edit'
     */
    leadingIcon?: string;

    /**
     * Niveau de priorité
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;

    /** Callback clic sur le bouton principal */
    onMainClick?: ((instance: import('../../components/ButtonSplit').ButtonSplit) => void) | null;
    /** Callback clic sur le bouton trailing (ouvrir/fermer) */
    onTrailingClick?: ((instance: import('../../components/ButtonSplit').ButtonSplit, open: boolean) => void) | null;
}

/**
 * Options pour le composant ButtonSegmented (Material Design 3 Expressive — Segmented Button)
 * Conteneur outlineVariant×40, padding 4dp, gap 4dp ; segment actif = pill primaryContainer
 */
export interface ButtonSegmentedOptions extends BaseOptions, HapticFeedbackOptions {
    /**
     * Liste des segments (label, optionnel icon, value)
     * @default []
     */
    segments: ButtonGroupItem[];

    /**
     * Forme : rounded (pill 20dp) ou square (6dp)
     * @default 'rounded'
     */
    shape: 'rounded' | 'square';

    /**
     * Sélection multiple (role group + checkbox) ou simple (radiogroup + radio)
     * @default false
     */
    multiSelect: boolean;

    /**
     * Indices sélectionnés par défaut
     * @default [0]
     */
    defaultSelected: number[];

    /**
     * Afficher une icône check pour indiquer les segments sélectionnés (data: show-check="true" | "false")
     * @default false
     */
    showCheck: boolean;

    /**
     * Niveau de priorité
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;

    /**
     * Libellé ARIA du conteneur (si vide, utilise la clé i18n buttonSegmented.ariaLabel)
     */
    ariaLabel?: string | null;

    /**
     * Callback appelé lorsque la sélection change (indices sélectionnés)
     */
    onSelect?: ((selectedIndices: number[]) => void) | null;

    /** Callback appelé avant ouverture */
    onOpenStart?: ((instance: unknown) => void) | null;
    /** Callback appelé après ouverture */
    onOpenEnd?: ((instance: unknown) => void) | null;
    /** Callback appelé avant fermeture */
    onCloseStart?: ((instance: unknown) => void) | null;
    /** Callback appelé après fermeture */
    onCloseEnd?: ((instance: unknown) => void) | null;
}

/**
 * Variantes d’AppBar Material 3 Expressive
 */
export type AppBarVariant = 'small' | 'center' | 'search' | 'medium' | 'large';

/**
 * Hauteurs de row pour AppBar
 */
export type AppBarRowHeight = 'small' | 'medium' | 'large';

/**
 * Options pour le composant AppBar (Top App Bar M3 — material.io/components/app-bars)
 * Comportements au scroll (lift, collapse flexible) appliqués automatiquement selon la variante.
 */
export interface AppBarOptions extends BaseOptions {
    /**
     * Variante M3 : search, small, center (small + titre centré), medium, large
     * @default 'small'
     */
    variant: AppBarVariant;

    /**
     * Hauteur de row (legacy / layout interne)
     * @default 'medium'
     */
    height: AppBarRowHeight;

    /**
     * Barre fixée à l’écran
     * @default false
     */
    fixed: boolean;

    /**
     * Distance de scroll (px) pour collapse complet medium/large (ratio = 1)
     * @default 112
     */
    collapseDistance: number;

    /**
     * Ratio de scroll normalisé 0–1 (0 = pas de scroll, 1 = collapse complet)
     * @default 0
     */
    scrollRatio: number;

    /**
     * Callback appelé lorsque le ratio de scroll change (medium/large)
     */
    onScrollRatioChange: ((ratio: number, instance: import('../../components/AppBar').AppBar) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Élément du menu FAB (pill action)
 */
export interface ButtonFabMenuItem {
    /** Identifiant unique */
    id: string;
    /** Libellé affiché */
    label: string;
    /** Nom de l’icône (IconManager), ex. "add", "edit", "link" */
    icon?: string;
    /** Type d’icône IconManager (classic, brand, …) — requis pour les icônes brand (ex. github) */
    iconType?: string;
}

/**
 * Options pour le composant ButtonFabMenu (Material Design 3 Expressive — FAB Speed Dial)
 * FAB principal qui s’ouvre en menu de pills (actions rapides), position configurable
 */
export interface ButtonFabMenuOptions extends BaseOptions {
    /**
     * Position du FAB : bottom-right | bottom-left | top-right | top-left
     * @default 'bottom-right'
     */
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

    /**
     * Liste des actions (pills) affichées à l’ouverture
     * @default []
     */
    items: ButtonFabMenuItem[];

    /**
     * Nom de l’icône du FAB principal (IconManager), ex. "add"
     * @default 'add'
     */
    fabIcon: string;

    /**
     * Icône affichée à l’ouverture du menu (action fermer), ex. "xmark" ou "cross".
     * Si omis et fabIcon !== "add", défaut "xmark". Si fabIcon === "add", rotation + → ×.
     */
    fabCloseIcon?: string | null;

    /**
     * Niveau de priorité
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;

    /**
     * Callback appelé au clic sur une action (pill)
     */
    onItemClick?: ((item: ButtonFabMenuItem, instance: import('../../components/ButtonFabMenu').ButtonFabMenu) => void) | null;
}

/** Action d'un speed dial (ButtonFabDial / ButtonFabRail) */
export interface ButtonFabSpeedDialItem {
    id: string;
    label: string;
    icon?: string;
    iconType?: string;
}

/** Action principale optionnelle (ButtonFabDial — remplace le trigger à l'ouverture) */
export interface ButtonFabDialMainAction {
    label: string;
    icon?: string;
    iconType?: string;
    onClick?: (() => void) | null;
}

/**
 * Options pour le composant ButtonFabDial (FAB Speed Dial en éventail / vertical)
 */
export interface ButtonFabDialOptions extends BaseOptions {
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    layout: 'flower' | 'vertical';
    items: ButtonFabSpeedDialItem[];
    fabIcon: string;
    mainAction?: ButtonFabDialMainAction | null;
    radius?: number | null;
    spread: [number, number];
    triggerSize: number;
    actionSize: number;
    minGap: number;
    gap: number;
    inset: number;
    showLabels: boolean;
    scrim: boolean;
    fixed: boolean;
    priorityLevel: PriorityLevel;
    onItemClick?: ((item: ButtonFabSpeedDialItem, instance: import('../../components/ButtonFabDial').ButtonFabDial) => void) | null;
}

/**
 * Options pour le composant ButtonFabRail (FAB Speed Dial linéaire)
 */
export interface ButtonFabRailOptions extends BaseOptions {
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    direction: 'right' | 'left' | 'up' | 'down' | null;
    items: ButtonFabSpeedDialItem[];
    fabIcon: string;
    triggerSize: number;
    actionSize: number;
    gap: number;
    inset: number;
    autoFit: boolean;
    scrim: boolean;
    fixed: boolean;
    priorityLevel: PriorityLevel;
    onItemClick?: ((item: ButtonFabSpeedDialItem, instance: import('../../components/ButtonFabRail').ButtonFabRail) => void) | null;
}

/**
 * Options pour le composant ScrollToTop (Material Design 3 Expressive)
 */
export interface ScrollToTopOptions extends Omit<BaseOptions, 'onOpenStart' | 'onOpenEnd' | 'onCloseStart' | 'onCloseEnd'> {
    /**
     * Seuil de scroll (px) avant apparition du bouton
     * @default 80
     */
    threshold: number;
    /**
     * Taille du bouton (px)
     * @default 56
     */
    size: number;
    /**
     * Épaisseur du ring de progression
     * @default 6
     */
    strokeWidth: number;
    /**
     * Offset horizontal (px)
     * @default 28
     */
    rightOffset: number;
    /**
     * Offset vertical (px)
     * @default 28
     */
    bottomOffset: number;
    /**
     * Espace supplémentaire avec un FAB adjacent (px)
     * @default 16
     */
    siblingGap: number;
    /**
     * Sélecteur CSS du FAB voisin pour calculer le décalage automatique
     */
    siblingFabSelector: string | null;
    /**
     * Afficher l'anneau de progression
     * @default true
     */
    showProgress: boolean;
    /**
     * Cible de scroll : window (null), sélecteur ou élément
     */
    scrollContainer: string | HTMLElement | null;
    /**
     * Durée du scroll vers le haut (ms)
     * @default 1000
     */
    scrollDuration: number;
    /**
     * Niveau de priorité
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;

    onShowStart?: ((instance: import('../../components/ScrollToTop').ScrollToTop) => void) | null;
    onShowEnd?: ((instance: import('../../components/ScrollToTop').ScrollToTop) => void) | null;
    onHideStart?: ((instance: import('../../components/ScrollToTop').ScrollToTop) => void) | null;
    onHideEnd?: ((instance: import('../../components/ScrollToTop').ScrollToTop) => void) | null;
    onScrollStart?: ((instance: import('../../components/ScrollToTop').ScrollToTop) => void) | null;
    onScrollEnd?: ((instance: import('../../components/ScrollToTop').ScrollToTop) => void) | null;
    onOpenStart?: ((el: HTMLElement) => void) | null;
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    onCloseStart?: ((el: HTMLElement) => void) | null;
    onCloseEnd?: ((el: HTMLElement) => void) | null;
}

/**
 * Configuration de validation pour Counter
 * - Fonction : (value) => true ou message d'erreur (string)
 * - Objet : min/max et/ou validator personnalisé
 */
export type CounterValidateFn = (value: number) => boolean | string;
export interface CounterValidateConfig {
    min?: number;
    max?: number;
    /** Retourne true si valide, ou un message d'erreur (string) */
    validator?: CounterValidateFn;
}
export type CounterValidateOption =
    | CounterValidateFn
    | CounterValidateConfig
    | null
    | undefined;

/**
 * Options pour le composant Counter (compteur +/-)
 */
export interface CounterOptions extends BaseOptions {
    /**
     * Valeur initiale
     * @default 0
     */
    value: number;
    /**
     * Autoriser les valeurs négatives
     * @default false
     */
    allowNegative: boolean;
    /**
     * Valeur minimale (optionnel)
     */
    min?: number;
    /**
     * Valeur maximale (optionnel)
     */
    max?: number;
    /**
     * Pas d'incrémentation
     * @default 1
     */
    step: number;
    /**
     * Nombre de décimales pour l'affichage et le step (0 = entiers)
     * @default 0
     */
    decimals: number;
    /**
     * Désactiver la modification (boutons désactivés)
     * @default false
     */
    readonly: boolean;
    /**
     * Désactiver tout le composant
     * @default false
     */
    disabled: boolean;
    /**
     * Validation : fonction (value) => true | message, ou { min, max, validator }
     */
    validate?: CounterValidateOption;
    /**
     * Taille du Counter (pill) : xs, sm, md, lg, xl — échelle propre au Counter (non alignée sur les tailles Button)
     * @default 'md'
     */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /**
     * Si true, onChange peut retourner une Promise ; la valeur est appliquée après résolution (changement asynchrone)
     * @default false
     */
    asyncChange: boolean;
    /**
     * Callback appelé lors du changement de valeur (peut retourner Promise si asyncChange)
     */
    onChange?: ((value: number, instance: Counter) => void | number | Promise<void | number>) | null;
    /**
     * Callback appelé en cas d'erreur de validation (message, valeur)
     */
    onValidateError?: ((message: string, value: number, instance: Counter) => void) | null;
    /**
     * Callback appelé quand l'erreur de validation est effacée
     */
    onValidationErrorEnd?: ((instance: Counter) => void) | null;
    /**
     * Callback appelé après incrément
     */
    onIncrement?: ((value: number, instance: Counter) => void) | null;
    /**
     * Callback appelé après décrément
     */
    onDecrement?: ((value: number, instance: Counter) => void) | null;
    ariaLabelDecrement?: string;
    ariaLabelValue?: string;
    ariaLabelIncrement?: string;
    /**
     * Niveau de priorité
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
    onOpenStart?: ((el: HTMLElement) => void) | null;
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    onCloseStart?: ((el: HTMLElement) => void) | null;
    onCloseEnd?: ((el: HTMLElement) => void) | null;
}

/**
 * Données de temps exposées par le composant Countdown (mois, jours, heures, minutes, secondes, millisecondes)
 * Convention : 1 mois = 30 jours
 */
export interface CountdownTimeData {
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
}

/**
 * Options pour le composant Countdown (compte à rebours)
 */
export interface CountdownOptions extends BaseOptions {
    /**
     * Durée du compte à rebours en millisecondes (nombre ou chaîne convertie)
     * @default 0
     */
    time: number | string;
    /**
     * Date de fin (Date ou chaîne ISO). Si définie, le countdown affiche le temps restant jusqu'à cette date (mois/jours réels).
     * Prioritaire sur `time` si les deux sont fournis.
     */
    endDate: Date | string | null;
    /**
     * Message affiché lorsque le countdown est terminé (ex. "Temps écoulé !").
     * Si vide, utilise la traduction `countdown.endMessage`.
     */
    endMessage: string;
    /**
     * Format d'affichage : MM (mois, 30j), DD (jours), HH, mm, ss, S|SS|SSS (millisecondes)
     * @default 'HH : mm : ss'
     */
    format: string;
    /**
     * Démarrer automatiquement au montage
     * @default true
     */
    autoStart: boolean;
    /**
     * Callback appelé à la fin du compte à rebours
     */
    onEnd: (() => void) | null;
    /**
     * Callback appelé à chaque mise à jour du temps (timeData)
     */
    onChange: ((data: CountdownTimeData, instance: Countdown) => void) | null;
    /**
     * Libellés courts pour minutes et secondes uniquement (ex. Min's., sec's.).
     * @default false
     */
    shortLabels: boolean;
    /**
     * Niveau de priorité
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
    onOpenStart?: ((el: HTMLElement) => void) | null;
    onOpenEnd?: ((el: HTMLElement) => void) | null;
    onCloseStart?: ((el: HTMLElement) => void) | null;
    onCloseEnd?: ((el: HTMLElement) => void) | null;
}

/**
 * Options pour le composant CodeBlock (affichage de code avec PrismJS)
 */
export interface CodeBlockOptions extends BaseOptions {
    /**
     * Afficher la barre d'outils (label + copier + télécharger)
     * @default true
     */
    showToolbar: boolean;
    /**
     * Afficher le bouton copier
     * @default true
     */
    showCopy: boolean;
    /**
     * Afficher un toast lorsque le code est copié avec succès
     * @default true
     */
    showToastOnCopy: boolean;
    /**
     * Afficher le bouton télécharger (télécharge le code en fichier)
     * @default true
     */
    showDownload: boolean;
    /**
     * Label optionnel affiché dans la toolbar (ex. nom du fichier, langage)
     * @default ''
     */
    label: string;
    /**
     * Activer le repli du code avec une barre « Voir plus » / « Réduire »
     * @default false
     */
    collapsible: boolean;
    /**
     * Hauteur (px) du bloc de code lorsqu’il est replié
     * @default 150
     */
    collapsedHeight: number;
    /**
     * Nombre minimal de lignes pour afficher le repli (si collapsible : true). En dessous, pas de barre « Voir plus ».
     * @default 5
     */
    collapsibleMinLines: number;
    /**
     * Niveau de priorité
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
    onOpenStart: ((el: HTMLElement) => void) | null;
    onOpenEnd: ((el: HTMLElement) => void) | null;
    onCloseStart: ((el: HTMLElement) => void) | null;
    onCloseEnd: ((el: HTMLElement) => void) | null;
}

/**
 * Mode de positionnement des items Masonry.
 * - transform : utilise transform: translate3d(x, y, 0) (meilleure fluidité, mais remplace le transform inline existant sur l'item, restauré à la destruction)
 * - top-left : utilise top / left (ne touche pas au transform inline existant)
 */
export type MasonPositionMode = 'transform' | 'top-left';

/**
 * Stratégie de mesure des hauteurs des items.
 */
export type MasonItemsHeightStrategy = 'boundingClientRect' | 'offsetHeight';

/**
 * Options pour le composant `Mason`.
 *
 * Mason est conçu pour remplacer un placement basé sur .row/CSS Grid par un placement Masonry minimal,
 * tout en conservant les classes de spans K3ui s* / m* / l* / xl* sur les items comme source de largeur.
 */
export interface MasonOptions extends BaseOptions {
    /**
     * Sélecteur CSS des items à positionner, résolu dans le nœud racine du composant (l'élément el fourni à Mason.init()).
     * @default '.k3ui-mason__item'
     */
    itemsSelector: string;

    /**
     * Nombre de colonnes logiques (K3ui utilise un système 12 colonnes pour ses grilles).
     * @default 12
     */
    columns: number;

    /**
     * Base de lecture des spans K3ui dans les classes `s* / m* / l* / xl*`.
     *
     * Par défaut, K3ui interprète `s12/m6/...` comme un découpage /12.
     * Si tu utilises `columns` différent de 12 (ex: 18), le moteur peut
     * scaler automatiquement les spans lus vers ce nouveau nombre de colonnes.
     *
     * Ex: `columns=18` et `spanBaseColumns=12` :
     * - class `m6` (6/12) devient un span effectif ~ 9/18.
     *
     * @default 12
     */
    spanBaseColumns: number;

    /**
     * Espace (en pixels) appliqué entre les items (horizontalement et verticalement).
     * @default 24
     * @description Correspond approximativement à 1.5rem si la base est à 16px.
     */
    gap: number;

    /**
     * Stratégie de mesure des hauteurs.
     * @default 'boundingClientRect'
     */
    itemsHeightStrategy: MasonItemsHeightStrategy;

    /**
     * Span de fallback (1..columns) appliqué si un item ne fournit pas de classe span utilisable pour le breakpoint courant.
     * @default 12
     */
    fallbackSpan: number;

    /**
     * Mode de positionnement des items dans le DOM.
     * @default 'transform'
     */
    positionMode: MasonPositionMode;

    /**
     * Activer un logging console (debug) pour faciliter le diagnostic des mesures et du layout.
     * @default false
     */
    debug: boolean;

    /**
     * Niveau de priorité pour la gestion des instances dans le registre.
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant Comparison (comparaison avant/après d'images).
 */
export interface ComparisonOptions extends BaseOptions {
    /** URL de l'image « avant » */
    beforeImage: string;
    /** URL de l'image « après » */
    afterImage: string;
    /** Libellé affiché sur l'image avant */
    beforeLabel: string;
    /** Libellé affiché sur l'image après */
    afterLabel: string;
    /** Texte alternatif de l'image avant */
    beforeAlt: string;
    /** Texte alternatif de l'image après */
    afterAlt: string;
    /** Position initiale du curseur (0–100) */
    position: number;
    /** Valeur minimale du curseur */
    min: number;
    /** Valeur maximale du curseur */
    max: number;
    /** Pas clavier */
    step: number;
    /** Afficher les libellés avant/après */
    showLabels: boolean;
    /** Ratio d'aspect CSS (ex. « 16 / 9 ») */
    aspectRatio: string;
    /** Désactiver les interactions */
    disabled: boolean;
    /** Callback lors du changement de position */
    onChange: ((position: number, instance: unknown) => void) | null;
    onOpenStart: ((instance: unknown) => void) | null;
    onOpenEnd: ((instance: unknown) => void) | null;
    onCloseStart: ((instance: unknown) => void) | null;
    onCloseEnd: ((instance: unknown) => void) | null;
    priorityLevel: PriorityLevel;
}

/** Période de facturation pour le composant Pricing */
export type PricingBillingPeriodOption = 'monthly' | 'yearly';

/**
 * Options pour le composant Pricing (grille tarifaire SaaS).
 */
export interface PricingOptions extends BaseOptions {
    /** Période de facturation initiale */
    billingPeriod: PricingBillingPeriodOption;
    /** Symbole ou préfixe monétaire affiché devant les prix */
    currency: string;
    /** Remise annuelle (0–1) utilisée si data-yearly absent sur un prix */
    yearlyDiscount: number;
    /** Appliquer la variante visuelle sombre (style Postiz) */
    darkTheme: boolean;
    /** Callback lors du changement de période de facturation */
    onBillingChange: ((period: PricingBillingPeriodOption, instance: unknown) => void) | null;
    onOpenStart: ((instance: unknown) => void) | null;
    onOpenEnd: ((instance: unknown) => void) | null;
    onCloseStart: ((instance: unknown) => void) | null;
    onCloseEnd: ((instance: unknown) => void) | null;
    priorityLevel: PriorityLevel;
}

/** Palette de couleurs de la jauge */
export type GaugePalette =
    | 'semantic'
    | 'inverted'
    | 'thermal'
    | 'lighthouse'
    | 'neutral'
    | 'primary';

/** Mode d’affichage central */
export type GaugeDisplay = 'fraction' | 'value';

/** Taille de la jauge */
export type GaugeSize = 'sm' | 'md' | 'lg';

/** Vitesse du ressort spatial M3 */
export type GaugeSpring = 'fast' | 'default' | 'slow';

/** État visuel de la jauge */
export type GaugeState = 'ok' | 'loading' | 'error' | 'nodata';

/** Surcharges de couleurs par instance (valeurs CSS quelconques) */
export interface GaugeColors {
    frame?: string;
    frameOpacity?: number | string;
    track?: string;
    trackActive?: string;
    icon?: string;
    text?: string;
    sublabel?: string;
    tick?: string;
    marker?: string;
}

/**
 * Options pour le composant Gauge (indicateur circulaire MD3 Expressive).
 * Arc 270°, caps ronds, ressort spatial, typo en cqi.
 */
export interface GaugeOptions extends BaseOptions {
    value: number;
    min: number;
    max: number;
    /** Décimales si `formatValue` est null */
    decimals: number;
    label: string;
    unit: string;
    icon: string;
    /** `fraction` = valeur/max en bas ; `value` = valeur centrée */
    display: GaugeDisplay;
    palette: GaugePalette;
    size: GaugeSize;
    spring: GaugeSpring;
    /** Disque de fond (cadre rond) */
    frame: boolean;
    /** Label en arc (haut) + unité en arc (bas) */
    curvedText: boolean;
    /** Nombre de graduations (0 = aucune) */
    ticks: number;
    /** Marqueur de seuil fixe sur l’arc (null = aucun) */
    threshold: number | null;
    state: GaugeState;
    /** Surcharges CSS variables `--g-*` */
    colors: GaugeColors;
    /** Formateur custom ; null → arrondi / décimales fr-FR */
    formatValue: ((v: number) => string) | null;
    onChange: ((value: number, instance: unknown) => void) | null;
    priorityLevel: PriorityLevel;
}

/** Variante de l'indicateur de progression MD3 */
export type ProgressIndicatorVariant = 'linear' | 'circular';

/** Palette sémantique MD3 */
export type ProgressIndicatorPalette = 'primary' | 'secondary' | 'tertiary' | 'error';

/**
 * Options pour le composant ProgressIndicator (MD3 Expressive).
 * Linear & circular, déterminé / indéterminé, flat / wavy.
 */
export interface ProgressIndicatorOptions extends BaseOptions {
    /** `linear` (barre) ou `circular` */
    variant: ProgressIndicatorVariant;
    /** Valeur courante (entre min et max) */
    value: number;
    min: number;
    max: number;
    /** Mode indéterminé (animation continue) */
    indeterminate: boolean;
    /** Forme expressive ondulée (sinon flat / neutral) */
    wavy: boolean;
    /** Piste épaisse 8dp (sinon 4dp) */
    thick: boolean;
    /** Taille circulaire en dp (24, 36, 40, 52) */
    size: number;
    /**
     * Point d’arrêt en fin de piste linéaire (MD3 stop indicator).
     * Applicable flat & wavy, mode déterminé uniquement.
     * @default true
     */
    stopIndicator: boolean;
    /**
     * Diamètre du stop indicator (dp). Tokens Android `trackStopIndicatorSize`.
     * @default 4
     */
    stopSize: number;
    /**
     * Affiche la valeur au centre (circular déterminé), à la manière du slot M3E.
     * @default false
     */
    showValue: boolean;
    /**
     * Formatage du label circulaire. Reçoit le ratio 0–1 et la valeur brute.
     * @default pourcentage entier (`Math.round(ratio * 100)`)
     */
    valueFormat: ((ratio: number, value: number, min: number, max: number) => string) | null;
    /** Palette MD3 — couleurs via tokens CSS */
    palette: ProgressIndicatorPalette;
    /** Surcharge couleur indicateur actif */
    color: string | null;
    /** Surcharge couleur piste inactive */
    trackColor: string | null;
    /** Nom accessible (aria-label) */
    label: string;
    onChange: ((value: number, instance: unknown) => void) | null;
    priorityLevel: PriorityLevel;
}

/** Type de points du QR code */
export type QrCodeDotsType =
    | 'square'
    | 'rounded'
    | 'dots'
    | 'classy'
    | 'classy-rounded'
    | 'extra-rounded';

/** Niveau de correction d'erreur QR */
export type QrCodeErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

/** Remplissage des modules QR */
export type QrCodeDotsFill = 'solid' | 'gradient';

/** Presets de dégradé des modules QR */
export type QrCodeDotsGradientPreset =
    | 'linear-vertical'
    | 'linear-horizontal'
    | 'diagonal-left'
    | 'diagonal-right'
    | 'radial';

/**
 * Options pour le composant QrCode (QR code stylisable).
 */
export interface QrCodeOptions extends BaseOptions {
    /** Contenu encodé dans le QR */
    data: string;
    /** Taille d'affichage en pixels */
    size: number;
    /** Résolution d'export PNG/PDF/EPS/JPEG */
    exportQuality: number;
    /** Couleur de fond */
    backgroundColor: string;
    /** Couleur des points */
    dotsColor: string;
    /** Couleur du contour des yeux */
    cornersSquareColor: string;
    /** Couleur du centre des yeux */
    cornersDotColor: string;
    /** Style des points */
    dotsType: QrCodeDotsType;
    /** Correction d'erreur */
    errorCorrectionLevel: QrCodeErrorCorrectionLevel;
    /** Forme du contour des yeux (svg-0 … svg-14) */
    frameShape: string;
    /** Forme du centre des yeux (svg-0 … svg-15) */
    ballShape: string;
    /** Logo central (URL, data URL ou SVG) */
    image: string | null;
    /** Masquer les points derrière le logo */
    hideBackgroundDots: boolean;
    /** Taille relative du logo (0–1) */
    imageSize: number;
    /** Marge autour du logo (conservée pour compat API) */
    imageMargin: number;
    /** Remplissage des modules : uni ou dégradé */
    dotsFill: QrCodeDotsFill;
    /** Couleur de fin de dégradé (modules) */
    dotsGradientEnd: string;
    /** Preset de dégradé des modules */
    dotsGradientPreset: QrCodeDotsGradientPreset;
    /** Modules adoucis (`false` = contours nets) */
    dotsRoundSize: boolean;
    /** Index du voile cover (`null` = aucun) */
    coverShape: number | null;
    /** Marge quiet zone en modules */
    quietMargin: number;
    /** Callback après rendu réussi */
    onRender: ((instance: unknown) => void) | null;
    /** Callback en cas d'erreur */
    onError: ((message: string, instance: unknown) => void) | null;
    priorityLevel: PriorityLevel;
}

/** Formats de code-barres supportés */
export type BarCodeFormatType =
    | 'CODE128'
    | 'CODE128A'
    | 'CODE128B'
    | 'CODE128C'
    | 'EAN13'
    | 'EAN8'
    | 'EAN5'
    | 'EAN2'
    | 'UPC'
    | 'UPCE'
    | 'CODE39'
    | 'ITF'
    | 'ITF14'
    | 'MSI'
    | 'MSI10'
    | 'MSI11'
    | 'MSI1010'
    | 'MSI1110'
    | 'pharmacode'
    | 'codabar';

/**
 * Options pour le composant BarCode (code-barres multi-formats).
 */
export interface BarCodeOptions extends BaseOptions {
    /** Valeur encodée */
    value: string;
    /** Format du code-barres */
    format: BarCodeFormatType;
    /** Couleur des barres */
    lineColor: string;
    /** Couleur de fond */
    background: string;
    /** Largeur d'une barre */
    barWidth: number;
    /** Hauteur des barres */
    barHeight: number;
    /** Afficher la valeur sous le code */
    displayValue: boolean;
    /** Taille de police de la valeur */
    fontSize: number;
    /** Marge texte */
    textMargin: number;
    /** Marge autour du code */
    margin: number;
    /** Callback après rendu réussi */
    onRender: ((instance: unknown) => void) | null;
    /** Callback en cas d'erreur */
    onError: ((message: string, instance: unknown) => void) | null;
    /** Callback si la valeur est invalide pour le format */
    onInvalid: ((instance: unknown) => void) | null;
    priorityLevel: PriorityLevel;
}

/**
 * Stratégie de matching des tags côté isofilter.
 * - `any` : l'élément est visible si AU MOINS un tag matche
 * - `all` : l'élément est visible si TOUS les tags matchent
 */
export type IsoFilterTagMatchMode = 'any' | 'all';

/**
 * Options pour le composant `IsoFilter`.
 *
 * `IsoFilter` pilote un filtrage "type Isotope" mais sans dépendance externe, et peut
 * coordonner un layout `mason` via une correspondance d'identifiants :
 * - source : `data-isofilter-id` + `data-isofilter-tags`
 * - cible Mason : items qui portent aussi `data-isofilter-id`
 */
// ============================================================================
// MEDIASTORIES (stories images / vidéo style Instagram)
// ============================================================================

/**
 * Type de média d'une story
 */
export type MediaStoryType = 'image' | 'video';

/**
 * En-tête affiché sur une story (auteur / catégorie)
 */
export interface MediaStoryHeader {
    /** Titre principal (ex. nom d'auteur) */
    heading: string;
    /** Sous-titre optionnel (ex. horodatage) */
    subheading?: string;
    /** Avatar circulaire optionnel */
    profileImage?: string;
}

/**
 * Une page de story (image ou vidéo)
 */
export interface MediaStory {
    /** URL de l'image ou de la vidéo */
    url: string;
    /** Type de média — défaut `image` */
    type?: MediaStoryType;
    /** Durée (ms) pour une image ; ignorée pour les vidéos (durée native) */
    duration?: number;
    /** En-tête optionnel */
    header?: MediaStoryHeader;
    /** Légende en bas de la carte */
    caption?: string;
    /** Lien « Voir plus » en bas */
    seeMoreUrl?: string;
    /** Poster pour le backdrop fullscreen (vidéos) */
    poster?: string;
    /** État like initial */
    liked?: boolean;
    /** URL à partager (sinon seeMoreUrl, sinon url, sinon location.href) */
    shareUrl?: string;
    /** Titre pour l'API Web Share */
    shareTitle?: string;
    /** Texte pour l'API Web Share */
    shareText?: string;
}

/**
 * Mode d'affichage MediaStories
 * - `viewer` : lecteur (embed ou fullscreen)
 * - `gallery` : covers horizontales → ouverture fullscreen
 */
export type MediaStoriesMode = 'viewer' | 'gallery';

/**
 * Album / cover de galerie (une cover ouvre une séquence de stories)
 */
export interface MediaStoryAlbum {
    /** Titre affiché sur la cover */
    title: string;
    /** Image de couverture */
    coverUrl: string;
    /**
     * Badge catégorie (ex. MUSIC) — label du subtitle cover
     */
    badge?: string;
    /** Icône du badge (IconManager) — slot leading ButtonShape octagonal-circle */
    badgeIcon?: string;
    /** Effet stack (plusieurs pages) */
    stacked?: boolean;
    /** Pages lues en fullscreen */
    stories: MediaStory[];
}

/**
 * Intro optionnelle de la galerie (carte sombre à gauche)
 */
export interface MediaStoriesGalleryIntro {
    title: string;
    subtitle?: string;
    icon?: string;
}

/**
 * Options pour le composant MediaStories
 */
export interface MediaStoriesOptions extends BaseOptions {
    /**
     * Mode d'affichage
     * @default 'viewer'
     */
    mode: MediaStoriesMode;

    /**
     * Albums pour le mode `gallery` (sinon dérivés de `stories`)
     * @default []
     */
    albums: MediaStoryAlbum[];

    /**
     * Carte d'intro en tête de galerie
     * @default null
     */
    galleryIntro: MediaStoriesGalleryIntro | null;

    /**
     * Liste des stories à afficher (mode viewer, ou fallback gallery)
     * @default []
     */
    stories: MediaStory[];

    /**
     * Durée (ms) des images sans `duration` propre
     * @default 4000
     */
    defaultInterval: number;

    /**
     * Largeur de la carte (px ou longueur CSS) — mode embed
     * @default 360
     */
    width: number | string;

    /**
     * Hauteur de la carte (px ou longueur CSS) — mode embed
     * @default 640
     */
    height: number | string;

    /**
     * Boucler à la fin de la séquence
     * @default false
     */
    loop: boolean;

    /**
     * Navigation clavier (flèches / Échap)
     * @default true
     */
    keyboardNavigation: boolean;

    /**
     * Afficher le bouton fermer
     * @default true
     */
    showCloseButton: boolean;

    /**
     * Index de départ
     * @default 0
     */
    currentIndex: number;

    /**
     * Présentation plein écran (backdrop flou + flèches desktop)
     * @default false
     */
    fullscreen: boolean;

    /**
     * Ratio de la carte en mode fullscreen (syntaxe CSS aspect-ratio)
     * @default '9 / 16'
     */
    aspectRatio: string;

    /**
     * Afficher les flèches prev/next (ButtonIcon md)
     * @default true
     */
    showArrows: boolean;

    /**
     * Afficher le bouton like
     * @default true
     */
    showLikeButton: boolean;

    /**
     * Afficher le bouton partager
     * @default true
     */
    showShareButton: boolean;

    /**
     * Démarrer la lecture à l'initialisation
     * @default true
     */
    autoStart: boolean;

    /**
     * Seuil (ms) au-delà duquel un appui compte comme pause (hold)
     * @default 200
     */
    holdThresholdMs: number;

    /**
     * Distance verticale (px) pour fermer par swipe bas
     * @default 90
     */
    swipeDownClosePx: number;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;

    /** Callback au début d'une story */
    onStoryStart: ((index: number, story: MediaStory) => void) | null;

    /** Callback à la fin d'une story */
    onStoryEnd: ((index: number, story: MediaStory) => void) | null;

    /** Callback lorsque toutes les stories sont terminées (sans loop) */
    onAllStoriesEnd: (() => void) | null;

    /** Callback navigation suivante */
    onNext: ((index: number) => void) | null;

    /** Callback navigation précédente */
    onPrevious: ((index: number) => void) | null;

    /** Callback fermeture (avant destroy / hide) */
    onClose: (() => void) | null;

    /** Callback like / unlike */
    onLike: ((index: number, story: MediaStory, liked: boolean) => void) | null;

    /** Callback partage (après tentative share/clipboard) */
    onShare: ((index: number, story: MediaStory, sharedUrl: string) => void) | null;

    /** Callback avant ouverture */
    onOpenStart: ((el: HTMLElement) => void) | null;

    /** Callback après ouverture */
    onOpenEnd: ((el: HTMLElement) => void) | null;

    /** Callback avant fermeture */
    onCloseStart: ((el: HTMLElement) => void) | null;

    /** Callback après fermeture */
    onCloseEnd: ((el: HTMLElement) => void) | null;
}

export interface IsoFilterOptions extends BaseOptions {
    /**
     * Sélecteur des éléments sources de données (fournissent id + tags).
     * @default '[data-isofilter-id]'
     */
    itemsSelector: string;

    /**
     * Sélecteur du conteneur Mason à piloter.
     * @default '.k3ui-mason'
     */
    masonContainerSelector: string;

    /**
     * Sélecteur des items Mason ciblés (doivent avoir `data-isofilter-id`).
     * @default '[data-isofilter-id]'
     */
    masonItemsSelector: string;

    /**
     * Sélecteur des contrôles UI (boutons, chips, etc.).
     * Chaque contrôle doit exposer une valeur via `data-isofilter-filter`.
     * @default '[data-isofilter-filter]'
     */
    controlsSelector: string;

    /**
     * Valeur spéciale signifiant "afficher tout".
     * @default 'all'
     */
    allFilterValue: string;

    /**
     * Matching des tags quand un filtre contient plusieurs tags.
     * @default 'any'
     */
    matchMode: IsoFilterTagMatchMode;

    /**
     * Attribut de filtre sur les contrôles.
     * @default 'data-isofilter-filter'
     */
    controlFilterAttribute: string;

    /**
     * Attribut ID sur les sources + items Mason.
     * @default 'data-isofilter-id'
     */
    idAttribute: string;

    /**
     * Attribut tags sur les sources.
     * @default 'data-isofilter-tags'
     */
    tagsAttribute: string;

    /**
     * Attribut de "hidden" côté Mason (coordination).
     * @default 'data-k3ui-mason-hidden'
     */
    masonHiddenAttribute: string;

    /**
     * Durée (ms) pour l'animation FLIP (transform) + opacity, et pour la transition de hauteur
     * du conteneur Mason (évite le changement de hauteur “brut”).
     * @default 350
     */
    animationDurationMs: number;

    /**
     * Fallback : si aucun élément ne matche le filtre (hors `all`), afficher tout.
     * @default true
     */
    fallbackToAllOnNoMatch: boolean;

    /**
     * Activer des logs console.
     * @default false
     */
    debug: boolean;

    /**
     * Niveau de priorité pour la gestion des instances dans le registre.
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

// ============================================================================
// MESSAGEBOX (boîte de dialogue type Zelda ALTTP)
// ============================================================================

/**
 * Position de la MessageBox à l'écran.
 * @description `center` centre parfaitement la boîte (horizontalement et verticalement).
 */
export type MessageBoxPosition =
    | 'center'
    | 'top'
    | 'top-left'
    | 'top-right'
    | 'bottom'
    | 'bottom-left'
    | 'bottom-right'
    | 'left'
    | 'right';

/**
 * Disposition des options de choix.
 * @description `vertical` : navigation haut/bas. `horizontal` : navigation gauche/droite.
 */
export type MessageBoxOrientation = 'vertical' | 'horizontal';

/**
 * Type d'overlay (fond) affiché derrière la boîte au déclenchement.
 * @description `none` : aucun. `scrim` : voile noir. `blur` : flou de l'arrière-plan.
 *              `both` : voile noir + flou.
 */
export type MessageBoxOverlay = 'none' | 'scrim' | 'blur' | 'both';

/**
 * Une option de choix proposée à la fin d'un message.
 */
export interface MessageBoxChoice {
    /** Texte affiché de l'option */
    label: string;
    /** Valeur optionnelle renvoyée (sinon l'index sous forme de chaîne) */
    value?: string;
}

/**
 * Options du show() (au-delà du message et des choix).
 */
export interface MessageBoxShowOptions {
    /** Disposition des choix (défaut : `vertical`) */
    orientation?: MessageBoxOrientation;
}

/**
 * Options pour le composant MessageBox.
 * @description Reproduit fidèlement la boîte de dialogue ALTTP (effet machine à
 * écrire, pagination, système de choix, sons) avec un positionnement à l'écran.
 */
export interface MessageBoxOptions extends BaseOptions {
    /**
     * Délai (ms) entre chaque caractère.
     * @default 45
     */
    charDelay: number;

    /**
     * Pause (ms) après une ponctuation.
     * @default 220
     */
    punctuationDelay: number;

    /**
     * Nombre maximum de caractères par ligne (wrapping mot à mot).
     * @default 28
     */
    maxCharsPerLine: number;

    /**
     * Nombre de lignes visibles par page (borné entre 1 et 5).
     * @default 3
     */
    maxLines: number;

    /**
     * Jouer un son toutes les N lettres.
     * @default 2
     */
    soundEvery: number;

    /**
     * Échelle de rendu du pixel-art.
     * @default 2
     */
    scale: number;

    /**
     * Activer la détection de swipe (un glissement avance comme un clic).
     * @default true
     */
    swipe: boolean;

    /**
     * Fermer la boîte (et résoudre `show()` avec `null`) via la touche Échap.
     * @default true
     */
    closeOnEscape: boolean;

    /**
     * Désactiver l'effet machine à écrire et les animations si mouvement réduit actif.
     * @default true
     */
    autoDisableForReducedMotion: boolean;

    /**
     * Position de la boîte à l'écran.
     * @default 'center'
     */
    position: MessageBoxPosition;

    /**
     * Disposition par défaut des choix.
     * @default 'vertical'
     */
    choiceOrientation: MessageBoxOrientation;

    /**
     * Overlay (fond) affiché derrière la boîte pendant l'affichage.
     * @default 'none'
     */
    overlay: MessageBoxOverlay;

    /**
     * Opacité du voile noir (overlay `scrim` ou `both`), entre 0 et 1.
     * @default 0.5
     */
    overlayOpacity: number;

    /**
     * Intensité du flou de l'arrière-plan en pixels (overlay `blur` ou `both`).
     * @default 4
     */
    overlayBlur: number;

    /**
     * Activer les sons (Web Audio API).
     * @default true
     */
    soundEnabled: boolean;

    /**
     * Chemin de base des sons (utilisé si `letterSound`/`doneSound` ne contiennent pas de `/`).
     * @default '/k3ui-docs/assets/sounds/'
     */
    soundsPath: string;

    /**
     * Fichier (ou URL) du son joué à chaque lettre.
     * @default 'message_letter.ogg'
     */
    letterSound: string;

    /**
     * Fichier (ou URL) du son de fin de page / de choix.
     * @default 'message_end.ogg'
     */
    doneSound: string;

    /**
     * Volume des sons (0..1).
     * @default 0.5
     */
    volume: number;

    /**
     * Message initial à afficher automatiquement (utilisé par l'AutoInit via `data-message`).
     * @default ''
     */
    message: string;

    /**
     * Choix initiaux proposés à la fin du message initial.
     * @default []
     */
    choices: MessageBoxChoice[];

    /**
     * Classes CSS additionnelles appliquées à la racine.
     * @default ''
     */
    classes: string;

    /**
     * Niveau de priorité pour la gestion des instances dans le registre.
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/** Format d'affichage du Ticker */
export type TickerFormat = 'number' | 'percent' | 'currency';
/** Indicateur de sens du Ticker */
export type TickerIndicator = 'sign' | 'caret' | 'none';
/** Tendance calculée du Ticker */
export type TickerTrend = 'up' | 'down' | 'flat';
/** Taille du Ticker */
export type TickerSize = 'sm' | 'md' | 'lg';
/** Disposition du Ticker */
export type TickerLayout = 'inline' | 'stacked';

/**
 * Options pour le composant Ticker (cotation / KPI signé).
 */
export interface TickerOptions extends BaseOptions {
    /**
     * Intitulé de la mesure
     * @default ''
     */
    label: string;

    /**
     * Valeur signée. Pour `percent`, exprimée en points (1.24 → 1,24 %).
     * @default 0
     */
    value: number;

    /**
     * Formatage via Intl.NumberFormat
     * @default 'percent'
     */
    format: TickerFormat;

    /**
     * Indicateur de sens : caret CSS, signe +/−, ou aucun
     * @default 'caret'
     */
    indicator: TickerIndicator;

    /**
     * Nombre de décimales. null → 2 (ou 0 si format number)
     * @default null
     */
    precision: number | null;

    /**
     * Locale de formatage
     * @default 'fr-FR'
     */
    locale: string;

    /**
     * Code ISO devise (format currency)
     * @default 'EUR'
     */
    currency: string;

    /**
     * Texte secondaire (variation en points, volume…)
     * @default null
     */
    delta: string | null;

    /**
     * Zone morte autour de zéro traitée comme stable
     * @default 0
     */
    flatThreshold: number;

    /**
     * Répète le signe devant le nombre (en plus de l'indicateur)
     * @default false
     */
    signOnValue: boolean;

    /**
     * Échelle visuelle
     * @default 'md'
     */
    size: TickerSize;

    /**
     * Disposition inline ou empilée
     * @default 'inline'
     */
    layout: TickerLayout;

    /**
     * Annonce les mises à jour aux lecteurs d'écran (aria-live)
     * @default false
     */
    live: boolean;

    /**
     * Callback après changement de valeur (setValue)
     * @default null
     */
    onChange: ((value: number, instance: unknown) => void) | null;

    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}

/** Variante visuelle du Stack */
export type StackVariant = 'overlap' | 'deck';

/**
 * Direction d’empilement
 * - deck : top | bottom | left | right (peek compact)
 * - overlap : start | end (alias left | right en LTR)
 */
export type StackDirection = 'top' | 'bottom' | 'left' | 'right' | 'start' | 'end';

/** Alignement du conteneur overlap */
export type StackAlign = 'start' | 'center' | 'end';

/**
 * Options pour le composant Stack (pile overlap ou deck).
 */
export interface StackOptions extends BaseOptions {
    /**
     * Variante : overlap (ligne chevauchée) ou deck (profondeur compacte)
     * @default 'overlap'
     */
    variant: StackVariant;

    /**
     * Direction : top/bottom/left/right (deck) ou start/end (overlap)
     * @default 'start'
     */
    direction: StackDirection;

    /**
     * Alignement horizontal du groupe (overlap)
     * @default 'start'
     */
    align: StackAlign;

    /**
     * Couches visibles derrière le dessus (deck) — plafonné à 3
     * @default 3
     */
    depth: number;

    /**
     * Décalage en px (marge overlap ou peek deck)
     * @default 12 (overlap) / 6 (deck via layoutDeck)
     */
    offset: number;

    /**
     * Réduction d’échelle par couche (deck)
     * @default 0.05
     */
    scaleStep: number;

    /**
     * Réduction d’opacité par couche (deck) — 0 = style shadcn opaque
     * @default 0
     */
    opacityStep: number;

    /**
     * Nombre max d’items visibles ; null = illimité. Active le +N si showRemaining.
     * @default null
     */
    max: number | null;

    /**
     * Afficher l’indicateur +N lorsque max est dépassé (overlap)
     * @default false
     */
    showRemaining: boolean;

    /**
     * Scroll horizontal si la pile overlap déborde
     * @default true
     */
    scroll: boolean;

    /**
     * Sélecteur des enfants empilés
     * @default ':scope > *:not(.stack__remaining)'
     */
    itemSelector: string;

    /**
     * Niveau de priorité
     * @default PriorityLevel.LOW
     */
    priorityLevel: PriorityLevel;
}

/**
 * Options pour le composant SwipeDeck (pile de cartes type swipe).
 */
export interface SwipeDeckOptions extends BaseOptions {
    /** Distance (px) pour valider un swipe */
    threshold: number;
    /** Facteur de rotation pendant le drag (degrés / px) */
    rotationFactor: number;
    /** Nombre de cartes visibles empilées derrière */
    stackDepth: number;
    /** Autoriser undo de la dernière carte */
    allowUndo: boolean;
    /** Callback swipe gauche */
    onSwipeLeft: ((el: HTMLElement, instance: SwipeDeckInstance) => void) | null;
    /** Callback swipe droite */
    onSwipeRight: ((el: HTMLElement, instance: SwipeDeckInstance) => void) | null;
    /** Callback swipe haut */
    onSwipeUp: ((el: HTMLElement, instance: SwipeDeckInstance) => void) | null;
    /** Callback pile vide */
    onStackEmpty: ((instance: SwipeDeckInstance) => void) | null;
    /** Niveau de priorité */
    priorityLevel: PriorityLevel;
}

/** Référence légère pour callbacks SwipeDeck (évite import circulaire) */
export interface SwipeDeckInstance {
    swipe(direction: 'left' | 'right' | 'up'): void;
    undo(): boolean;
    getRemainingCount(): number;
}

/**
 * Données d'une entrée IndexList (mode data-driven)
 */
export interface IndexListItemData {
    /** Libellé affiché */
    label: string;
    /** Clé de groupe explicite (sinon dérivée du libellé) */
    key?: string;
    /** HTML optionnel pour le contenu de l'item */
    html?: string;
}

/**
 * Options pour le composant IndexList (annuaire sticky + rail)
 */
export interface IndexListOptions extends BaseOptions {
    /**
     * Entrées data-driven ; si absent, le markup existant est enrichi
     */
    items?: IndexListItemData[];
    /**
     * Attribut DOM pour la clé d'indexation sur un item
     * @default 'data-index-key'
     */
    indexKeyAttr: string;
    /**
     * Locale pour uppercase / tri
     * @default 'fr-FR'
     */
    locale: string;
    /**
     * Afficher le rail latéral de navigation
     * @default true
     */
    showRail: boolean;
    /**
     * En-têtes de section sticky (effet push)
     * @default true
     */
    stickyHeaders: boolean;
    /**
     * Offset sticky sous AppBar (px)
     * @default 0
     */
    stickyOffset: number;
    /**
     * Comportement de scroll lors d'un jump rail
     * @default 'smooth'
     */
    scrollBehavior: ScrollBehavior;
    /**
     * Masquer les clés absentes dans le rail
     * @default true
     */
    hideEmptyKeys: boolean;
    /**
     * Glisser le doigt sur le rail pour naviguer
     * @default true
     */
    railScrub: boolean;
    /**
     * Résolution personnalisée de la clé depuis un item DOM ou data
     */
    getKey: ((item: HTMLElement | IndexListItemData) => string) | null;
    /**
     * Conteneur scrollable ; null = `.index-list__content`
     * @default null
     */
    scrollRoot: string | HTMLElement | null;
    /**
     * Callback changement de section active au scroll
     */
    onSectionChange: ((key: string, section: HTMLElement) => void) | null;
    /**
     * Callback sélection rail
     */
    onRailSelect: ((key: string) => void) | null;
    /**
     * Niveau de priorité pour la gestion des instances
     * @default PriorityLevel.MEDIUM
     */
    priorityLevel: PriorityLevel;
}
