/**
 * @fileoverview Composant Page pour K3UI
 * @description Empilement plein écran de sections avec navigation par scroll, clavier et touch (inspiré de pagePiling.js)
 * @see https://github.com/alvarotrigo/pagePiling.js
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { PageNavigationOptions, PageOptions, PageScrollDirection } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { Keyboard } from '../core/managers/KeyboardManager';
import { ManagerFactory } from '../core/factories';
import { MotionManager } from '../core/managers/MotionManager';
import { LocaleManager } from '../core/managers';
import { setAriaAttribute, setAriaAttributes } from '../utils/dom/aria';
import { getPageDefaults } from '../specs/components/page.specs';

const _defaults: PageOptions = getPageDefaults();

const SECTION_ACTIVE_CLASS = 'page__section--active';
const SECTION_SCROLLABLE_CLASS = 'page__section--scrollable';
const SECTION_TABLE_CLASS = 'page__section--table';
const SECTION_EASING_CLASS = 'page__section--easing';
const CELL_CLASS = 'page__cell';
const NAV_CLASS = 'page__nav';
const FULLSCREEN_CLASS = 'page--fullscreen';
const BODY_LOCK_CLASS = 'page-scroll-lock';
const BODY_VIEWING_PREFIX = 'page-viewing-';

/** Instance Page étendue pour stockage sur l'élément */
declare global {
    interface HTMLElement {
        K_Page?: Page;
    }
}

interface ScrollContext {
    destination: HTMLElement;
    animated: boolean;
    activeSection: HTMLElement;
    anchorLink: string | undefined;
    sectionIndex: number;
    yMovement: PageScrollDirection;
    leavingSection: number;
    sectionsToMove: HTMLElement[];
    translate3d: string;
    scrolling: string;
    animateSection: HTMLElement;
}

/**
 * Composant Page — pile de sections plein écran
 */
export class Page extends Component<PageOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger = ManagerFactory.getLoggerManager('[Page]');
    private sections: HTMLElement[] = [];
    private navEl: HTMLElement | null = null;
    private keyboard: Keyboard | null = null;
    private lastScrolledDestiny: string | null = null;
    private lastAnimation = 0;
    private allowScrolling = true;
    private mouseWheelEnabled = true;
    private touchEnabled = true;
    private touchStartY = 0;
    private touchStartX = 0;
    private css3Supported = false;
    private destroyed = false;
    private navClickCleanup: (() => void) | null = null;
    private ignoringHashChange = false;

    static get defaults(): PageOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Page | undefined {
        return el.K_Page ?? (Component.getInstance(el) as Page | undefined);
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<PageOptions> = {}
    ): Page[] {
        return Component.init(els, options, toComponentClassDef(Page)) as Page[];
    }

    constructor(el: HTMLElement, options: Partial<PageOptions> = {}) {
        super(el, options, toComponentClassDef(Page));
        const fromHtml = Page.readAttributes(el);
        this.options = {
            ...Page.defaults,
            ...options,
            ...fromHtml,
        };
        el.K_Page = this;
        this.initCore();
    }

    /**
     * Lit les attributs data-* de l'élément racine
     * @param el Élément racine
     */
    private static readAttributes(el: HTMLElement): Partial<PageOptions> {
        const out: Partial<PageOptions> = {};
        const fullscreen = el.getAttribute('data-fullscreen');
        if (fullscreen === 'true') out.fullscreen = true;
        if (fullscreen === 'false') out.fullscreen = false;
        return out;
    }

    /**
     * Applique le mode plein écran ou intégré
     * @private
     */
    private applyLayoutMode(): void {
        if (this.options.fullscreen) {
            this.el.classList.add(FULLSCREEN_CLASS);
            document.documentElement.classList.add(BODY_LOCK_CLASS);
            return;
        }

        this.el.classList.remove(FULLSCREEN_CLASS);
        if (!this.el.style.height) {
            this.el.style.height = '100%';
        }
    }

    /**
     * Retourne la cible d'écoute wheel/touch (viewport entier en plein écran)
     * @private
     */
    private getInteractionRoot(): HTMLElement | Window {
        return this.options.fullscreen ? window : this.el;
    }

    /**
     * Vérifie si l'événement provient de la zone Page
     * @param target Cible de l'événement
     * @private
     */
    private isEventInsidePage(target: EventTarget | null): boolean {
        if (!(target instanceof Node)) return false;
        if (this.options.fullscreen) {
            const appbar = document.querySelector('header');
            if (appbar?.contains(target)) return false;
            return true;
        }
        return this.el.contains(target);
    }

    /**
     * Initialise la structure et les gestionnaires d'événements
     * @private
     */
    private initCore(): void {
        setAriaAttributes(this.el, {
            role: 'region',
            label: LocaleManager.t('page.regionAriaLabel'),
        });

        this.el.classList.add('page');
        this.el.style.overflow = 'hidden';
        this.el.style.touchAction = 'none';

        this.applyLayoutMode();

        this.css3Supported = this.options.css3 ? this.support3d() : false;
        this.collectSections();
        this.setupSections();
        this.setupNavigation();
        this.setupEventHandlers();
        this.scrollToAnchorOnLoad();

        this.options.afterRender?.call(this);
        this.logger.info('Page initialisé', { sections: this.sections.length });
    }

    /**
     * Collecte les sections selon le sélecteur configuré
     * @private
     */
    private collectSections(): void {
        this.sections = Array.from(
            this.el.querySelectorAll<HTMLElement>(this.options.sectionSelector)
        );
    }

    /**
     * Prépare le z-index, les ancres et le centrage vertical
     * @private
     */
    private setupSections(): void {
        let zIndex = this.sections.length;
        const hasActive = this.sections.some((s) => s.classList.contains(SECTION_ACTIVE_CLASS));

        this.sections.forEach((section, index) => {
            section.dataset.pageIndex = String(index);
            section.style.zIndex = String(zIndex);

            if (!hasActive && index === 0) {
                section.classList.add(SECTION_ACTIVE_CLASS);
            }

            const anchor = this.options.anchors[index];
            if (anchor) {
                section.dataset.anchor = anchor;
            }

            const color = this.options.sectionsColor[index];
            if (color) {
                section.style.backgroundColor = color;
            }

            if (
                this.options.verticalCentered &&
                !section.classList.contains(SECTION_SCROLLABLE_CLASS)
            ) {
                this.wrapSectionForCentering(section);
            }

            zIndex -= 1;
        });
    }

    /**
     * Enveloppe le contenu pour centrage vertical type table-cell
     * @param section Section à centrer
     * @private
     */
    private wrapSectionForCentering(section: HTMLElement): void {
        if (section.classList.contains(SECTION_TABLE_CLASS)) return;
        section.classList.add(SECTION_TABLE_CLASS);
        const cell = document.createElement('div');
        cell.className = CELL_CLASS;
        while (section.firstChild) {
            cell.appendChild(section.firstChild);
        }
        section.appendChild(cell);
    }

    /**
     * Crée la barre de navigation par points si activée
     * @private
     */
    private setupNavigation(): void {
        const navOpt = this.options.navigation;
        if (!navOpt) return;

        const nav = document.createElement('nav');
        nav.className = `${NAV_CLASS} ${NAV_CLASS}--${navOpt.position ?? 'right'}`;
        nav.id = `page-nav-${this.id}`;
        nav.style.color = navOpt.textColor ?? '#000';

        const ul = document.createElement('ul');
        ul.setAttribute('role', 'tablist');

        this.sections.forEach((section, index) => {
            const li = document.createElement('li');
            li.setAttribute('role', 'presentation');
            const anchor = this.options.anchors[index];
            const tooltip = navOpt.tooltips?.[index] ?? '';

            const link = document.createElement('a');
            link.href = anchor ? `#${anchor}` : '#';
            if (tooltip) {
                link.dataset.tooltip = tooltip;
            }
            const label = `${LocaleManager.t('page.navSectionAriaLabel')} ${index + 1}`;
            setAriaAttribute(link, 'label', label);

            const span = document.createElement('span');
            if (navOpt.bulletsColor) {
                span.style.borderColor = navOpt.bulletsColor;
            }
            link.appendChild(span);
            li.appendChild(link);
            ul.appendChild(li);

            this.registerEvent(link, 'click', (e: Event) => {
                e.preventDefault();
                this.scrollPage(this.sections[index]);
            });
        });

        nav.appendChild(ul);
        document.body.appendChild(nav);
        this.navEl = nav;

        const activeIndex = this.getActiveSectionIndex();
        this.activateNavDots(undefined, activeIndex);
    }

    /**
     * Attache wheel, touch, hashchange et clavier
     * @private
     */
    private setupEventHandlers(): void {
        this.setAllowScrolling(true);

        const interactionRoot = this.getInteractionRoot();
        this.registerEvent(interactionRoot, 'wheel', this.handleWheel.bind(this), { passive: false });
        this.registerEvent(interactionRoot, 'touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.registerEvent(interactionRoot, 'touchmove', this.handleTouchMove.bind(this), { passive: false });

        this.registerEvent(window, 'hashchange', this.handleHashChange.bind(this));
        this.registerEvent(window, 'load', this.scrollToAnchorOnLoad.bind(this));

        if (this.options.normalScrollElements) {
            const elements = document.querySelectorAll(this.options.normalScrollElements);
            elements.forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                this.registerEvent(node, 'mouseenter', () => this.setMouseWheelScrolling(false));
                this.registerEvent(node, 'mouseleave', () => this.setMouseWheelScrolling(true));
            });
        }

        if (this.options.keyboardScrolling) {
            this.keyboard = new Keyboard({
                target: document,
                onKeyDown: (event: KeyboardEvent) => this.handleKeyDown(event),
            });
        }
    }

    /**
     * Gestion du scroll molette
     * @param e Événement wheel
     * @private
     */
    private handleWheel(e: WheelEvent): void {
        if (!this.mouseWheelEnabled || this.isMoving()) return;
        if (!this.isEventInsidePage(e.target)) return;

        const horizontalDetection =
            e.deltaX !== undefined && Math.abs(e.deltaX) >= Math.abs(e.deltaY);
        const isScrollingVertically = !horizontalDetection;

        if (!isScrollingVertically || e.deltaY === 0) return;

        const activeSection = this.getActiveSection();
        const scrollable = this.getScrollableSection(activeSection);

        if (e.deltaY > 0) {
            this.scrolling('down', scrollable);
        } else {
            this.scrolling('up', scrollable);
        }

        if (!scrollable || this.options.fullscreen) {
            e.preventDefault();
        }
    }

    /**
     * Début du touch
     * @param event Événement touchstart
     * @private
     */
    private handleTouchStart(event: TouchEvent): void {
        if (!this.isReallyTouch(event)) return;
        const touch = event.touches[0];
        if (!touch) return;
        this.touchStartY = touch.pageY;
        this.touchStartX = touch.pageX;
    }

    /**
     * Mouvement touch — swipe entre sections
     * @param event Événement touchmove
     * @private
     */
    private handleTouchMove(event: TouchEvent): void {
        if (!this.touchEnabled || !this.isReallyTouch(event)) return;
        if (!this.isEventInsidePage(event.target)) return;
        if (this.checkParentForNormalScrollElement(event.target as Element)) return;

        const activeSection = this.getActiveSection();
        const scrollable = this.getScrollableSection(activeSection);

        if (!scrollable) {
            event.preventDefault();
        }

        if (this.isMoving()) return;

        const touch = event.touches[0];
        if (!touch) return;

        const touchEndY = touch.pageY;
        const touchEndX = touch.pageX;
        const threshold =
            (this.options.direction === 'horizontal'
                ? this.el.offsetWidth
                : this.getPageHeight()) /
            (100 / this.options.touchSensitivity);

        if (this.options.direction === 'horizontal') {
            if (Math.abs(this.touchStartX - touchEndX) > Math.abs(this.touchStartY - touchEndY)) {
                if (Math.abs(this.touchStartX - touchEndX) > threshold) {
                    if (this.touchStartX > touchEndX) {
                        this.scrolling('down', scrollable);
                    } else {
                        this.scrolling('up', scrollable);
                    }
                }
            }
        } else if (Math.abs(this.touchStartY - touchEndY) > threshold) {
            if (this.touchStartY > touchEndY) {
                this.scrolling('down', scrollable);
            } else {
                this.scrolling('up', scrollable);
            }
        }
    }

    /**
     * Navigation clavier (flèches, Page Up/Down, Home, End)
     * @param event Événement clavier
     * @private
     */
    private handleKeyDown(event: KeyboardEvent): void {
        if (!this.options.keyboardScrolling || this.isMoving()) return;

        switch (event.which) {
            case 38:
            case 33:
                event.preventDefault();
                this.moveSectionUp();
                break;
            case 40:
            case 34:
                event.preventDefault();
                this.moveSectionDown();
                break;
            case 36:
                event.preventDefault();
                this.moveTo(1);
                break;
            case 35:
                event.preventDefault();
                this.moveTo(this.sections.length);
                break;
            case 37:
                event.preventDefault();
                this.moveSectionUp();
                break;
            case 39:
                event.preventDefault();
                this.moveSectionDown();
                break;
            default:
                break;
        }
    }

    /**
     * Réagit au changement de hash URL
     * @private
     */
    private handleHashChange(): void {
        if (this.ignoringHashChange) return;

        const value = window.location.hash.replace('#', '').split('/')[0];
        if (!value || value === this.lastScrolledDestiny) return;

        let section: HTMLElement | undefined;
        if (Number.isNaN(Number(value))) {
            section = this.sections.find((s) => s.dataset.anchor === value);
        } else {
            section = this.sections[Number(value) - 1];
        }

        if (section) {
            this.scrollPage(section);
        }
    }

    /**
     * Scroll vers l'ancre au chargement de la page
     * @private
     */
    private scrollToAnchorOnLoad(): void {
        const value = window.location.hash.replace('#', '');
        if (!value) return;

        const section = this.sections.find((s) => s.dataset.anchor === value);
        if (!section) return;

        const targetIndex = this.sections.indexOf(section);
        if (targetIndex > 0) {
            const offset = this.getTranslate3d();
            for (let i = 0; i < targetIndex; i++) {
                this.transformSection(this.sections[i], offset, false);
            }
        }

        this.scrollPage(section, this.options.animateAnchor);
    }

    /**
     * Détermine si une transition est en cours
     * @returns true si en animation
     * @private
     */
    private isMoving(): boolean {
        const speed = this.getEffectiveScrollingSpeed();
        return Date.now() - this.lastAnimation < this.options.scrollDelay + speed;
    }

    /**
     * Retourne la vitesse effective (réduite si prefers-reduced-motion)
     * @returns Durée en ms
     * @private
     */
    private getEffectiveScrollingSpeed(): number {
        if (this.options.respectReducedMotion && MotionManager.isReducedMotion()) {
            return 0;
        }
        return this.options.scrollingSpeed;
    }

    /**
     * Scroll vers la section destination
     * @param destination Section cible
     * @param animated Animer la transition
     * @private
     */
    private scrollPage(destination: HTMLElement, animated = true): void {
        const activeSection = this.getActiveSection();
        if (activeSection === destination) return;

        const sectionIndex = this.sections.indexOf(destination);
        const yMovement = this.getYMovement(destination);
        const leavingSection = this.sections.indexOf(activeSection) + 1;
        const anchorLink = destination.dataset.anchor;

        this.ignoringHashChange = true;

        if (anchorLink) {
            this.lastScrolledDestiny = anchorLink;
            this.setURLHash(anchorLink, sectionIndex);
        } else {
            this.lastScrolledDestiny = String(sectionIndex + 1);
            this.setBodyViewingClass(String(sectionIndex + 1));
        }

        destination.classList.add(SECTION_ACTIVE_CLASS);
        this.sections.forEach((s) => {
            if (s !== destination) s.classList.remove(SECTION_ACTIVE_CLASS);
        });

        const sectionsToMove = this.getSectionsToMove(destination, yMovement);
        const translate3d = yMovement === 'down' ? this.getTranslate3d() : 'translate3d(0px, 0px, 0px)';
        const scrolling = yMovement === 'down' ? '-100%' : '0';

        const ctx: ScrollContext = {
            destination,
            animated: animated && this.getEffectiveScrollingSpeed() > 0,
            activeSection,
            anchorLink,
            sectionIndex,
            yMovement,
            leavingSection,
            sectionsToMove,
            translate3d,
            scrolling,
            animateSection: yMovement === 'down' ? activeSection : destination,
        };

        this.options.onLeave?.call(this, leavingSection, sectionIndex + 1, yMovement);
        this.performMovement(ctx);
        this.activateMenuElement(anchorLink);
        this.activateNavDots(anchorLink, sectionIndex);
        this.lastAnimation = Date.now();

        window.setTimeout(() => {
            this.ignoringHashChange = false;
        }, 0);
    }

    /**
     * Exécute le mouvement CSS3 ou position statique
     * @param ctx Contexte de scroll
     * @private
     */
    private performMovement(ctx: ScrollContext): void {
        const speed = this.getEffectiveScrollingSpeed();

        if (this.css3Supported && speed > 0) {
            this.transformSection(ctx.animateSection, ctx.translate3d, ctx.animated);
            ctx.sectionsToMove.forEach((section) => {
                this.transformSection(section, ctx.translate3d, ctx.animated);
            });

            window.setTimeout(() => {
                this.readjustSectionsAfterAnimation(ctx.sectionIndex);
                this.afterSectionLoads(ctx);
            }, speed);
        } else if (this.css3Supported && speed === 0) {
            this.transformSection(ctx.animateSection, ctx.translate3d, false);
            ctx.sectionsToMove.forEach((section) => {
                this.transformSection(section, ctx.translate3d, false);
            });
            this.readjustSectionsAfterAnimation(ctx.sectionIndex);
            this.afterSectionLoads(ctx);
        } else {
            const prop = this.getScrollProp(ctx.scrolling);
            if (ctx.animated && speed > 0) {
                this.animateSection(ctx.animateSection, prop, speed, () => {
                    this.readjustSectionsAfterAnimation(ctx.sectionIndex);
                    this.afterSectionLoads(ctx);
                });
            } else {
                Object.assign(ctx.animateSection.style, prop);
                window.setTimeout(() => {
                    this.readjustSectionsAfterAnimation(ctx.sectionIndex);
                    this.afterSectionLoads(ctx);
                }, speed || 0);
            }
        }
    }

    /**
     * Animation CSS top/left de repli
     * @param section Section à animer
     * @param prop Propriétés CSS
     * @param duration Durée
     * @param onComplete Callback fin
     * @private
     */
    private animateSection(
        section: HTMLElement,
        prop: Record<string, string>,
        duration: number,
        onComplete: () => void
    ): void {
        const start = performance.now();
        const initial = this.options.direction === 'vertical'
            ? parseFloat(section.style.top || '0')
            : parseFloat(section.style.left || '0');
        const target = parseFloat(Object.values(prop)[0]);

        const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            const current = initial + (target - initial) * eased;

            if (this.options.direction === 'vertical') {
                section.style.top = `${current}%`;
            } else {
                section.style.left = `${current}%`;
            }

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                onComplete();
            }
        };
        requestAnimationFrame(step);
    }

    /**
     * Callback après chargement de section
     * @param ctx Contexte
     * @private
     */
    private afterSectionLoads(ctx: ScrollContext): void {
        this.options.afterLoad?.call(this, ctx.anchorLink, ctx.sectionIndex + 1);
    }

    /**
     * Normalise les transforms après une transition (état canonique pagePiling)
     * @param destinationIndex Index de la section active
     * @private
     */
    private readjustSectionsAfterAnimation(destinationIndex: number): void {
        const hidden = this.getTranslate3d();
        const visible = 'translate3d(0px, 0px, 0px)';

        this.sections.forEach((section, index) => {
            const translate = index < destinationIndex ? hidden : visible;
            this.transformSection(section, translate, false);
            section.classList.remove(SECTION_EASING_CLASS);
        });
    }

    /**
     * Réajuste les sections après animation jQuery-like (repli)
     * @param ctx Contexte
     * @private
     */
    private readjustSections(ctx: ScrollContext): void {
        if (ctx.yMovement === 'up') {
            const prop = this.getScrollProp(ctx.scrolling);
            ctx.sectionsToMove.forEach((section) => {
                Object.assign(section.style, prop);
            });
        }
    }

    /**
     * Retourne les sections à déplacer
     * @param destination Destination
     * @param yMovement Direction
     * @private
     */
    private getSectionsToMove(destination: HTMLElement, yMovement: PageScrollDirection): HTMLElement[] {
        const destIndex = this.sections.indexOf(destination);
        if (yMovement === 'down') {
            return this.sections.filter((_, i) => i < destIndex);
        }
        return this.sections.filter((_, i) => i > destIndex);
    }

    /**
     * Direction du mouvement vers la destination
     * @param destination Section cible
     * @private
     */
    private getYMovement(destination: HTMLElement): PageScrollDirection {
        const fromIndex = this.getActiveSectionIndex();
        const toIndex = this.sections.indexOf(destination);
        return fromIndex > toIndex ? 'up' : 'down';
    }

    /**
     * Applique transform3d à une section
     * @param section Élément
     * @param translate3d Valeur transform
     * @param animated Activer transition
     * @private
     */
    private transformSection(section: HTMLElement, translate3d: string, animated: boolean): void {
        section.classList.toggle(SECTION_EASING_CLASS, animated);
        if (animated) {
            section.style.transitionDuration = `${this.getEffectiveScrollingSpeed()}ms`;
            section.style.transitionTimingFunction = this.options.easing;
        } else {
            section.style.transitionDuration = '0ms';
        }
        section.style.transform = translate3d;
    }

    /**
     * Propriété top/left pour repli sans CSS3
     * @param value Valeur
     * @private
     */
    private getScrollProp(value: string): Record<string, string> {
        return this.options.direction === 'vertical' ? { top: value } : { left: value };
    }

    /**
     * Valeur translate3d selon direction
     * @private
     */
    private getTranslate3d(): string {
        return this.options.direction === 'vertical'
            ? 'translate3d(0px, -100%, 0px)'
            : 'translate3d(-100%, 0px, 0px)';
    }

    /**
     * Détecte le support CSS3 3D
     * @private
     */
    private support3d(): boolean {
        const el = document.createElement('p');
        const transforms: Record<string, string> = {
            webkitTransform: '-webkit-transform',
            OTransform: '-o-transform',
            msTransform: '-ms-transform',
            MozTransform: '-moz-transform',
            transform: 'transform',
        };

        document.body.insertBefore(el, null);
        let has3d: string | undefined;

        for (const t of Object.keys(transforms)) {
            const key = t as keyof CSSStyleDeclaration;
            if ((el.style as CSSStyleDeclaration)[key] !== undefined) {
                (el.style as unknown as Record<string, string>)[t] = 'translate3d(1px,1px,1px)';
                has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
            }
        }

        document.body.removeChild(el);
        return has3d !== undefined && has3d.length > 0 && has3d !== 'none';
    }

    /**
     * Met à jour le hash URL
     * @param anchorLink Ancre
     * @param sectionIndex Index
     * @private
     */
    private setURLHash(anchorLink: string, sectionIndex: number): void {
        if (this.options.anchors.length) {
            window.location.hash = anchorLink;
            this.setBodyViewingClass(anchorLink);
        } else {
            this.setBodyViewingClass(String(sectionIndex + 1));
        }
    }

    /**
     * Classe body page-viewing-*
     * @param text Identifiant section
     * @private
     */
    private setBodyViewingClass(text: string): void {
        const clean = text.replace('#', '');
        document.body.className = document.body.className.replace(
            /\b\s?page-viewing-[^\s]+\b/g,
            ''
        );
        document.body.classList.add(`${BODY_VIEWING_PREFIX}${clean}`);
    }

    /**
     * Active l'élément menu correspondant
     * @param name Ancre
     * @private
     */
    private activateMenuElement(name: string | undefined): void {
        if (!this.options.menu || !name) return;
        const menu = document.querySelector(this.options.menu);
        if (!menu) return;
        menu.querySelectorAll('.active').forEach((el) => el.classList.remove('active'));
        const item = menu.querySelector(`[data-menuanchor="${name}"]`);
        item?.classList.add('active');
    }

    /**
     * Active le point de navigation
     * @param name Ancre
     * @param sectionIndex Index
     * @private
     */
    private activateNavDots(name: string | undefined, sectionIndex: number): void {
        if (!this.navEl) return;
        this.navEl.querySelectorAll('.active').forEach((el) => el.classList.remove('active'));
        if (name) {
            this.navEl.querySelector(`a[href="#${name}"]`)?.classList.add('active');
        } else {
            const links = this.navEl.querySelectorAll('a');
            links[sectionIndex]?.classList.add('active');
        }
    }

    /**
     * Section active courante
     * @private
     */
    private getActiveSection(): HTMLElement {
        return (
            this.sections.find((s) => s.classList.contains(SECTION_ACTIVE_CLASS)) ?? this.sections[0]
        );
    }

    /**
     * Index de la section active
     * @private
     */
    private getActiveSectionIndex(): number {
        return Math.max(0, this.sections.indexOf(this.getActiveSection()));
    }

    /**
     * Section scrollable interne si applicable
     * @param section Section
     * @private
     */
    private getScrollableSection(section: HTMLElement): HTMLElement | null {
        return section.classList.contains(SECTION_SCROLLABLE_CLASS) ? section : null;
    }

    /**
     * Vérifie si scrollable atteint le bord
     * @param type top ou bottom
     * @param scrollable Élément
     * @private
     */
    private isScrolled(type: 'top' | 'bottom', scrollable: HTMLElement): boolean {
        if (type === 'top') return scrollable.scrollTop <= 0;
        return scrollable.scrollTop + 1 + scrollable.clientHeight >= scrollable.scrollHeight;
    }

    /**
     * Logique scroll up/down avec sections scrollables
     * @param type Direction
     * @param scrollable Section scrollable ou null
     * @private
     */
    private scrolling(type: 'up' | 'down', scrollable: HTMLElement | null): void {
        const action = type === 'down' ? () => this.moveSectionDown() : () => this.moveSectionUp();

        if (scrollable) {
            const edge = type === 'down' ? 'bottom' : 'top';
            if (this.isScrolled(edge, scrollable)) {
                action();
            }
        } else {
            action();
        }
    }

    /**
     * Vérifie si l'événement est un vrai touch (pas souris)
     * @param e Événement touch
     * @private
     */
    private isReallyTouch(e: TouchEvent): boolean {
        const pe = e as TouchEvent & { pointerType?: string };
        return pe.pointerType === undefined || pe.pointerType !== 'mouse';
    }

    /**
     * Remonte le DOM pour normalScrollElements
     * @param el Cible
     * @param hop Profondeur
     * @private
     */
    private checkParentForNormalScrollElement(el: Element | null, hop = 0): boolean {
        if (!el || !this.options.normalScrollElements) return false;
        const parent = el.parentElement;
        if (!parent) return false;

        if (hop < this.options.normalScrollElementTouchThreshold) {
            if (parent.matches(this.options.normalScrollElements)) return true;
            return this.checkParentForNormalScrollElement(parent, hop + 1);
        }
        return false;
    }

    /**
     * Scroll d'une section vers le haut
     */
    public moveSectionUp(): void {
        const activeIndex = this.getActiveSectionIndex();
        let prev = this.sections[activeIndex - 1];

        if (!prev && this.options.loopTop) {
            prev = this.sections[this.sections.length - 1];
        }

        if (prev) {
            this.scrollPage(prev);
        }
    }

    /**
     * Scroll d'une section vers le bas
     */
    public moveSectionDown(): void {
        const activeIndex = this.getActiveSectionIndex();
        let next = this.sections[activeIndex + 1];

        if (!next && this.options.loopBottom) {
            next = this.sections[0];
        }

        if (next) {
            this.scrollPage(next);
        }
    }

    /**
     * Scroll vers une section par index (1-based) ou ancre
     * @param section Index ou nom d'ancre
     */
    public moveTo(section: number | string): void {
        let destiny: HTMLElement | undefined;

        if (typeof section === 'number' || !Number.isNaN(Number(section))) {
            const index = typeof section === 'number' ? section : Number(section);
            destiny = this.sections[index - 1];
        } else {
            destiny = this.sections.find((s) => s.dataset.anchor === section);
        }

        if (destiny) {
            this.scrollPage(destiny);
        }
    }

    /**
     * Active ou désactive le scroll molette et touch
     * @param value true pour activer
     */
    public setAllowScrolling(value: boolean): void {
        this.allowScrolling = value;
        if (value) {
            this.setMouseWheelScrolling(true);
            this.touchEnabled = true;
        } else {
            this.setMouseWheelScrolling(false);
            this.touchEnabled = false;
        }
    }

    /**
     * Active ou désactive le scroll molette
     * @param value true pour activer
     */
    public setMouseWheelScrolling(value: boolean): void {
        this.mouseWheelEnabled = value && this.allowScrolling;
    }

    /**
     * Active ou désactive le scroll clavier
     * @param value true pour activer
     */
    public setKeyboardScrolling(value: boolean): void {
        this.options.keyboardScrolling = value;
        if (!value) {
            this.keyboard?.destroy();
            this.keyboard = null;
        } else if (!this.keyboard) {
            this.keyboard = new Keyboard({
                target: document,
                onKeyDown: (event: KeyboardEvent) => this.handleKeyDown(event),
            });
        }
    }

    /**
     * Hauteur effective du conteneur Page
     * @private
     */
    private getPageHeight(): number {
        return this.el.getBoundingClientRect().height || window.innerHeight;
    }

    /**
     * Active ou désactive le mode plein écran
     * @param value true pour occuper le viewport
     */
    public setFullscreen(value: boolean): void {
        if (this.options.fullscreen === value) return;
        this.options.fullscreen = value;
        this.applyLayoutMode();
    }

    /**
     * Définit la vitesse de scroll en ms
     * @param milliseconds Durée
     */
    public setScrollingSpeed(milliseconds: number): void {
        this.options.scrollingSpeed = milliseconds;
    }

    /**
     * Retourne l'index de la section active (1-based)
     * @returns Index courant
     */
    public getActiveIndex(): number {
        return this.getActiveSectionIndex() + 1;
    }

    /**
     * Détruit l'instance et restaure le DOM
     */
    public override destroy(): void {
        if (this.destroyed) return;
        this.destroyed = true;

        this.keyboard?.destroy();
        this.keyboard = null;

        this.navEl?.remove();
        this.navEl = null;
        this.navClickCleanup?.();
        this.navClickCleanup = null;

        this.sections.forEach((section) => {
            section.classList.remove(
                SECTION_ACTIVE_CLASS,
                SECTION_TABLE_CLASS,
                SECTION_EASING_CLASS
            );
            section.style.transform = '';
            section.style.transitionDuration = '';
            section.style.zIndex = '';
            delete section.dataset.pageIndex;
            delete section.dataset.anchor;

            const cell = section.querySelector(`.${CELL_CLASS}`);
            if (cell) {
                while (cell.firstChild) {
                    section.appendChild(cell.firstChild);
                }
                cell.remove();
            }
        });

        document.documentElement.classList.remove(BODY_LOCK_CLASS);
        document.body.className = document.body.className.replace(
            /\b\s?page-viewing-[^\s]+\b/g,
            ''
        );

        this.el.classList.remove('page', FULLSCREEN_CLASS);
        this.el.style.overflow = '';
        this.el.style.touchAction = '';
        this.el.style.height = '';

        delete this.el.K_Page;
        super.destroy();
        this.logger.info('Page détruit');
    }
}
