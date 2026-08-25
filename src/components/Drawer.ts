/**
 * @file src/components/Drawer.ts
 * @description Composant Drawer K3UI — navigation drawer Material 3 (left / right).
 * Pour top / bottom, utiliser Sheet.
 */
import { Component } from "../core/base/Component";
import { toComponentClassDef } from '../types/components/component-base';
import { OpenableComponent } from "../core/base/OpenableComponent";
import { DrawerOptions } from "../types/components";
import { PriorityLevel } from "../types/base";
import { KElement, InitElements } from "../types/base";
import { positioningUtils } from "../utils/dom";
import { mouseUtils } from "../core/managers/MouseManager";
import { setAriaAttribute } from "../utils/dom/aria";
import { getDrawerDefaults } from '../specs/components/drawer.specs';
import { MotionPresets } from '../specs/common/motion-presets.specs';
import { readMotionSpring } from '../utils/motion/motionSpring';
import {
    FLING_THRESHOLD,
    VelocityTracker,
    projectFling,
} from '../utils/motion/gesture-physics';

/**
 * Aligné sur `scss/tokens/drawer.token.scss`.
 * Au-dessus du navigation-rail docs (`.navigation-rail-container--fixed` = 1200).
 */
const DRAWER_Z_INDEX_OVERLAY = 1299;
const DRAWER_Z_INDEX = 1300;

/**
 * Options par défaut du composant Drawer.
 */
const _defaults: DrawerOptions = getDrawerDefaults();

/**
 * Classe du composant Drawer.
 */
export class Drawer extends OpenableComponent<DrawerOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    /** Identifiant unique du drawer */
    public id: string;
    /** Décrit l'état ouvert/fermé du Drawer */
    public isOpen: boolean;
    /** Décrit si le Drawer est fixe */
    public isFixed: boolean;
    /** Décrit si le Drawer est en cours de glissement */
    public isDragged: boolean;
    /** Largeur de la fenêtre au dernier redimensionnement */
    public lastWindowWidth: number;
    /** Hauteur de la fenêtre au dernier redimensionnement */
    public lastWindowHeight: number;
    /** Instance statique des drawers */
    static _drawers: Drawer[] = [];

    /** Overlay de fond */
    private _overlay: HTMLElement;
    /** Zone de glissement (lateral uniquement) */
    public dragTarget: HTMLElement;
    /** Position X de départ du glissement */
    private _startingXpos: number;
    /** Position X actuelle */
    private _xPos: number;
    /** Timestamp du glissement */
    private _time: number;
    /** Largeur du drawer */
    private _width: number;
    /** Position de défilement initiale */
    private _initialScrollTop: number;
    /** Indique si le défilement est vertical */
    private _verticallyScrolling: boolean;
    /** Delta X du glissement */
    private deltaX: number;
    /** Vélocité X du glissement */
    private velocityX: number;
    /** Pourcentage d'ouverture (0 = fermé, 1 = ouvert) */
    private percentOpen: number;
    /** Parent d'origine avant portal body (drawer temporaire) */
    private _portalParent: Node | null = null;
    /** Frère suivant d'origine avant portal body */
    private _portalNextSibling: ChildNode | null = null;
    /** Timeout fin d'ouverture (onOpenEnd) */
    private _openEndTimer: ReturnType<typeof setTimeout> | null = null;
    /** Timeout fin de fermeture (portal restore / onCloseEnd) */
    private _closeEndTimer: ReturnType<typeof setTimeout> | null = null;
    /** Timeout masquage overlay après fermeture */
    private _overlayHideTimer: ReturnType<typeof setTimeout> | null = null;
    /** Timeout démarrage transition opacity overlay */
    private _overlayShowTimer: ReturnType<typeof setTimeout> | null = null;
    /** Tracker de vitesse du geste (px/s) — seuil fling M3 = 500 */
    private _velocityTracker = new VelocityTracker();

    constructor(el: HTMLElement, options: Partial<DrawerOptions> = {}) {
        super(el, options, toComponentClassDef(Drawer));

        this._parseDataAttributes();

        this.id = this.el.id;
        this.isOpen = false;
        this.isFixed = this.el.classList.contains('drawer--fixed');
        this.isDragged = false;

        this.lastWindowWidth = window.innerWidth;
        this.lastWindowHeight = window.innerHeight;

        this._startingXpos = 0;
        this._xPos = 0;
        this._time = 0;
        this._width = 0;
        this._initialScrollTop = 0;
        this._verticallyScrolling = false;
        this.deltaX = 0;
        this.velocityX = 0;
        this.percentOpen = 0;

        this._createOverlay();
        this._createDragTarget();
        this._setupEventHandlers();
        this._setupClasses();
        this._snapClosedOffscreen();
        this._setupFixed();

        Drawer._drawers.push(this);
    }

    /**
     * Parse les attributs data et classes CSS pour configurer automatiquement le drawer
     */
    _parseDataAttributes(): void {
        if (this.el.classList.contains('drawer--right')) {
            this.options.edge = 'right';
        } else if (this.el.classList.contains('drawer--left')) {
            this.options.edge = 'left';
        }

        if (this.options.edge !== 'right') {
            this.options.edge = 'left';
        }

        if (this.el.classList.contains('drawer--fixed')) {
            this.options.draggable = false;
        }
    }

    static get defaults(): DrawerOptions {
        return _defaults;
    }

    static init(
        el: HTMLElement,
        options?: Partial<DrawerOptions>
    ): Drawer;
    static init(
        els: InitElements<KElement>,
        options?: Partial<DrawerOptions>
    ): Drawer[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options: Partial<DrawerOptions> = {}
    ): Drawer | Drawer[] {
        return Component.init(
            els as HTMLElement | InitElements<HTMLElement>,
            options,
            toComponentClassDef(Drawer)
        ) as Drawer | Drawer[];
    }

    static getInstance(el: HTMLElement): Drawer | undefined {
        return Component.getInstance(el) as Drawer | undefined;
    }

    destroy(): void {
        if (!this.el) {
            return;
        }

        this._clearAnimationTimers();
        this._removeEventHandlers();
        this._enableBodyScrolling();
        this._restoreFromPortal();
        this._overlay.parentNode?.removeChild(this._overlay);
        this.dragTarget.parentNode?.removeChild(this.dragTarget);
        this.el.style.transform = '';
        this.el.style.zIndex = '';
        this._overlay.style.zIndex = '';

        const index = Drawer._drawers.indexOf(this);
        if (index >= 0) {
            Drawer._drawers.splice(index, 1);
        }
        super.destroy();
    }

    /** Annule les timers d'anim pour éviter overlay/portal hors sync après open/close rapide. */
    private _clearAnimationTimers(): void {
        if (this._openEndTimer !== null) {
            clearTimeout(this._openEndTimer);
            this._openEndTimer = null;
        }
        if (this._closeEndTimer !== null) {
            clearTimeout(this._closeEndTimer);
            this._closeEndTimer = null;
        }
        if (this._overlayHideTimer !== null) {
            clearTimeout(this._overlayHideTimer);
            this._overlayHideTimer = null;
        }
        if (this._overlayShowTimer !== null) {
            clearTimeout(this._overlayShowTimer);
            this._overlayShowTimer = null;
        }
    }

    // ==========================================================================
    // Lateral drawer (left / right) — logique historique
    // ==========================================================================

    private _createOverlay(): void {
        this._overlay = document.createElement('div');
        this._overlay.classList.add('drawer-overlay');
        document.body.appendChild(this._overlay);
    }

    private _setupEventHandlers(): void {
        if (Drawer._drawers.length === 0) {
            document.body.addEventListener('click', this._handleTriggerClick);
        }

        const passiveIfSupported: AddEventListenerOptions = { passive: false };
        this.registerEvent(this.dragTarget, 'touchmove', this._handleDragTargetDrag as EventListener, passiveIfSupported);
        this.registerEvent(this.dragTarget, 'touchend', this._handleDragTargetRelease as EventListener);
        this.registerEvent(this._overlay, 'touchmove', this._handleCloseDrag as EventListener, passiveIfSupported);
        this.registerEvent(this._overlay, 'touchend', this._handleCloseRelease as EventListener);
        this.registerEvent(this._overlay, 'click', this.close as EventListener);
        this.registerEvent(this.el, 'touchmove', this._handleCloseDrag as EventListener);
        this.registerEvent(this.el, 'touchend', this._handleCloseRelease as EventListener);
        this.registerEvent(this.el, 'click', this._handleCloseTriggerClick as EventListener);

        if (this.isFixed) {
            this.registerEvent(window, 'resize', this._handleWindowResize as EventListener);
        }

        this._setAriaHidden();
        this._setTabIndex();
    }

    private _removeEventHandlers(): void {
        if (Drawer._drawers.length === 1) {
            document.body.removeEventListener('click', this._handleTriggerClick);
        }
    }

    private _handleTriggerClick = (e: Event): void => {
        const trigger = (e.target as Element).closest('.drawer-trigger');
        if (e.target && trigger) {
            const drawerId = positioningUtils.getIdFromTrigger(trigger as HTMLElement);
            const drawerEl = document.getElementById(drawerId);
            const drawerInstance = drawerEl ? Drawer.getInstance(drawerEl) : undefined;
            if (drawerInstance) {
                drawerInstance.open();
            }
            e.preventDefault();
        }
    };

    private _startDrag(e: TouchEvent): void {
        const clientX = e.targetTouches[0].clientX;
        this.isDragged = true;
        this._startingXpos = clientX;
        this._xPos = this._startingXpos;
        this._time = Date.now();
        this._width = this.el.getBoundingClientRect().width;
        this._overlay.style.display = 'block';
        this._initialScrollTop = this.isOpen ? this.el.scrollTop : mouseUtils.getDocumentScrollTop();
        this._verticallyScrolling = false;
        this._velocityTracker.reset();
        this._velocityTracker.add(clientX, e.timeStamp || performance.now());
    }

    private _dragMoveUpdate(e: TouchEvent): void {
        const clientX = e.targetTouches[0].clientX;
        const currentScrollTop = this.isOpen ? this.el.scrollTop : mouseUtils.getDocumentScrollTop();
        this.deltaX = Math.abs(this._xPos - clientX);
        this._xPos = clientX;
        this._velocityTracker.add(clientX, e.timeStamp || performance.now());
        // Conservé pour compat : px/ms approximatif ; le fling utilise le tracker (px/s).
        this.velocityX = this.deltaX / Math.max(1, Date.now() - this._time);
        this._time = Date.now();

        if (this._initialScrollTop !== currentScrollTop) {
            this._verticallyScrolling = true;
        }
    }

    /**
     * Sens de sortie hors écran (left = -1, right = +1) pour normaliser le fling.
     */
    private _dirX(): 1 | -1 {
        return this.options.edge === 'right' ? 1 : -1;
    }

    private _handleDragTargetDrag = (e: TouchEvent): void => {
        if (!this._isDraggable()) return;

        let totalDeltaX = this._calculateDelta(e);
        const dragDirection = totalDeltaX > 0 ? 'right' : 'left';

        totalDeltaX = Math.min(this._width, Math.abs(totalDeltaX));
        if (this.options.edge === dragDirection) {
            totalDeltaX = 0;
        }

        if (this.options.edge === 'left') {
            const transformX = -100 + (totalDeltaX / this._width) * 100;
            this.el.style.transform = `translateX(${transformX}%)`;
        } else {
            const transformX = 105 - (totalDeltaX / this._width) * 105;
            this.el.style.transform = `translateX(${transformX}%)`;
        }

        this.percentOpen = Math.min(1, totalDeltaX / this._width);
        this._overlay.style.opacity = this.percentOpen.toString();
    };

    private _handleDragTargetRelease = (): void => {
        if (this.isDragged) {
            // Fling d'ouverture : vitesse vers l'intérieur OU position > 20 %.
            const openVelocity = -this._velocityTracker.velocity * this._dirX();
            if (openVelocity > FLING_THRESHOLD || this.percentOpen > 0.2) {
                this.open();
            } else {
                this._animateDrawerOut();
            }
            this.isDragged = false;
            this._verticallyScrolling = false;
        }
    };

    private _handleCloseDrag = (e: TouchEvent): void => {
        if (!this.isOpen || !this._isDraggable()) return;

        let totalDeltaX = this._calculateDelta(e);
        const dragDirection = totalDeltaX > 0 ? 'right' : 'left';
        totalDeltaX = Math.min(this._width, Math.abs(totalDeltaX));

        if (this.options.edge !== dragDirection) {
            totalDeltaX = 0;
        }

        let transformX = -totalDeltaX;
        if (this.options.edge === 'right') {
            transformX = -transformX;
        }

        this.percentOpen = Math.min(1, 1 - totalDeltaX / this._width);

        this.el.style.transform = `translateX(${transformX}px)`;
        this._overlay.style.opacity = this.percentOpen.toString();
    };

    private _calculateDelta = (e: TouchEvent): number => {
        if (!this.isDragged) {
            this._startDrag(e);
        }

        this._dragMoveUpdate(e);
        return this._xPos - this._startingXpos;
    };

    private _handleCloseRelease = (): void => {
        if (this.isOpen && this.isDragged) {
            // Fling M3 (> 500 px/s) ou projection > 40 % de largeur, sinon seuil 0.8 historique.
            const closeVelocity = this._velocityTracker.velocity * this._dirX();
            const offsetClosed = (1 - this.percentOpen) * this._width;
            const projected = projectFling(offsetClosed, closeVelocity);

            if (
                closeVelocity > FLING_THRESHOLD ||
                projected > this._width * 0.4 ||
                this.percentOpen <= 0.8
            ) {
                this.close();
            } else {
                this._animateDrawerIn();
            }
            this.isDragged = false;
            this._verticallyScrolling = false;
        }
    };

    private _handleCloseTriggerClick = (e: Event): void => {
        const closeTrigger = (e.target as Element).closest('.drawer-close');
        if (closeTrigger && !this._isCurrentlyFixed()) {
            this.close();
        }
    };

    private _handleWindowResize = (): void => {
        if (this.lastWindowWidth !== window.innerWidth) {
            if (window.innerWidth > 992) {
                this.open();
            } else {
                this.close();
            }
        }
        this.lastWindowWidth = window.innerWidth;
        this.lastWindowHeight = window.innerHeight;
    };

    private _setupClasses(): void {
        this.el.classList.remove('drawer--top', 'drawer--bottom', 'is-open');
        if (this.options.edge === 'right') {
            this.el.classList.remove('drawer--left');
            this.el.classList.add('drawer--right', 'right-aligned');
            this.dragTarget.classList.add('right-aligned');
        } else {
            this.el.classList.remove('drawer--right', 'right-aligned');
            this.el.classList.add('drawer--left');
        }
    }

    /**
     * Figé hors écran selon l'edge courant, sans interpoler l'ancienne transform.
     * Évite le 1er open raté après un changement left ↔ right.
     */
    private _snapClosedOffscreen(): void {
        this.el.classList.remove('is-open');
        this.el.style.transition = 'none';
        this.el.style.transform = '';
        void this.el.offsetWidth;
        this.el.style.removeProperty('transition');
    }

    private _portalToBody(): void {
        if (this._isCurrentlyFixed()) return;
        if (this.el.parentElement === document.body) return;
        this._portalParent = this.el.parentNode;
        this._portalNextSibling = this.el.nextSibling;
        document.body.appendChild(this.el);
    }

    private _restoreFromPortal(): void {
        if (!this._portalParent) return;
        if (this._portalNextSibling && this._portalNextSibling.parentNode === this._portalParent) {
            this._portalParent.insertBefore(this.el, this._portalNextSibling);
        } else {
            this._portalParent.appendChild(this.el);
        }
        this._portalParent = null;
        this._portalNextSibling = null;
    }

    private _applyModalStacking(): void {
        if (this._isCurrentlyFixed()) return;
        this._overlay.style.zIndex = String(DRAWER_Z_INDEX_OVERLAY);
        this.el.style.zIndex = String(DRAWER_Z_INDEX);
    }

    private _removeClasses(): void {
        this.el.classList.remove('right-aligned');
        this.dragTarget.classList.remove('right-aligned');
    }

    private _setupFixed(): void {
        if (this._isCurrentlyFixed()) this.open();
    }

    private _isDraggable(): boolean {
        return this.options.draggable && !this._isCurrentlyFixed() && !this._verticallyScrolling;
    }

    private _isCurrentlyFixed(): boolean {
        return this.isFixed && window.innerWidth > 992;
    }

    private _createDragTarget(): void {
        const dragTarget = document.createElement('div');
        dragTarget.classList.add('drag-target');
        dragTarget.style.width = this.options.dragTargetWidth ?? '10px';
        document.body.appendChild(dragTarget);
        this.dragTarget = dragTarget;
    }

    private _preventBodyScrolling(): void {
        this._preventScrollingBase('drawer-open');
    }

    private _enableBodyScrolling(): void {
        this._restoreScrollingBase('drawer-open');
    }

    /**
     * Ouvre le Drawer.
     */
    public open = (): void => {
        if (this.isOpen === true) return;

        this._clearAnimationTimers();
        this._snapClosedOffscreen();
        this._portalToBody();
        this._applyModalStacking();

        this.isOpen = true;
        this.options.onOpenStart?.(this.el);

        if (this._isCurrentlyFixed()) {
            this.el.style.transform = 'translateX(0)';
            this._enableBodyScrolling();
            this._overlay.style.display = 'none';
        } else {
            if (this.options.preventScrolling) this._preventBodyScrolling();
            if (!this.isDragged || this.percentOpen !== 1) this._animateDrawerIn();
            this._setAriaHidden();
            this._setTabIndex();
        }
    };

    /**
     * Ferme le Drawer.
     */
    public close = (): void => {
        if (this.isOpen === false) return;

        this._clearAnimationTimers();
        this.isOpen = false;
        this.options.onCloseStart?.(this.el);

        if (this._isCurrentlyFixed()) {
            const transformX = this.options.edge === 'left' ? '-105%' : '105%';
            this.el.style.transform = `translateX(${transformX})`;
        } else {
            this._enableBodyScrolling();
            if (!this.isDragged || this.percentOpen !== 0) {
                this._animateDrawerOut();
            } else {
                this._overlay.style.display = 'none';
                this._restoreFromPortal();
                this.el.style.zIndex = '';
            }
            this._setAriaHidden();
            this._setTabIndex();
        }
    };

    private _animateDrawerIn(): void {
        const duration = this.options.inDuration;
        this.el.classList.add('is-open');
        this._animateOverlayIn();
        this._openEndTimer = setTimeout(() => {
            this._openEndTimer = null;
            this.options.onOpenEnd?.(this.el);
        }, duration);
    }

    private _animateDrawerOut(): void {
        const duration = this.options.outDuration;
        this.el.classList.remove('is-open');
        this._animateOverlayOut();
        this._closeEndTimer = setTimeout(() => {
            this._closeEndTimer = null;
            this._restoreFromPortal();
            this.el.style.zIndex = '';
            this.options.onCloseEnd?.(this.el);
        }, duration);
    }

    private _animateOverlayIn(): void {
        let start = 0;
        if (this.isDragged) {
            start = this.percentOpen;
        } else {
            this._overlay.style.display = 'block';
        }

        const effects = readMotionSpring('effects', MotionPresets.drawerOverlay.effectsSpeed, this.el);
        const duration = this.options.inDuration || effects.durationMs;

        this._overlay.style.transition = 'none';
        this._overlay.style.opacity = start.toString();

        this._overlayShowTimer = setTimeout(() => {
            this._overlayShowTimer = null;
            this._overlay.style.transition = `opacity ${duration}ms ${effects.easing}`;
            this._overlay.style.opacity = '1';
        }, 1);
    }

    private _animateOverlayOut(): void {
        const effects = readMotionSpring('effects', MotionPresets.drawerOverlay.effectsSpeed, this.el);
        const duration = this.options.outDuration || effects.durationMs;

        this._overlay.style.transition = `opacity ${duration}ms ${effects.easing}`;
        this._overlay.style.opacity = '0';

        this._overlayHideTimer = setTimeout(() => {
            this._overlayHideTimer = null;
            this._overlay.style.display = 'none';
        }, duration);
    }

    private _setAriaHidden = (): void => {
        if (!this.isOpen) {
            const activeElement = document.activeElement as HTMLElement;
            if (activeElement && this.el.contains(activeElement)) {
                activeElement.blur();
            }
        }
        setAriaAttribute(this.el, 'hidden', !this.isOpen);
    };

    private _setTabIndex = (): void => {
        const drawerLinks = this.el.querySelectorAll('a, button, [tabindex]');
        drawerLinks.forEach((link: Element) => {
            if (link instanceof HTMLElement) {
                link.tabIndex = this.isOpen ? 0 : -1;
            }
        });
    };
}

/**
 * Enregistrement du Web Component k3ui-drawer
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-drawer')) {
    customElements.define('k3ui-drawer', class extends HTMLElement {
        private drawerInstance: Drawer | null = null;

        connectedCallback() {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback() {
            if (this.drawerInstance) {
                this.drawerInstance.destroy();
                this.drawerInstance = null;
            }
        }
    });
}
