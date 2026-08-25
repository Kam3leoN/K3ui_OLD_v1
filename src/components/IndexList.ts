/**
 * @fileoverview Composant IndexList pour K3UI
 * @description Annuaire avec sections sticky push et rail de navigation (# → chiffres → A–Z)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { IndexListItemData, IndexListOptions } from '../types/components';
import { PriorityLevel, InitElements } from '../types/base';
import { setAriaAttribute, removeAriaAttribute } from '../utils/dom/aria';
import { LocaleManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { Mouse } from '../core/managers/MouseManager';
import { getIndexListDefaults } from '../specs/components/index-list.specs';
import {
    compareIndexKeys,
    indexKeyToAriaLabel,
    indexKeyToDisplayLabel,
    indexKeyToSectionId,
    INDEX_LIST_KEY_ORDER,
    resolveIndexKeyFromLabel,
    sortIndexKeys,
} from '../utils/helpers/index-list-keys';

const _defaults: IndexListOptions = getIndexListDefaults();

interface IndexListSectionInternal {
    key: string;
    id: string;
    element: HTMLElement;
    header: HTMLElement;
}

interface KIndexListHTMLElement extends HTMLElement {
    K_IndexList?: IndexList;
}

/**
 * Composant IndexList — liste groupée type annuaire téléphonique
 */
export class IndexList extends Component<IndexListOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger = ManagerFactory.getLoggerManager('[IndexList]');
    private sections: IndexListSectionInternal[] = [];
    private activeKey: string | null = null;
    private contentEl: HTMLElement | null = null;
    private railEl: HTMLElement | null = null;
    private scrollTarget: HTMLElement | null = null;
    private intersectionObserver: IntersectionObserver | null = null;
    private scrollSpySuspended = false;
    private navigationReleaseTimer: number | null = null;
    private railMouse: Mouse | null = null;
    private isRailOpen = false;
    private collator: Intl.Collator;

    static get defaults(): IndexListOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): IndexList | null {
        return (el as KIndexListHTMLElement).K_IndexList ?? null;
    }

    static init(el: HTMLElement, options?: Partial<IndexListOptions>): IndexList;
    static init(els: InitElements<HTMLElement> | string, options?: Partial<IndexListOptions>): IndexList[];
    static init(
        els: HTMLElement | InitElements<HTMLElement> | string,
        options: Partial<IndexListOptions> = {},
    ): IndexList | IndexList[] {
        if (typeof els === 'string') {
            const nodes = document.querySelectorAll<HTMLElement>(els);
            return Array.from(nodes).map((node) => IndexList.init(node, options) as IndexList);
        }
        if (els instanceof HTMLElement) {
            const existing = IndexList.getInstance(els);
            if (existing) return existing;
            return new IndexList(els, options);
        }
        return Array.from(els).map((node) => {
            const ex = IndexList.getInstance(node);
            return ex ?? new IndexList(node, options);
        });
    }

    constructor(el: HTMLElement, options: Partial<IndexListOptions> = {}) {
        super(el, options, toComponentClassDef(IndexList));

        const fromHtml = IndexList.readAttributes(el);
        this.options = {
            ...IndexList.defaults,
            ...fromHtml,
            ...options,
        };

        this.collator = new Intl.Collator(this.options.locale, { sensitivity: 'base' });

        (el as KIndexListHTMLElement).K_IndexList = this;
        this.init();
    }

    /**
     * Lit les attributs data-* du host
     * @param el Élément host
     * @returns Options partielles
     */
    private static readAttributes(el: HTMLElement): Partial<IndexListOptions> {
        const out: Partial<IndexListOptions> = {};
        const get = (name: string) => el.getAttribute(`data-${name}`);

        const locale = get('locale');
        if (locale) out.locale = locale;

        const stickyOffset = get('sticky-offset');
        if (stickyOffset != null) {
            const n = parseInt(stickyOffset, 10);
            if (!Number.isNaN(n)) out.stickyOffset = n;
        }

        if (get('show-rail') === 'true') out.showRail = true;
        if (get('show-rail') === 'false') out.showRail = false;

        if (get('sticky-headers') === 'true') out.stickyHeaders = true;
        if (get('sticky-headers') === 'false') out.stickyHeaders = false;

        if (get('hide-empty-keys') === 'true') out.hideEmptyKeys = true;
        if (get('hide-empty-keys') === 'false') out.hideEmptyKeys = false;

        if (get('rail-scrub') === 'true') out.railScrub = true;
        if (get('rail-scrub') === 'false') out.railScrub = false;

        const scrollRoot = get('scroll-root');
        if (scrollRoot) out.scrollRoot = scrollRoot;

        const dataItems = get('items');
        if (dataItems) {
            try {
                const parsed = JSON.parse(dataItems) as IndexListItemData[];
                if (Array.isArray(parsed)) out.items = parsed;
            } catch {
                console.warn('[IndexList] data-items invalide (JSON attendu)');
            }
        }

        return out;
    }

    private init(): void {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        this.el.classList.add('index-list');
        this.applyStickyOffset();

        this.ensureContentStructure();
        this.resolveScrollTarget();
        this.buildSectionsFromContent();
        this.applySectionStyles();
        this.buildRail();
        this.setupObservers();
        this.setupRailEvents();

        if (this.sections.length > 0) {
            this.setActiveKey(this.sections[0].key, false);
        }

        this.logger.info('IndexList initialized');
    }

    private applyStickyOffset(): void {
        this.el.style.setProperty('--k3ui-index-list-sticky-offset', `${this.options.stickyOffset}px`);
        this.el.classList.toggle('index-list--sticky', this.options.stickyHeaders);
        this.el.classList.toggle('index-list--rail', this.options.showRail);
    }

    private resolveScrollTarget(): void {
        const { scrollRoot } = this.options;
        if (scrollRoot instanceof HTMLElement) {
            this.scrollTarget = scrollRoot;
            return;
        }
        if (typeof scrollRoot === 'string') {
            const found = document.querySelector(scrollRoot);
            this.scrollTarget = found instanceof HTMLElement ? found : null;
            return;
        }
        this.scrollTarget = this.contentEl;
    }

    private ensureContentStructure(): void {
        let content = this.el.querySelector<HTMLElement>('.index-list__content');
        if (!content) {
            content = document.createElement('div');
            content.className = 'index-list__content';
            while (this.el.firstChild) {
                content.appendChild(this.el.firstChild);
            }
            this.el.appendChild(content);
        }
        this.contentEl = content;

        if (this.options.items && this.options.items.length > 0) {
            this.renderItemsData(this.options.items);
        }
    }

    /**
     * Rendu data-driven des entrées
     * @param items Entrées à afficher
     */
    private renderItemsData(items: IndexListItemData[]): void {
        if (!this.contentEl) return;

        this.contentEl.innerHTML = '';
        const grouped = this.groupItemsByKey(items);

        for (const key of sortIndexKeys(Object.keys(grouped))) {
            const section = this.createSectionElement(key, grouped[key]);
            this.contentEl.appendChild(section);
        }
    }

    private groupItemsByKey(items: IndexListItemData[]): Record<string, IndexListItemData[]> {
        const groups: Record<string, IndexListItemData[]> = {};

        for (const item of items) {
            const key = this.resolveItemKey(item);
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        }

        for (const key of Object.keys(groups)) {
            groups[key].sort((a, b) => this.collator.compare(a.label, b.label));
        }

        return groups;
    }

    private resolveItemKey(item: IndexListItemData | HTMLElement): string {
        if (this.options.getKey) {
            return this.normalizeKey(this.options.getKey(item));
        }

        if (item instanceof HTMLElement) {
            const attr = this.options.indexKeyAttr;
            const fromAttr = item.getAttribute(attr) ?? item.dataset.indexKey;
            if (fromAttr) {
                return this.normalizeKey(fromAttr);
            }
            const text = (item.textContent ?? '').trim();
            return resolveIndexKeyFromLabel(text, this.options.locale);
        }

        if (item.key) {
            return this.normalizeKey(item.key);
        }

        return resolveIndexKeyFromLabel(item.label, this.options.locale);
    }

    private normalizeKey(raw: string): string {
        const trimmed = raw.trim();
        if (!trimmed) return '#';
        if (INDEX_LIST_KEY_ORDER.includes(trimmed)) return trimmed;
        return resolveIndexKeyFromLabel(trimmed, this.options.locale);
    }

    private createSectionElement(key: string, items: IndexListItemData[]): HTMLElement {
        const section = document.createElement('section');
        section.className = 'index-list__section';
        section.id = indexKeyToSectionId(key);
        section.dataset.indexKey = key;

        const header = document.createElement('header');
        header.className = 'index-list__header';
        header.textContent = indexKeyToDisplayLabel(key);
        section.appendChild(header);

        const list = document.createElement('ul');
        list.className = 'index-list__items';
        list.setAttribute('role', 'list');

        for (const item of items) {
            const li = document.createElement('li');
            li.className = 'index-list__item';
            li.setAttribute(this.options.indexKeyAttr, item.label);
            if (item.html) {
                li.innerHTML = item.html;
            } else {
                li.textContent = item.label;
            }
            list.appendChild(li);
        }

        section.appendChild(list);
        return section;
    }

    /**
     * Regroupe les items plats ou valide les sections existantes
     */
    private buildSectionsFromContent(): void {
        if (!this.contentEl) return;

        const existingSections = Array.from(
            this.contentEl.querySelectorAll<HTMLElement>(':scope > .index-list__section'),
        );

        if (existingSections.length === 0) {
            this.regroupFlatItems();
            return;
        }

        this.sortExistingSections(existingSections);
    }

    private regroupFlatItems(): void {
        if (!this.contentEl) return;

        const flatItems = Array.from(
            this.contentEl.querySelectorAll<HTMLElement>(':scope > .index-list__item'),
        );
        if (flatItems.length === 0) return;

        const groups = new Map<string, HTMLElement[]>();

        for (const item of flatItems) {
            const key = this.resolveItemKey(item);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(item);
        }

        const sortedKeys = sortIndexKeys(Array.from(groups.keys()));
        const fragment = document.createDocumentFragment();

        for (const key of sortedKeys) {
            const section = document.createElement('section');
            section.className = 'index-list__section';
            section.id = indexKeyToSectionId(key);
            section.dataset.indexKey = key;

            const header = document.createElement('header');
            header.className = 'index-list__header';
            header.textContent = indexKeyToDisplayLabel(key);
            section.appendChild(header);

            const list = document.createElement('ul');
            list.className = 'index-list__items';
            list.setAttribute('role', 'list');

            const items = groups.get(key) ?? [];
            items.sort((a, b) =>
                this.collator.compare((a.textContent ?? '').trim(), (b.textContent ?? '').trim()),
            );

            for (const item of items) {
                const li = document.createElement('li');
                li.className = 'index-list__item';
                li.innerHTML = item.innerHTML;
                Array.from(item.attributes).forEach((attr) => {
                    if (attr.name !== 'class') {
                        li.setAttribute(attr.name, attr.value);
                    }
                });
                list.appendChild(li);
            }

            section.appendChild(list);
            fragment.appendChild(section);
        }

        this.contentEl.innerHTML = '';
        this.contentEl.appendChild(fragment);
    }

    private sortExistingSections(sections: HTMLElement[]): void {
        if (!this.contentEl) return;

        const withKeys = sections.map((section) => {
            const header = section.querySelector<HTMLElement>('.index-list__header');
            const rawKey =
                section.dataset.indexKey ??
                header?.textContent ??
                section.getAttribute(this.options.indexKeyAttr) ??
                '#';
            const key = this.normalizeKey(rawKey);
            section.dataset.indexKey = key;
            section.id = indexKeyToSectionId(key);
            if (header) {
                header.textContent = indexKeyToDisplayLabel(key);
            }
            return { key, section };
        });

        withKeys.sort((a, b) => compareIndexKeys(a.key, b.key));

        const fragment = document.createDocumentFragment();
        for (const { section } of withKeys) {
            fragment.appendChild(section);
        }
        this.contentEl.appendChild(fragment);
    }

    private collectSections(): IndexListSectionInternal[] {
        if (!this.contentEl) return [];

        const sectionEls = Array.from(
            this.contentEl.querySelectorAll<HTMLElement>(':scope > .index-list__section'),
        );

        return sectionEls.map((element) => {
            const header =
                element.querySelector<HTMLElement>('.index-list__header') ??
                element.querySelector<HTMLElement>('header')!;
            const key = element.dataset.indexKey ?? this.normalizeKey(header?.textContent ?? '#');
            const id = element.id || indexKeyToSectionId(key);
            element.id = id;
            element.dataset.indexKey = key;
            return { key, id, element, header };
        });
    }

    private applySectionStyles(): void {
        this.sections = this.collectSections();
        const total = this.sections.length;

        this.sections.forEach((sec, index) => {
            sec.element.style.scrollMarginTop = `${this.options.stickyOffset}px`;
            if (sec.header && this.options.stickyHeaders) {
                sec.header.style.zIndex = String(total - index);
            }
        });
    }

    private buildRail(): void {
        if (!this.options.showRail) {
            this.railEl?.remove();
            this.railEl = null;
            return;
        }

        let rail = this.el.querySelector<HTMLElement>('.index-list__rail');
        if (!rail) {
            rail = document.createElement('nav');
            rail.className = 'index-list__rail';
            this.el.insertBefore(rail, this.contentEl);
        }

        this.railEl = rail;
        rail.innerHTML = '';

        setAriaAttribute(rail, 'label', LocaleManager.t('indexList.railAriaLabel'));

        const presentKeys = new Set(this.sections.map((s) => s.key));
        const keysToShow = this.options.hideEmptyKeys
            ? sortIndexKeys(Array.from(presentKeys))
            : [...INDEX_LIST_KEY_ORDER];

        const sectionJump = LocaleManager.t('indexList.sectionJump');

        for (const key of keysToShow) {
            const hasSection = presentKeys.has(key);
            if (this.options.hideEmptyKeys && !hasSection) continue;

            const link = document.createElement('a');
            link.className = 'index-list__rail-item';
            link.href = `#${indexKeyToSectionId(key)}`;
            link.dataset.indexKey = key;
            link.textContent = indexKeyToDisplayLabel(key);

            const ariaLabel = indexKeyToAriaLabel(key, sectionJump);
            setAriaAttribute(link, 'label', ariaLabel);

            if (!hasSection) {
                link.classList.add('index-list__rail-item--empty');
                setAriaAttribute(link, 'aria-disabled', 'true');
                link.tabIndex = -1;
            } else {
                this.registerEvent(link, 'click', (e) => this.handleRailClick(e as MouseEvent, key));
            }

            rail.appendChild(link);
        }
    }

    private setupObservers(): void {
        this.teardownObservers();
        this.sections = this.collectSections();

        if (this.sections.length === 0 || typeof IntersectionObserver === 'undefined') return;

        const root = this.scrollTarget;
        const offset = this.options.stickyOffset;
        const rootMargin = `-${offset + 1}px 0px -60% 0px`;

        this.intersectionObserver = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            { root, rootMargin, threshold: [0, 0.01, 0.25, 0.5, 1] },
        );

        for (const sec of this.sections) {
            this.intersectionObserver.observe(sec.element);
        }
    }

    private teardownObservers(): void {
        this.intersectionObserver?.disconnect();
        this.intersectionObserver = null;
    }

    private handleIntersection(entries: IntersectionObserverEntry[]): void {
        if (this.scrollSpySuspended) return;

        const visible = entries
            .filter((e) => e.isIntersecting)
            .map((e) => ({
                key: (e.target as HTMLElement).dataset.indexKey ?? '',
                top: e.boundingClientRect.top,
            }))
            .filter((v) => v.key);

        if (visible.length > 0) {
            visible.sort((a, b) => a.top - b.top);
            this.setActiveKey(visible[0].key, false);
        }
    }

    private setupRailEvents(): void {
        if (!this.options.railScrub || !this.railEl) return;

        this.railMouse?.destroy();
        this.railMouse = new Mouse({
            target: this.railEl,
            onMouseMove: (e) => this.handleRailScrub(e),
            onDrag: (e) => this.handleRailScrub(e),
        });

        this.registerEvent(this.railEl, 'touchmove', (e) => {
            if (e instanceof TouchEvent) {
                this.handleRailScrub(e);
            }
        }, { passive: true });
    }

    private handleRailScrub(event: MouseEvent | TouchEvent): void {
        if (!this.railEl) return;

        const clientX = event instanceof TouchEvent ? event.touches[0]?.clientX ?? 0 : event.clientX;
        const clientY = event instanceof TouchEvent ? event.touches[0]?.clientY ?? 0 : event.clientY;
        const target = document.elementFromPoint(clientX, clientY);

        const railItem = target?.closest<HTMLElement>('.index-list__rail-item:not(.index-list__rail-item--empty)');
        const key = railItem?.dataset.indexKey;
        if (key) {
            this.scrollToKey(key, false);
        }
    }

    private handleRailClick(event: MouseEvent, key: string): void {
        event.preventDefault();
        this.scrollToKey(key, true);
        this.options.onRailSelect?.(key);
    }

    private scheduleNavigationRelease(fallbackMs: number): void {
        if (this.navigationReleaseTimer !== null) {
            window.clearTimeout(this.navigationReleaseTimer);
            this.navigationReleaseTimer = null;
        }

        const release = (): void => {
            this.navigationReleaseTimer = null;
            this.scrollSpySuspended = false;
        };

        const target = this.scrollTarget;
        const supportsScrollEnd = typeof window !== 'undefined' && 'onscrollend' in window;

        if (supportsScrollEnd && target) {
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

    /**
     * Scroll vers une section par clé
     * @param key Clé de groupe
     * @param fromUser true si déclenché par l'utilisateur
     */
    public scrollToKey(key: string, fromUser = true): void {
        const section = this.sections.find((s) => s.key === key);
        if (!section) return;

        this.scrollSpySuspended = true;
        if (this.navigationReleaseTimer !== null) {
            window.clearTimeout(this.navigationReleaseTimer);
            this.navigationReleaseTimer = null;
        }

        const behavior =
            fromUser && !this.isReducedMotion() ? this.options.scrollBehavior : 'auto';

        this.setActiveKey(key, fromUser);
        section.element.scrollIntoView({ behavior, block: 'start' });

        const releaseDelay = behavior === 'smooth' ? 450 : 32;
        this.scheduleNavigationRelease(releaseDelay);
    }

    /**
     * Retourne la clé de section active
     * @returns Clé active ou null
     */
    public getActiveKey(): string | null {
        return this.activeKey;
    }

    /**
     * Re-scanne le contenu et reconstruit rail + observers
     */
    public refresh(): void {
        this.teardownObservers();
        this.buildSectionsFromContent();
        this.applySectionStyles();
        this.buildRail();
        this.setupObservers();
        this.setupRailEvents();

        if (this.activeKey && this.sections.some((s) => s.key === this.activeKey)) {
            this.setActiveKey(this.activeKey, false);
        } else if (this.sections.length > 0) {
            this.setActiveKey(this.sections[0].key, false);
        }

        this.logger.info('IndexList refreshed');
    }

    /**
     * Met à jour les entrées data-driven
     * @param items Nouvelles entrées
     */
    public setItems(items: IndexListItemData[]): void {
        this.options.items = items;
        if (this.contentEl) {
            this.renderItemsData(items);
        }
        this.refresh();
    }

    /**
     * Ouvre le rail (mobile / overlay)
     */
    public open(): void {
        if (this.isRailOpen) return;
        this.options.onOpenStart?.(this.el);
        this.isRailOpen = true;
        this.el.classList.add('index-list--rail-open');
        this.options.onOpenEnd?.(this.el);
    }

    /**
     * Ferme le rail
     */
    public close(): void {
        if (!this.isRailOpen) return;
        this.options.onCloseStart?.(this.el);
        this.isRailOpen = false;
        this.el.classList.remove('index-list--rail-open');
        this.options.onCloseEnd?.(this.el);
    }

    private setActiveKey(key: string, fromUser: boolean): void {
        const changed = this.activeKey !== key;
        this.activeKey = key;
        this.syncRailActive(key);

        const section = this.sections.find((s) => s.key === key);
        if (section && (changed || fromUser)) {
            this.options.onSectionChange?.(key, section.element);
        }
    }

    private syncRailActive(key: string): void {
        if (!this.railEl) return;

        this.railEl.querySelectorAll<HTMLElement>('.index-list__rail-item').forEach((link) => {
            const isActive = link.dataset.indexKey === key;
            link.classList.toggle('index-list__rail-item--active', isActive);
            if (isActive) {
                setAriaAttribute(link, 'aria-current', 'true');
            } else {
                removeAriaAttribute(link, 'aria-current');
            }
        });
    }

    private isReducedMotion(): boolean {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    override destroy(): void {
        this.teardownObservers();
        this.railMouse?.destroy();
        this.railMouse = null;

        if (this.navigationReleaseTimer !== null) {
            window.clearTimeout(this.navigationReleaseTimer);
            this.navigationReleaseTimer = null;
        }

        if ((this.el as KIndexListHTMLElement).K_IndexList === this) {
            delete (this.el as KIndexListHTMLElement).K_IndexList;
        }

        this.sections = [];
        this.logger.info('IndexList destroyed');
        super.destroy();
    }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-index-list')) {
    customElements.define('k3ui-index-list', class K3UIIndexListElement extends HTMLElement {
        connectedCallback(): void {
            if (!this.classList.contains('index-list')) {
                this.classList.add('index-list');
            }
        }
    });
}

declare global {
    interface HTMLElementTagNameMap {
        'k3ui-index-list': HTMLElement;
    }
}
