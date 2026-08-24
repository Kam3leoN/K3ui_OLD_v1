/**
 * @fileoverview Composant ScrollSpy pour K3UI
 * @description Sommaire « On this page » avec scroll-spy, pilule glissante et drawer mobile
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { ScrollSpyOptions, ScrollSpySection } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { setAriaAttributes, setAriaAttribute, removeAriaAttribute } from '../utils/dom/aria';
import { LocaleManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getScrollSpyDefaults } from '../specs/components/scrollspy.specs';

const _defaults: ScrollSpyOptions = getScrollSpyDefaults();

/** Section interne avec référence DOM */
interface ScrollSpySectionInternal extends ScrollSpySection {
    element: HTMLElement;
}

interface KScrollSpyHTMLElement extends HTMLElement {
    K_ScrollSpy?: ScrollSpy;
}

/**
 * Composant ScrollSpy — sommaire de page Material Design 3
 */
export class ScrollSpy extends Component<ScrollSpyOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger = ManagerFactory.getLoggerManager('[ScrollSpy]');
    private sections: ScrollSpySectionInternal[] = [];
    private activeId: string | null = null;
    private lastActiveId: string | null = null;
    private contentRoot: HTMLElement | null = null;
    private scrollTarget: Window | HTMLElement = window;
    private intersectionObserver: IntersectionObserver | null = null;
    private bottomObserver: IntersectionObserver | null = null;
    private mutationObserver: MutationObserver | null = null;
    private sentinelEl: HTMLElement | null = null;
    private navEl: HTMLElement | null = null;
    private listWrapEl: HTMLElement | null = null;
    private pillEl: HTMLElement | null = null;
    private progressFillEl: HTMLElement | null = null;
    private mobileTriggerEl: HTMLButtonElement | null = null;
    private mobileActiveEl: HTMLElement | null = null;
    private drawerOverlayEl: HTMLElement | null = null;
    private drawerPanelEl: HTMLElement | null = null;
    private linkMap = new Map<string, HTMLAnchorElement>();
    private isDrawerOpen = false;
    private isMobile = false;
    private mobileMq: MediaQueryList | null = null;
    private focusedLinkIndex = -1;
    private resizeRafId: number | null = null;
    private refreshDebounceId: number | null = null;
    private stickyRafId: number | null = null;
    private desktopEl: HTMLElement | null = null;
    private pinMode: 'none' | 'pinned' | 'pinned-end' = 'none';
    private scrollSpySuspended = false;
    private navigationPillStatic = false;
    /** Marge anti-rebond aux frontières pin / unpinned (px) */
    private static readonly PIN_HYSTERESIS_PX = 12;
    private navigationReleaseTimer: number | null = null;
    private pinResizeObserver: ResizeObserver | null = null;
    private userHasNavigated = false;

    static get defaults(): ScrollSpyOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): ScrollSpy | null {
        return (el as KScrollSpyHTMLElement).K_ScrollSpy ?? null;
    }

    static init(el: HTMLElement, options?: Partial<ScrollSpyOptions>): ScrollSpy;
    static init(els: InitElements<HTMLElement> | string, options?: Partial<ScrollSpyOptions>): ScrollSpy[];
    static init(
        els: HTMLElement | InitElements<HTMLElement> | string,
        options: Partial<ScrollSpyOptions> = {}
    ): ScrollSpy | ScrollSpy[] {
        if (typeof els === 'string') {
            const nodes = document.querySelectorAll<HTMLElement>(els);
            return Array.from(nodes).map((node) => ScrollSpy.init(node, options) as ScrollSpy);
        }
        if (els instanceof HTMLElement) {
            const existing = ScrollSpy.getInstance(els);
            if (existing) return existing;
            return new ScrollSpy(els, options);
        }
        return Array.from(els).map((node) => {
            const ex = ScrollSpy.getInstance(node);
            return ex ?? new ScrollSpy(node, options);
        });
    }

    constructor(el: HTMLElement, options: Partial<ScrollSpyOptions> = {}) {
        super(el, options, toComponentClassDef(ScrollSpy));

        const fromHtml = ScrollSpy.readAttributes(el);
        this.options = {
            ...ScrollSpy.defaults,
            ...options,
            ...fromHtml,
        };

        (el as KScrollSpyHTMLElement).K_ScrollSpy = this;
        this.init();
    }

    /**
     * Lit les attributs data-* et plain du host
     * @param el Élément host
     * @returns Options partielles
     */
    private static readAttributes(el: HTMLElement): Partial<ScrollSpyOptions> {
        const out: Partial<ScrollSpyOptions> = {};
        const get = (key: string) => el.getAttribute(`data-${key}`);

        const selector = get('selector') ?? el.getAttribute('selector');
        if (selector) out.selector = selector;

        const headings = get('headings') ?? el.getAttribute('headings');
        if (headings) out.headings = headings;

        const title = get('title') ?? el.getAttribute('title');
        if (title) out.title = title;

        const overline = get('overline') ?? el.getAttribute('overline');
        if (overline) out.overline = overline;

        const offset = get('offset');
        if (offset != null) {
            const n = parseInt(offset, 10);
            if (!Number.isNaN(n)) out.offset = n;
        }

        const progress = get('progress');
        if (progress === 'true' || progress === 'false') {
            out.progress = progress === 'true';
        }

        const mobileBreakpoint = get('mobile-breakpoint');
        if (mobileBreakpoint != null) {
            const n = parseInt(mobileBreakpoint, 10);
            if (!Number.isNaN(n)) out.mobileBreakpoint = n;
        }

        const scrollRoot = get('scroll-root');
        if (scrollRoot) out.scrollRoot = scrollRoot;

        const pinDesktop = get('pin-desktop');
        if (pinDesktop === 'true' || pinDesktop === 'false') {
            out.pinDesktop = pinDesktop === 'true';
        }

        const autoActivateInitial = get('auto-activate-initial');
        if (autoActivateInitial === 'true' || autoActivateInitial === 'false') {
            out.autoActivateInitial = autoActivateInitial === 'true';
        }

        return out;
    }

    /**
     * Slugifie un texte pour générer un id URL-friendly
     * @param text Texte source
     * @returns Slug
     */
    private static slugify(text: string): string {
        return text
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    private init(): void {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        this.el.classList.add('scrollspy');
        this.el.style.setProperty('--scrollspy-sticky-top', `${this.options.offset}px`);
        if (this.options.progress) {
            this.el.classList.add('scrollspy--progress');
        }

        this.resolveScrollTarget();
        this.resolveContentRoot();
        this.scanSections();
        this.buildDom();
        this.setupObservers();
        this.setupMobile();
        this.setupEvents();
        this.setupDesktopPin();
        this.handleInitialHash();

        if (this.options.autoActivateInitial && !this.hasInitialHash()) {
            this.activateInitialSection();
        }

        requestAnimationFrame(() => {
            if (this.options.autoActivateInitial && !this.hasInitialHash()) {
                this.activateInitialSection();
            }
            this.updatePillPosition();
            this.updateProgress();
        });

        this.logger.info('ScrollSpy initialized');
    }

    private resolveScrollTarget(): void {
        const { scrollRoot } = this.options;
        if (!scrollRoot) {
            this.scrollTarget = window;
            return;
        }
        if (typeof scrollRoot === 'string') {
            const el = document.querySelector(scrollRoot);
            this.scrollTarget = el instanceof HTMLElement ? el : window;
            return;
        }
        this.scrollTarget = scrollRoot;
    }

    private resolveContentRoot(): void {
        const sel = this.options.selector;
        const found = document.querySelector(sel);
        this.contentRoot = found instanceof HTMLElement ? found : document.querySelector('main');
    }

    /**
     * Scanne ou utilise les sections configurées
     */
    private scanSections(): void {
        this.sections = [];

        if (this.options.sections && this.options.sections.length > 0) {
            for (const sec of this.options.sections) {
                const el = document.getElementById(sec.id);
                if (el) {
                    this.sections.push({ ...sec, level: sec.level ?? 2, element: el });
                }
            }
            return;
        }

        if (!this.contentRoot) return;

        const headings = this.contentRoot.querySelectorAll<HTMLElement>(this.options.headings);
        const usedIds = new Set<string>();

        headings.forEach((heading) => {
            const tagLevel = heading.tagName === 'H3' ? 3 : 2;
            const level = (tagLevel === 3 ? 3 : 2) as 2 | 3;
            let id = heading.id;
            const label = (heading.textContent ?? '').trim();

            if (!id) {
                let base = ScrollSpy.slugify(label) || 'section';
                let candidate = base;
                let suffix = 2;
                while (usedIds.has(candidate) || document.getElementById(candidate)) {
                    candidate = `${base}-${suffix}`;
                    suffix++;
                }
                id = candidate;
                heading.id = id;
            }

            usedIds.add(id);
            heading.style.scrollMarginTop = `${this.options.offset}px`;
            this.sections.push({ id, label, level, element: heading });
        });
    }

    private getPageTitle(): string {
        if (this.options.title) return this.options.title;
        const h1 = document.querySelector('main h1, [data-scrollspy-content] h1, h1');
        if (h1?.textContent?.trim()) return h1.textContent.trim();
        return document.title || '';
    }

    private getOverline(): string {
        return this.options.overline ?? LocaleManager.t('scrollspy.onThisPage');
    }

    private buildDom(): void {
        const overline = this.getOverline();
        const title = this.getPageTitle();
        const navLabel = LocaleManager.t('scrollspy.navAriaLabel');

        this.el.innerHTML = `
            <button type="button" class="scrollspy__mobile-trigger" aria-expanded="false">
                <span class="scrollspy__mobile-label">${this.escapeHtml(LocaleManager.t('scrollspy.mobileTrigger'))}<span class="scrollspy__mobile-active"></span></span>
            </button>
            <div class="scrollspy__drawer-overlay" aria-hidden="true"></div>
            <div class="scrollspy__drawer-panel" role="dialog" aria-modal="true" aria-hidden="true"></div>
            <div class="scrollspy__desktop">
                <nav class="scrollspy__nav" aria-label="${this.escapeAttr(navLabel)}"></nav>
            </div>
        `;

        this.mobileTriggerEl = this.el.querySelector('.scrollspy__mobile-trigger');
        this.mobileActiveEl = this.el.querySelector('.scrollspy__mobile-active');
        this.drawerOverlayEl = this.el.querySelector('.scrollspy__drawer-overlay');
        this.drawerPanelEl = this.el.querySelector('.scrollspy__drawer-panel');
        this.navEl = this.el.querySelector('.scrollspy__nav');

        if (this.navEl) {
            this.renderNavContent(this.navEl, overline, title);
        }
        if (this.drawerPanelEl) {
            const drawerNav = document.createElement('nav');
            drawerNav.className = 'scrollspy__nav';
            setAriaAttribute(drawerNav, 'label', navLabel);
            this.renderNavContent(drawerNav, overline, title);
            this.drawerPanelEl.appendChild(drawerNav);
        }
    }

    private renderNavContent(nav: HTMLElement, overline: string, title: string): void {
        nav.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'scrollspy__header';
        const overlineEl = document.createElement('span');
        overlineEl.className = 'scrollspy__overline';
        overlineEl.textContent = overline;
        header.appendChild(overlineEl);
        if (title) {
            const titleEl = document.createElement('p');
            titleEl.className = 'scrollspy__title';
            titleEl.textContent = title;
            header.appendChild(titleEl);
        }
        nav.appendChild(header);

        const body = document.createElement('div');
        body.className = 'scrollspy__body';

        if (this.options.progress) {
            const progress = document.createElement('div');
            progress.className = 'scrollspy__progress';
            progress.setAttribute('aria-hidden', 'true');
            const fill = document.createElement('div');
            fill.className = 'scrollspy__progress-fill';
            progress.appendChild(fill);
            body.appendChild(progress);
            if (nav === this.navEl) {
                this.progressFillEl = fill;
            }
        }

        const listWrap = document.createElement('div');
        listWrap.className = 'scrollspy__list-wrap';

        const pill = document.createElement('div');
        pill.className = 'scrollspy__pill';
        pill.setAttribute('aria-hidden', 'true');
        listWrap.appendChild(pill);

        const list = this.buildNestedList();
        listWrap.appendChild(list);

        body.appendChild(listWrap);
        nav.appendChild(body);

        if (nav === this.navEl) {
            this.listWrapEl = listWrap;
            this.pillEl = pill;
        }

        this.indexLinks(nav);
    }

    private buildNestedList(): HTMLUListElement {
        const root = document.createElement('ul');
        root.className = 'scrollspy__list';
        root.setAttribute('role', 'list');

        let nestedUl: HTMLUListElement | null = null;

        for (const sec of this.sections) {
            const li = document.createElement('li');
            li.className = 'scrollspy__item';
            if (sec.level === 3) {
                li.classList.add('scrollspy__item--level-3');
            }

            const link = document.createElement('a');
            link.className = 'scrollspy__link';
            link.href = `#${sec.id}`;
            link.textContent = sec.label;
            link.dataset.sectionId = sec.id;
            link.tabIndex = -1;
            li.appendChild(link);

            if (sec.level === 3 && nestedUl) {
                nestedUl.appendChild(li);
            } else {
                root.appendChild(li);
                if (sec.level === 2) {
                    nestedUl = document.createElement('ul');
                    nestedUl.className = 'scrollspy__list';
                    nestedUl.setAttribute('role', 'list');
                    li.appendChild(nestedUl);
                } else {
                    nestedUl = null;
                }
            }
        }

        return root;
    }

    private indexLinks(container: ParentNode): void {
        container.querySelectorAll<HTMLAnchorElement>('.scrollspy__link').forEach((link) => {
            const id = link.dataset.sectionId;
            if (id) this.linkMap.set(id, link);
        });
    }

    private setupObservers(): void {
        this.teardownObservers();

        if (this.sections.length === 0 || typeof IntersectionObserver === 'undefined') return;

        const root = this.scrollTarget === window ? null : (this.scrollTarget as HTMLElement);
        const offset = this.options.offset;
        const rootMargin = `-${offset}px 0px -70% 0px`;

        this.intersectionObserver = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            { root, rootMargin, threshold: [0, 0.01, 0.25, 0.5, 1] }
        );

        for (const sec of this.sections) {
            this.intersectionObserver.observe(sec.element);
        }

        if (this.contentRoot) {
            this.sentinelEl = document.createElement('div');
            this.sentinelEl.className = 'scrollspy__sentinel';
            this.sentinelEl.setAttribute('aria-hidden', 'true');
            this.sentinelEl.style.cssText = 'height:1px;width:100%;pointer-events:none;';
            this.contentRoot.appendChild(this.sentinelEl);

            this.bottomObserver = new IntersectionObserver(
                (entries) => {
                    if (this.scrollSpySuspended) return;
                    for (const entry of entries) {
                        if (entry.isIntersecting) {
                            this.activateLastSection();
                        }
                    }
                },
                { root, rootMargin: '0px 0px 0px 0px', threshold: 0 }
            );
            this.bottomObserver.observe(this.sentinelEl);
        }

        if (this.contentRoot && typeof MutationObserver !== 'undefined') {
            this.mutationObserver = new MutationObserver(() => {
                this.scheduleRefresh();
            });
            this.mutationObserver.observe(this.contentRoot, {
                childList: true,
                subtree: true,
                characterData: true,
            });
        }
    }

    private scheduleRefresh(): void {
        if (this.refreshDebounceId != null) {
            window.clearTimeout(this.refreshDebounceId);
        }
        this.refreshDebounceId = window.setTimeout(() => {
            this.refreshDebounceId = null;
            this.refresh();
        }, 300);
    }

    private teardownObservers(): void {
        this.intersectionObserver?.disconnect();
        this.intersectionObserver = null;
        this.bottomObserver?.disconnect();
        this.bottomObserver = null;
        this.mutationObserver?.disconnect();
        this.mutationObserver = null;
        if (this.sentinelEl?.parentNode) {
            this.sentinelEl.parentNode.removeChild(this.sentinelEl);
        }
        this.sentinelEl = null;
    }

    private hasInitialHash(): boolean {
        if (typeof window === 'undefined') return false;
        const hash = window.location.hash.replace(/^#/, '');
        return !!hash && this.sections.some((s) => s.id === hash);
    }

    private isAtScrollTop(threshold = 8): boolean {
        if (this.scrollTarget === window) {
            const raw = window.scrollY ?? document.documentElement.scrollTop ?? 0;
            const scrollTop = Number.isFinite(raw) ? raw : 0;
            return scrollTop <= threshold;
        }
        const scrollTop = (this.scrollTarget as HTMLElement).scrollTop;
        return (Number.isFinite(scrollTop) ? scrollTop : 0) <= threshold;
    }

    /**
     * Active la première section au chargement (sans hash dans l'URL)
     */
    private activateInitialSection(): void {
        if (this.sections.length === 0) return;
        this.setActive(this.sections[0].id, false);
    }

    private handleIntersection(entries: IntersectionObserverEntry[]): void {
        if (this.scrollSpySuspended) return;

        if (this.shouldKeepFirstSectionActive()) {
            this.activateInitialSection();
            return;
        }

        if (this.isAtScrollBottom()) {
            this.activateLastSection();
            return;
        }

        const visible = entries
            .filter((e) => e.isIntersecting)
            .map((e) => ({
                id: (e.target as HTMLElement).id,
                top: e.boundingClientRect.top,
            }))
            .filter((v) => v.id);

        if (visible.length > 0) {
            visible.sort((a, b) => a.top - b.top);
            const best = visible[0];
            this.setActive(best.id, false);
            return;
        }

        if (this.lastActiveId) {
            this.setActive(this.lastActiveId, false);
        } else if (this.options.autoActivateInitial && this.sections.length > 0) {
            this.activateInitialSection();
        }
    }

    private shouldKeepFirstSectionActive(): boolean {
        return (
            this.options.autoActivateInitial &&
            !this.userHasNavigated &&
            !this.hasInitialHash() &&
            this.isAtScrollTop()
        );
    }

    private isAtScrollBottom(): boolean {
        const threshold = 24;
        if (this.scrollTarget === window) {
            const scrollTop = window.scrollY ?? document.documentElement.scrollTop ?? 0;
            const clientHeight = window.innerHeight;
            const scrollHeight = document.documentElement.scrollHeight;
            return scrollTop + clientHeight >= scrollHeight - threshold;
        }
        const el = this.scrollTarget as HTMLElement;
        return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
    }

    private activateLastSection(): void {
        if (this.sections.length === 0) return;
        const last = this.sections[this.sections.length - 1];
        this.setActive(last.id, false);
    }

    private setupMobile(): void {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        this.mobileMq = window.matchMedia(`(max-width: ${this.options.mobileBreakpoint - 1}px)`);
        this.isMobile = this.mobileMq.matches;
        this.applyMobileMode();

        const onChange = (): void => {
            this.isMobile = this.mobileMq?.matches ?? false;
            this.applyMobileMode();
            if (!this.isMobile) this.closeDrawer(false);
        };

        if (typeof this.mobileMq.addEventListener === 'function') {
            this.registerEvent(this.mobileMq, 'change', onChange);
        } else {
            this.mobileMq.addListener(onChange);
        }
    }

    private applyMobileMode(): void {
        this.el.classList.toggle('scrollspy--mobile', this.isMobile);
        if (this.isMobile) {
            this.pinMode = 'none';
            this.el.classList.remove('scrollspy--pinned', 'scrollspy--pinned-end');
            this.resetDesktopPinStyles();
        } else if (this.options.pinDesktop) {
            this.scheduleDesktopPinUpdate();
        } else {
            this.el.classList.add('scrollspy--sticky-native');
        }
    }

    /**
     * Ancrage desktop : position fixed pendant le scroll (contourne overflow-x sur body).
     */
    private setupDesktopPin(): void {
        if (typeof window === 'undefined') return;
        this.desktopEl = this.el.querySelector('.scrollspy__desktop');

        if (!this.options.pinDesktop) {
            this.el.classList.add('scrollspy--sticky-native');
            return;
        }

        const target: Window | HTMLElement = this.scrollTarget;
        this.registerEvent(target, 'scroll', () => this.scheduleDesktopPinUpdate(), { passive: true });

        const container = this.getPinContainer();
        if (typeof ResizeObserver !== 'undefined' && container) {
            this.pinResizeObserver = new ResizeObserver(() => this.scheduleDesktopPinUpdate());
            this.pinResizeObserver.observe(container);
            const railShell = document.querySelector('.navigation-rail-container');
            if (railShell instanceof HTMLElement && railShell !== container) {
                this.pinResizeObserver.observe(railShell);
            }
        }

        this.scheduleDesktopPinUpdate();
    }

    private scheduleDesktopPinUpdate(): void {
        if (typeof window === 'undefined') return;
        if (this.stickyRafId != null) return;
        this.stickyRafId = requestAnimationFrame(() => {
            this.stickyRafId = null;
            this.updateDesktopPin();
        });
    }

    private getPinContainer(): HTMLElement {
        const parent = this.el.parentElement;
        if (!parent) return this.el;

        const explicit = this.el.closest('[data-scrollspy-pin-container]');
        if (explicit instanceof HTMLElement) return explicit;

        const grid = parent.closest('.doc-layout__grid');
        if (grid instanceof HTMLElement) return grid;

        return parent;
    }

    /**
     * Colonne visuelle du TOC (pour left/width en mode pinned).
     */
    private getPinAnchor(): HTMLElement {
        return this.el.parentElement ?? this.el;
    }

    /**
     * Résout le mode pin avec hysteresis pour éviter les bascules rapides au scroll.
     */
    private resolvePinMode(
        containerRect: DOMRectReadOnly,
        pinBottomLimit: number,
        offset: number,
    ): 'none' | 'pinned' | 'pinned-end' {
        const enter = offset;
        const exit = offset + ScrollSpy.PIN_HYSTERESIS_PX;

        switch (this.pinMode) {
            case 'pinned':
                if (pinBottomLimit <= enter) return 'pinned-end';
                if (containerRect.top > exit) return 'none';
                return 'pinned';
            case 'pinned-end':
                if (pinBottomLimit > exit && containerRect.top <= enter) return 'pinned';
                if (containerRect.top > exit && pinBottomLimit > enter) return 'none';
                return 'pinned-end';
            default:
                if (containerRect.top <= enter && pinBottomLimit > enter) return 'pinned';
                if (pinBottomLimit <= enter) return 'pinned-end';
                return 'none';
        }
    }

    /**
     * Applique le mode pin sans frame intermédiaire (évite le clignotement).
     */
    private applyPinMode(
        nextMode: 'none' | 'pinned' | 'pinned-end',
        containerRect: DOMRectReadOnly,
        offset: number,
    ): void {
        if (!this.desktopEl) return;

        if (nextMode === 'pinned') {
            this.el.classList.add('scrollspy--pinned');
            this.el.classList.remove('scrollspy--pinned-end');
            this.desktopEl.style.position = 'fixed';
            this.desktopEl.style.top = `${offset}px`;
            this.desktopEl.style.left = `${containerRect.left}px`;
            this.desktopEl.style.width = `${containerRect.width}px`;
            this.desktopEl.style.zIndex = '10';
            this.desktopEl.style.bottom = '';
            return;
        }

        if (nextMode === 'pinned-end') {
            this.el.classList.remove('scrollspy--pinned');
            this.el.classList.add('scrollspy--pinned-end');
            this.desktopEl.style.position = 'absolute';
            this.desktopEl.style.top = 'auto';
            this.desktopEl.style.bottom = '0';
            this.desktopEl.style.left = '0';
            this.desktopEl.style.width = '100%';
            this.desktopEl.style.zIndex = '';
            return;
        }

        this.el.classList.remove('scrollspy--pinned', 'scrollspy--pinned-end');
        this.resetDesktopPinStyles();
    }

    private updateDesktopPin(): void {
        if (!this.options.pinDesktop || this.isMobile || !this.desktopEl) {
            if (this.pinMode !== 'none') {
                this.pinMode = 'none';
                this.resetDesktopPin();
            }
            return;
        }

        const offset = this.options.offset;
        const container = this.getPinContainer();
        const anchor = this.getPinAnchor();
        const containerRect = container.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();
        const navHeight = this.desktopEl.offsetHeight;
        const pinBottomLimit = containerRect.bottom - navHeight;
        const nextMode = this.resolvePinMode(containerRect, pinBottomLimit, offset);

        if (nextMode === this.pinMode) {
            if (nextMode === 'pinned') {
                this.desktopEl.style.left = `${anchorRect.left}px`;
                this.desktopEl.style.width = `${anchorRect.width}px`;
            }
            return;
        }

        this.pinMode = nextMode;
        this.applyPinMode(nextMode, anchorRect, offset);
        this.updatePillPosition();
    }

    private resetDesktopPin(): void {
        this.pinMode = 'none';
        this.el.classList.remove('scrollspy--pinned', 'scrollspy--pinned-end');
        this.resetDesktopPinStyles();
    }

    private resetDesktopPinStyles(): void {
        if (!this.desktopEl) return;
        this.desktopEl.style.position = '';
        this.desktopEl.style.top = '';
        this.desktopEl.style.left = '';
        this.desktopEl.style.width = '';
        this.desktopEl.style.bottom = '';
        this.desktopEl.style.zIndex = '';
    }

    private setupEvents(): void {
        this.el.querySelectorAll<HTMLAnchorElement>('.scrollspy__link').forEach((link) => {
            this.registerEvent(link, 'click', (e) => this.handleLinkClick(e as MouseEvent, link));
            this.registerEvent(link, 'keydown', (e) => this.handleLinkKeydown(e as KeyboardEvent, link));
        });

        if (this.mobileTriggerEl) {
            setAriaAttributes(this.mobileTriggerEl, {
                'aria-label': LocaleManager.t('scrollspy.openDrawer'),
                'aria-expanded': 'false',
            });
            this.registerEvent(this.mobileTriggerEl, 'click', () => this.openDrawer());
        }

        if (this.drawerOverlayEl) {
            this.registerEvent(this.drawerOverlayEl, 'click', () => this.closeDrawer());
        }

        this.registerEvent(document, 'keydown', (e) => {
            const ke = e as KeyboardEvent;
            if (ke.key === 'Escape' && this.isDrawerOpen) {
                this.closeDrawer();
            }
        });

        if (this.options.progress) {
            const target: Window | HTMLElement = this.scrollTarget;
            this.registerEvent(target, 'scroll', () => this.updateProgress(), { passive: true });
        }

        this.registerEvent(window, 'resize', () => {
            if (this.resizeRafId != null) cancelAnimationFrame(this.resizeRafId);
            this.resizeRafId = requestAnimationFrame(() => {
                this.updatePillPosition();
                if (this.options.pinDesktop) {
                    this.scheduleDesktopPinUpdate();
                }
                this.resizeRafId = null;
            });
        }, { passive: true });
    }

    private handleLinkClick(e: MouseEvent, link: HTMLAnchorElement): void {
        e.preventDefault();
        const id = link.dataset.sectionId;
        if (!id) return;
        this.navigateToSection(id);
        if (this.isDrawerOpen) this.closeDrawer();
    }

    private handleLinkKeydown(e: KeyboardEvent, link: HTMLAnchorElement): void {
        const links = this.getFocusableLinks();
        const idx = links.indexOf(link);
        if (idx === -1) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = links[Math.min(idx + 1, links.length - 1)];
            this.focusLink(next, false);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = links[Math.max(idx - 1, 0)];
            this.focusLink(prev, false);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const id = link.dataset.sectionId;
            if (id) this.navigateToSection(id);
            if (this.isDrawerOpen) this.closeDrawer();
        }
    }

    private getFocusableLinks(): HTMLAnchorElement[] {
        const container = this.isDrawerOpen && this.drawerPanelEl
            ? this.drawerPanelEl
            : this.navEl;
        if (!container) return [];
        return Array.from(container.querySelectorAll<HTMLAnchorElement>('.scrollspy__link'));
    }

    private focusLink(link: HTMLAnchorElement, scrollPage: boolean): void {
        const links = this.getFocusableLinks();
        links.forEach((l) => {
            l.tabIndex = -1;
        });
        link.tabIndex = 0;
        link.focus({ preventScroll: !scrollPage });
        this.focusedLinkIndex = links.indexOf(link);
    }

    private releaseNavigationLock(): void {
        this.scrollSpySuspended = false;
        this.navigationPillStatic = false;
        if (this.pillEl && !this.isReducedMotion()) {
            this.pillEl.classList.remove('scrollspy__pill--static');
        }
        if (this.options.pinDesktop) {
            this.scheduleDesktopPinUpdate();
        }
        this.updatePillPosition();
    }

    /**
     * Relâche le verrou scroll-spy après la fin du scroll (scrollend ou fallback temporisé).
     */
    private scheduleNavigationRelease(fallbackMs: number): void {
        if (this.navigationReleaseTimer !== null) {
            window.clearTimeout(this.navigationReleaseTimer);
            this.navigationReleaseTimer = null;
        }

        const release = (): void => {
            this.navigationReleaseTimer = null;
            this.releaseNavigationLock();
        };

        const target: Window | HTMLElement = this.scrollTarget;
        const supportsScrollEnd = typeof window !== 'undefined' && 'onscrollend' in window;

        if (supportsScrollEnd && typeof target.addEventListener === 'function') {
            const onScrollEnd = (): void => {
                target.removeEventListener('scrollend', onScrollEnd);
                if (this.navigationReleaseTimer !== null) {
                    window.clearTimeout(this.navigationReleaseTimer);
                    this.navigationReleaseTimer = null;
                }
                release();
            };
            target.addEventListener('scrollend', onScrollEnd);
            this.navigationReleaseTimer = window.setTimeout(() => {
                target.removeEventListener('scrollend', onScrollEnd);
                release();
            }, Math.max(fallbackMs, 900));
            return;
        }

        this.navigationReleaseTimer = window.setTimeout(release, fallbackMs);
    }

    private navigateToSection(id: string, smooth = true): void {
        const sec = this.sections.find((s) => s.id === id);
        if (!sec) return;

        this.userHasNavigated = true;
        this.scrollSpySuspended = true;
        this.navigationPillStatic = true;
        if (this.pillEl) {
            this.pillEl.classList.add('scrollspy__pill--static');
        }
        if (this.navigationReleaseTimer !== null) {
            window.clearTimeout(this.navigationReleaseTimer);
            this.navigationReleaseTimer = null;
        }

        const behavior = smooth && !this.isReducedMotion() ? 'smooth' : 'auto';
        this.setActive(id, true);
        sec.element.scrollIntoView({ behavior, block: 'start' });

        if (typeof history !== 'undefined' && history.replaceState) {
            history.replaceState(null, '', `#${id}`);
        }

        const releaseDelay = behavior === 'smooth' ? 450 : 32;
        this.scheduleNavigationRelease(releaseDelay);
    }

    private handleInitialHash(): void {
        if (typeof window === 'undefined') return;
        const hash = window.location.hash.replace(/^#/, '');
        if (!hash) return;
        const exists = this.sections.some((s) => s.id === hash);
        if (!exists) return;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.userHasNavigated = true;
                this.navigateToSection(hash, false);
            });
        });
    }

    /**
     * Re-scanne les headings et reconstruit le sommaire
     */
    public refresh(): void {
        if (this.refreshDebounceId != null) {
            window.clearTimeout(this.refreshDebounceId);
            this.refreshDebounceId = null;
        }
        this.mutationObserver?.disconnect();
        this.teardownObservers();
        this.linkMap.clear();
        this.scanSections();

        if (this.navEl) {
            this.renderNavContent(this.navEl, this.getOverline(), this.getPageTitle());
        }
        if (this.drawerPanelEl) {
            this.drawerPanelEl.innerHTML = '';
            const drawerNav = document.createElement('nav');
            drawerNav.className = 'scrollspy__nav';
            setAriaAttribute(drawerNav, 'label', LocaleManager.t('scrollspy.navAriaLabel'));
            this.renderNavContent(drawerNav, this.getOverline(), this.getPageTitle());
            this.drawerPanelEl.appendChild(drawerNav);
        }

        this.setupObservers();
        this.desktopEl = this.el.querySelector('.scrollspy__desktop');
        this.el.querySelectorAll<HTMLAnchorElement>('.scrollspy__link').forEach((link) => {
            this.registerEvent(link, 'click', (e) => this.handleLinkClick(e as MouseEvent, link));
            this.registerEvent(link, 'keydown', (e) => this.handleLinkKeydown(e as KeyboardEvent, link));
        });

        if (this.activeId && this.sections.some((s) => s.id === this.activeId)) {
            this.setActive(this.activeId, false);
        } else if (this.options.autoActivateInitial) {
            this.activateInitialSection();
        }

        this.updatePillPosition();
        if (this.options.pinDesktop) {
            this.scheduleDesktopPinUpdate();
        } else {
            this.el.classList.add('scrollspy--sticky-native');
        }
        this.logger.info('ScrollSpy refreshed');
    }

    /**
     * Active une section par id
     * @param id Identifiant de section
     * @param fromUser true si déclenché par l'utilisateur
     */
    public setActive(id: string, fromUser: boolean): void {
        const idChanged = this.activeId !== id;
        this.activeId = id;
        this.lastActiveId = id;

        if (idChanged || fromUser) {
            this.syncActiveLinks(id);

            const activeSec = this.sections.find((s) => s.id === id);
            if (this.mobileActiveEl && activeSec) {
                this.mobileActiveEl.textContent = ` · ${activeSec.label}`;
            }

            this.updatePillPosition();
        }

        if (fromUser) {
            this.options.onSelect?.(id);
        }
    }

    /**
     * Synchronise les classes/ARIA des liens avec l'id actif (après rebuild DOM)
     * @param id Identifiant de section active
     */
    private syncActiveLinks(id: string): void {
        this.el.querySelectorAll<HTMLAnchorElement>('.scrollspy__link').forEach((link) => {
            const isActive = link.dataset.sectionId === id;
            link.classList.toggle('scrollspy__link--active', isActive);
            if (isActive) {
                setAriaAttribute(link, 'aria-current', 'location');
                link.tabIndex = 0;
            } else {
                removeAriaAttribute(link, 'aria-current');
                link.tabIndex = -1;
            }
        });
    }

    /**
     * Retourne l'id de la section active
     * @returns id actif ou null
     */
    public getActive(): string | null {
        return this.activeId;
    }

    private updatePillPosition(): void {
        if (!this.pillEl || !this.listWrapEl) return;

        if (this.activeId && !this.listWrapEl.querySelector('.scrollspy__link--active')) {
            this.syncActiveLinks(this.activeId);
        }

        const container = this.isDrawerOpen && this.drawerPanelEl?.querySelector('.scrollspy__list-wrap')
            ? (this.drawerPanelEl.querySelector('.scrollspy__list-wrap') as HTMLElement)
            : this.listWrapEl;

        const activeLink = container.querySelector<HTMLElement>('.scrollspy__link--active');
        if (!activeLink) {
            this.pillEl.style.height = '0';
            return;
        }

        const wrapRect = container.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();
        const top = linkRect.top - wrapRect.top + container.scrollTop;
        const height = linkRect.height;

        if (this.isReducedMotion() || this.navigationPillStatic) {
            this.pillEl.classList.add('scrollspy__pill--static');
        } else {
            this.pillEl.classList.remove('scrollspy__pill--static');
        }

        this.pillEl.style.transform = `translateY(${top}px)`;
        this.pillEl.style.height = `${height}px`;
    }

    private updateProgress(): void {
        if (!this.options.progress) return;

        let progress = 0;
        if (this.scrollTarget === window) {
            const scrollTop = window.scrollY ?? document.documentElement.scrollTop ?? 0;
            const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            progress = Math.min(1, Math.max(0, scrollTop / max));
        } else {
            const el = this.scrollTarget as HTMLElement;
            const max = Math.max(1, el.scrollHeight - el.clientHeight);
            progress = Math.min(1, Math.max(0, el.scrollTop / max));
        }

        this.el.style.setProperty('--scrollspy-progress', String(progress));
        if (this.progressFillEl) {
            this.progressFillEl.style.height = `${progress * 100}%`;
        }
    }

    private openDrawer(): void {
        if (!this.isMobile || this.isDrawerOpen) return;

        this.options.onOpenStart?.(this.el);
        this.isDrawerOpen = true;
        this.el.classList.add('scrollspy--drawer-open');

        if (this.mobileTriggerEl) {
            setAriaAttributes(this.mobileTriggerEl, { 'aria-expanded': 'true' });
        }
        if (this.drawerPanelEl) {
            setAriaAttributes(this.drawerPanelEl, { 'aria-hidden': 'false' });
        }
        if (this.drawerOverlayEl) {
            setAriaAttribute(this.drawerOverlayEl, 'aria-hidden', 'false');
        }

        document.body.style.overflow = 'hidden';
        this.options.onOpenEnd?.(this.el);

        requestAnimationFrame(() => this.updatePillPosition());
    }

    private closeDrawer(notify = true): void {
        if (!this.isDrawerOpen) return;

        if (notify) this.options.onCloseStart?.(this.el);
        this.isDrawerOpen = false;
        this.el.classList.remove('scrollspy--drawer-open');

        if (this.mobileTriggerEl) {
            setAriaAttributes(this.mobileTriggerEl, { 'aria-expanded': 'false' });
        }
        if (this.drawerPanelEl) {
            setAriaAttributes(this.drawerPanelEl, { 'aria-hidden': 'true' });
        }
        if (this.drawerOverlayEl) {
            setAriaAttribute(this.drawerOverlayEl, 'aria-hidden', 'true');
        }

        document.body.style.overflow = '';
        if (notify) this.options.onCloseEnd?.(this.el);
    }

    private isReducedMotion(): boolean {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    private escapeAttr(text: string): string {
        return this.escapeHtml(text);
    }

    override destroy(): void {
        this.teardownObservers();
        this.closeDrawer(false);
        this.resetDesktopPin();

        if (this.stickyRafId != null) {
            cancelAnimationFrame(this.stickyRafId);
            this.stickyRafId = null;
        }
        if (this.resizeRafId != null) {
            cancelAnimationFrame(this.resizeRafId);
            this.resizeRafId = null;
        }
        if (this.refreshDebounceId != null) {
            window.clearTimeout(this.refreshDebounceId);
            this.refreshDebounceId = null;
        }
        if (this.navigationReleaseTimer !== null) {
            window.clearTimeout(this.navigationReleaseTimer);
            this.navigationReleaseTimer = null;
        }
        this.pinResizeObserver?.disconnect();
        this.pinResizeObserver = null;

        if ((this.el as KScrollSpyHTMLElement).K_ScrollSpy === this) {
            delete (this.el as KScrollSpyHTMLElement).K_ScrollSpy;
        }

        this.linkMap.clear();
        this.sections = [];
        this.logger.info('ScrollSpy destroyed');
        super.destroy();
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-scrollspy')) {
    customElements.define('k3ui-scrollspy', class K3UIScrollSpyElement extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }
        disconnectedCallback(): void {}
    });
}
