/**
 * @fileoverview Composant CodeBlock pour K3UI
 * @description Affichage de code avec coloration syntaxique intégrée (sans Prism), carte et toolbar Material Design 3 Expressive
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { CodeBlockOptions } from '../types/components';
import { PriorityLevel, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { sanitizeHtmlFragment } from '../utils/dom/sanitize';
import { copyToClipboard } from '../utils/helpers/clipboard';
import { highlight, getLanguageFromElement } from '../utils/syntax/codeblock-highlighter';
import { LoggerManager, LocaleManager, IconManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getCodeBlockDefaults } from '../specs/components/codeblock.specs';
import { Snackbar } from './Snackbar';
import { Tabs } from './Tabs';
import { Tooltips } from './Tooltips';
import { ButtonIcon } from './ButtonIcon';

const _defaults: CodeBlockOptions = getCodeBlockDefaults();

/** Balises/attributs autorisés dans le HTML produit par le highlighter (tokens `<span class="...">`) */
const HIGHLIGHT_ALLOWED_TAGS = new Set(['span']);
const HIGHLIGHT_ALLOWED_ATTRS: Record<string, Set<string>> = {
    span: new Set(['class']),
};

/**
 * Classe CodeBlock pour K3UI
 * Coloration syntaxique intégrée (html, php, js, ts, lua, css, scss, sass, xml, sql, markdown) — composant indépendant.
 */
export class CodeBlock extends Component<CodeBlockOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;
    private logger: LoggerManager;
    private cardEl: HTMLElement | null = null;
    private toolbarEl: HTMLElement | null = null;
    private contentEl: HTMLElement | null = null;
    private copyBtn: HTMLButtonElement | null = null;
    private downloadBtn: HTMLButtonElement | null = null;
    private copyTimeoutId: number = 0;
    private isMultiple: boolean = false;
    private expandBarEl: HTMLElement | null = null;
    private expandLabelEl: HTMLElement | null = null;
    private isExpanded: boolean = false;

    static get defaults(): CodeBlockOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): CodeBlock | undefined {
        return Component.getInstance(el) as CodeBlock | undefined;
    }

    static init(el: HTMLElement, options?: Partial<CodeBlockOptions>): CodeBlock;
    static init(els: InitElements<HTMLElement> | string, options?: Partial<CodeBlockOptions>): CodeBlock[];
    static init(
        els: HTMLElement | InitElements<HTMLElement> | string,
        options: Partial<CodeBlockOptions> = {}
    ): CodeBlock | CodeBlock[] {
        const resolved: HTMLElement | NodeListOf<HTMLElement> =
            typeof els === 'string' ? document.querySelectorAll<HTMLElement>(els) : (els as HTMLElement | NodeListOf<HTMLElement>);
        return super.init(
            resolved,
            options,
            CodeBlock as ComponentType<CodeBlock, CodeBlockOptions>
        ) as CodeBlock | CodeBlock[];
    }

    constructor(el: HTMLElement, options: Partial<CodeBlockOptions> = {}) {
        super(el, options, toComponentClassDef(CodeBlock));
        this.logger = ManagerFactory.getLoggerManager('[CodeBlock]');
        this.options = { ...CodeBlock.defaults, ...options };
        if (el.getAttribute('data-collapsible') === 'true' || el.getAttribute('data-collapsible') === '') {
            this.options.collapsible = true;
        }
        const dataHeight = el.getAttribute('data-collapsed-height');
        if (dataHeight !== null && dataHeight !== '') {
            const n = parseInt(dataHeight, 10);
            if (!Number.isNaN(n) && n > 0) this.options.collapsedHeight = n;
        }
        const dataMinLines = el.getAttribute('data-collapsible-min-lines');
        if (dataMinLines !== null && dataMinLines !== '') {
            const n = parseInt(dataMinLines, 10);
            if (!Number.isNaN(n) && n >= 0) this.options.collapsibleMinLines = n;
        }
        this.init();
    }

    private init(): void {
        this.buildStructure();
        this.setupAccessibility();
        // Fallback : tenter une coloration uniquement si le bloc n'est pas déjà pré-rendu.
        this.applyHighlightFallback();
        const lineCount = this.getCodeLineCount();
        const shouldCollapse = this.options.collapsible || lineCount > this.options.collapsibleMinLines;
        if (shouldCollapse && this.cardEl) {
            this.setupCollapsible();
        }
        this.logger.info('Component initialized');
    }

    /** Nombre de lignes du code (max sur tous les blocs/onglets) pour le seuil collapsible. */
    private getCodeLineCount(): number {
        const codeEls = this.el.querySelectorAll('code');
        let max = 0;
        codeEls.forEach((el) => {
            const text = (el.textContent ?? '').replace(/\r/g, '');
            const n = text.length > 0 ? text.split('\n').length : 0;
            if (n > max) max = n;
        });
        return max;
    }

    /**
     * Retourne le conteneur de contenu actif (zone repliable) — simple ou onglet actif en mode multiple.
     */
    private getActiveContentEl(): HTMLElement | null {
        if (this.isMultiple) {
            const activePanel = this.el.querySelector('.tabs-item--active');
            return activePanel?.querySelector('.codeblock__content') ?? null;
        }
        return this.contentEl;
    }

    /**
     * Configure le repli du code : barre « Voir plus » / « Réduire », hauteur repliée, gradient et toggle.
     */
    private setupCollapsible(): void {
        if (!this.cardEl) return;
        const root = this.el;
        root.classList.add('codeblock--collapsible');
        const h = this.options.collapsedHeight;
        root.style.setProperty('--codeblock-collapsed-height', `${h}px`);

        const expandBar = document.createElement('div');
        expandBar.className = 'codeblock__expand-bar';
        expandBar.setAttribute('role', 'button');
        expandBar.setAttribute('tabindex', '0');
        setAriaAttributes(expandBar, { 'aria-expanded': 'false', 'aria-label': LocaleManager.t('codeblock.expandMore') });
        const icon = document.createElement('i');
        icon.setAttribute('name', 'chevron');
        icon.setAttribute('type', 'classic');
        expandBar.appendChild(icon);
        const labelSpan = document.createElement('span');
        labelSpan.className = 'codeblock__expand-bar-label';
        labelSpan.textContent = LocaleManager.t('codeblock.expandMore');
        expandBar.appendChild(labelSpan);
        this.expandBarEl = expandBar;
        this.expandLabelEl = labelSpan;
        this.cardEl.appendChild(expandBar);
        IconManager.processIconsInContainer(expandBar);

        const allContentEls = this.el.querySelectorAll<HTMLElement>('.codeblock__content');
        allContentEls.forEach((content) => {
            content.style.height = `${h}px`;
            content.style.overflow = 'hidden';
        });

        const toggleExpand = (): void => {
            const content = this.getActiveContentEl();
            if (!content || !this.expandBarEl || !this.expandLabelEl) return;
            this.isExpanded = !this.isExpanded;
            if (this.isExpanded) {
                content.style.setProperty('--full-height', `${content.scrollHeight}px`);
                content.classList.add('codeblock__content--expanded');
                content.style.height = 'var(--full-height)';
                this.expandBarEl.classList.add('codeblock__expand-bar--expanded');
                this.expandLabelEl.textContent = LocaleManager.t('codeblock.expandLess');
                setAriaAttributes(this.expandBarEl, { 'aria-expanded': 'true', 'aria-label': LocaleManager.t('codeblock.expandLess') });
            } else {
                content.classList.remove('codeblock__content--expanded');
                content.style.height = `${this.options.collapsedHeight}px`;
                content.style.removeProperty('--full-height');
                this.expandBarEl.classList.remove('codeblock__expand-bar--expanded');
                this.expandLabelEl.textContent = LocaleManager.t('codeblock.expandMore');
                setAriaAttributes(this.expandBarEl, { 'aria-expanded': 'false', 'aria-label': LocaleManager.t('codeblock.expandMore') });
            }
        };

        const syncActiveContentExpandState = (): void => {
            const content = this.getActiveContentEl();
            if (!content || !this.expandBarEl || !this.expandLabelEl) return;
            const h = this.options.collapsedHeight;
            if (this.isExpanded) {
                content.style.setProperty('--full-height', `${content.scrollHeight}px`);
                content.classList.add('codeblock__content--expanded');
                content.style.height = 'var(--full-height)';
                this.expandBarEl.classList.add('codeblock__expand-bar--expanded');
                this.expandLabelEl.textContent = LocaleManager.t('codeblock.expandLess');
                setAriaAttributes(this.expandBarEl, { 'aria-expanded': 'true', 'aria-label': LocaleManager.t('codeblock.expandLess') });
            } else {
                content.classList.remove('codeblock__content--expanded');
                content.style.removeProperty('--full-height');
                content.style.height = `${h}px`;
                this.expandBarEl.classList.remove('codeblock__expand-bar--expanded');
                this.expandLabelEl.textContent = LocaleManager.t('codeblock.expandMore');
                setAriaAttributes(this.expandBarEl, { 'aria-expanded': 'false', 'aria-label': LocaleManager.t('codeblock.expandMore') });
            }
        };

        this.registerEvent(expandBar, 'click', toggleExpand);
        this.registerEvent(expandBar, 'keydown', (e: Event) => {
            const ke = e as KeyboardEvent;
            if (ke.key === 'Enter' || ke.key === ' ') {
                ke.preventDefault();
                toggleExpand();
            }
        });
        if (this.isMultiple) {
            this.cardEl.querySelectorAll('.tabs__tab').forEach((tab) => {
                this.registerEvent(tab, 'click', () => {
                    requestAnimationFrame(() => syncActiveContentExpandState());
                });
            });
        }
    }

    /**
     * Retourne l'élément code actif (visible) — pour mode simple ou onglet actif en mode multiple
     */
    private getActiveCodeEl(): HTMLElement | null {
        if (this.isMultiple) {
            const activePanel = this.el.querySelector('.tabs-item--active');
            return activePanel?.querySelector('code') ?? this.el.querySelector('code');
        }
        return this.el.querySelector('code');
    }

    /**
     * Construit la structure card + toolbar + content (MD3). Support single et multiple (tabs primary sans icône).
     */
    private buildStructure(): void {
        const root = this.el;
        const pres = Array.from(root.querySelectorAll<HTMLPreElement>(':scope > pre'));
        const panes = Array.from(root.querySelectorAll<HTMLElement>(':scope > .codeblock__pane'));
        this.isMultiple = panes.length > 1 || (pres.length > 1 && pres.every((p) => p.querySelector('code')));

        if (this.isMultiple && panes.length > 1) {
            this.buildMultipleStructure(panes);
            return;
        }
        if (this.isMultiple && pres.length > 1) {
            this.buildMultipleStructureFromPres(pres);
            return;
        }

        const pre = root.querySelector('pre');
        const code = pre?.querySelector('code') ?? root.querySelector('code');
        const hasPreCode = pre && code;

        if (!hasPreCode && !code) {
            this.logger.warn('CodeBlock: no pre/code found, skipping structure');
            return;
        }

        if (root.classList.contains('codeblock--structured') && root.querySelector('.codeblock__card')) {
            this.cardEl = root.querySelector('.codeblock__card');
            this.toolbarEl = root.querySelector('.codeblock__toolbar');
            this.contentEl = root.querySelector('.codeblock__content');
            this.copyBtn = root.querySelector('.codeblock__copy');
            this.downloadBtn = root.querySelector('.codeblock__download');

            /* Si pas de toolbar (HTML déjà structuré sans barre), la créer et l'insérer avant le content */
            if (!this.toolbarEl && this.cardEl) {
                const toolbar = document.createElement('div');
                toolbar.className = 'codeblock__toolbar';
                this.toolbarEl = toolbar;
                const left = document.createElement('div');
                left.className = 'codeblock__toolbar-left';
                const label = (this.options.label || root.getAttribute('data-label') || root.querySelector('pre')?.getAttribute('data-label')) ?? '';
                if (label) {
                    const labelSpan = document.createElement('span');
                    labelSpan.className = 'codeblock__label';
                    labelSpan.textContent = label;
                    left.appendChild(labelSpan);
                }
                toolbar.appendChild(left);
                const actions = document.createElement('div');
                actions.className = 'codeblock__toolbar-actions';
                this.copyBtn = this.createCopyButton();
                actions.appendChild(this.copyBtn);
                this.downloadBtn = this.createDownloadButton();
                actions.appendChild(this.downloadBtn);
                toolbar.appendChild(actions);
                const content = this.cardEl.querySelector('.codeblock__content');
                if (content) {
                    this.cardEl.insertBefore(toolbar, content);
                } else {
                    this.cardEl.insertBefore(toolbar, this.cardEl.firstChild);
                }
                IconManager.processIconsInContainer(toolbar);
            } else {
                const actions = this.toolbarEl?.querySelector('.codeblock__toolbar-actions');
                if (actions) {
                    if (!this.copyBtn) {
                        this.copyBtn = this.createCopyButton();
                        actions.appendChild(this.copyBtn);
                    }
                    if (!this.downloadBtn) {
                        this.downloadBtn = this.createDownloadButton();
                        actions.appendChild(this.downloadBtn);
                    }
                }
            }
            this.initActionTooltips();
            this.attachCopyHandler();
            this.attachDownloadHandler();
            return;
        }

        const card = document.createElement('div');
        card.className = 'codeblock__card';
        this.cardEl = card;

        /* Toolbar toujours présente avec au moins les actions Copier / Télécharger (tabs ou non) */
        const toolbar = document.createElement('div');
        toolbar.className = 'codeblock__toolbar';
        this.toolbarEl = toolbar;

        const left = document.createElement('div');
        left.className = 'codeblock__toolbar-left';
        const label = this.options.label || root.getAttribute('data-label') || (pre?.getAttribute('data-label') ?? '');
        if (label) {
            const labelSpan = document.createElement('span');
            labelSpan.className = 'codeblock__label';
            labelSpan.textContent = label;
            left.appendChild(labelSpan);
        }
        toolbar.appendChild(left);

        const actions = document.createElement('div');
        actions.className = 'codeblock__toolbar-actions';
        this.copyBtn = this.createCopyButton();
        actions.appendChild(this.copyBtn);
        this.downloadBtn = this.createDownloadButton();
        actions.appendChild(this.downloadBtn);
        toolbar.appendChild(actions);

        card.appendChild(toolbar);

        const content = document.createElement('div');
        content.className = 'codeblock__content';
        this.contentEl = content;

        if (pre && pre.parentNode === root) {
            root.removeChild(pre);
            content.appendChild(pre);
        } else if (code) {
            const preWrap = document.createElement('pre');
            if (code.parentNode) code.parentNode.removeChild(code);
            preWrap.appendChild(code);
            content.appendChild(preWrap);
        }

        card.appendChild(content);

        while (root.firstChild) root.removeChild(root.firstChild);
        root.appendChild(card);
        root.classList.add('codeblock--structured');

        IconManager.processIconsInContainer(toolbar);
        this.initActionTooltips();
        this.attachCopyHandler();
        this.attachDownloadHandler();
    }

    /** Initialise les tooltips et ButtonIcon sur les boutons Copier et Télécharger (créés dynamiquement, hors scan AutoInit), affichés vers le haut. */
    private initActionTooltips(): void {
        const tooltipOptions = { placement: 'top' as const };
        if (this.copyBtn) Tooltips.init(this.copyBtn, tooltipOptions);
        if (this.downloadBtn) Tooltips.init(this.downloadBtn, tooltipOptions);
        const actionBtns: HTMLElement[] = [];
        if (this.copyBtn) actionBtns.push(this.copyBtn);
        if (this.downloadBtn) actionBtns.push(this.downloadBtn);
        actionBtns.forEach((btn) => {
            ButtonIcon.init(btn, {});
        });
    }

    private createCopyButton(): HTMLButtonElement {
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'codeblock__copy btn-icon btn-icon--standard ripple';
        copyBtn.setAttribute('data-tooltip', LocaleManager.t('codeblock.copy'));
        setAriaAttributes(copyBtn, { 'aria-label': LocaleManager.t('codeblock.copy') });
        const icon = document.createElement('i');
        icon.setAttribute('name', 'copy-content');
        icon.setAttribute('type', 'classic');
        copyBtn.appendChild(icon);
        return copyBtn;
    }

    private createDownloadButton(): HTMLButtonElement {
        const downloadBtn = document.createElement('button');
        downloadBtn.type = 'button';
        downloadBtn.className = 'codeblock__download btn-icon btn-icon--standard ripple';
        downloadBtn.setAttribute('data-tooltip', LocaleManager.t('codeblock.download'));
        setAriaAttributes(downloadBtn, { 'aria-label': LocaleManager.t('codeblock.download') });
        const icon = document.createElement('i');
        icon.setAttribute('name', 'download');
        icon.setAttribute('type', 'classic');
        downloadBtn.appendChild(icon);
        return downloadBtn;
    }

    /**
     * Construit un codeblock multiple avec onglets (k3ui-tabs primary sans icône)
     */
    private buildMultipleStructure(panes: HTMLElement[]): void {
        const root = this.el;
        const card = document.createElement('div');
        card.className = 'codeblock__card tabs-container';
        card.setAttribute('data-variant', 'primary');
        this.cardEl = card;

        const labels = panes.map((p) => p.getAttribute('data-tab-label') || p.getAttribute('data-label') || '');
        const tabLabels = labels.some((l) => l) ? labels : panes.map((_, i) => `Tab ${i}`);

        if (this.options.showToolbar) {
            const toolbar = document.createElement('div');
            toolbar.className = 'codeblock__toolbar';
            this.toolbarEl = toolbar;

            const left = document.createElement('div');
            left.className = 'codeblock__toolbar-left';
            const tabsWrap = document.createElement('div');
            tabsWrap.className = 'codeblock__tabs';
            const tabs = document.createElement('div');
            tabs.className = 'tabs tabs--primary';
            tabs.setAttribute('data-variant', 'primary');
            const scroller = document.createElement('div');
            scroller.className = 'tabs__scroller';
            tabLabels.forEach((label, i) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'tabs__tab' + (i === 0 ? ' tabs__tab--active' : '');
                btn.setAttribute('data-tab-index', String(i));
                const iconName = panes[i]?.getAttribute('data-icon') || '';
                if (iconName) {
                    const iconEl = document.createElement('i');
                    iconEl.setAttribute('name', iconName);
                    iconEl.setAttribute('type', 'brand');
                    iconEl.setAttribute('size', 'sm');
                    btn.appendChild(iconEl);
                }
                const labelSpan = document.createElement('span');
                labelSpan.className = 'tabs__tab-label';
                labelSpan.textContent = label;
                btn.appendChild(labelSpan);
                scroller.appendChild(btn);
            });
            const indicator = document.createElement('div');
            indicator.className = 'tabs__indicator';
            indicator.setAttribute('aria-hidden', 'true');
            scroller.appendChild(indicator);
            tabs.appendChild(scroller);
            tabsWrap.appendChild(tabs);
            left.appendChild(tabsWrap);
            toolbar.appendChild(left);

            const actions = document.createElement('div');
            actions.className = 'codeblock__toolbar-actions';
            this.copyBtn = this.createCopyButton();
            actions.appendChild(this.copyBtn);
            this.downloadBtn = this.createDownloadButton();
            actions.appendChild(this.downloadBtn);
            toolbar.appendChild(actions);
            card.appendChild(toolbar);
        }

        const tabsItems = document.createElement('div');
        tabsItems.className = 'tabs-items';
        panes.forEach((pane, i) => {
            const item = document.createElement('div');
            item.className = 'tabs-item' + (i === 0 ? ' tabs-item--active' : '');
            item.setAttribute('data-tab-index', String(i));
            if (i !== 0) item.setAttribute('aria-hidden', 'true');
            item.hidden = i !== 0;
            const content = document.createElement('div');
            content.className = 'codeblock__content';
            const pre = pane.querySelector('pre') || document.createElement('pre');
            if (pre.parentNode) (pre.parentNode as HTMLElement).removeChild(pre);
            content.appendChild(pre);
            item.appendChild(content);
            tabsItems.appendChild(item);
        });
        card.appendChild(tabsItems);

        while (root.firstChild) root.removeChild(root.firstChild);
        root.appendChild(card);
        root.classList.add('codeblock--structured');
        root.classList.add('codeblock--multiple');

        // Fallback : colorer seulement les <code> "bruts" (sans tokens existants).
        this.applyHighlightFallback();
        if (this.toolbarEl) IconManager.processIconsInContainer(this.toolbarEl);
        this.initActionTooltips();
        // Le registre AutoInit est construit avant toute init : la card .tabs-container n'existe pas encore, donc Tabs n'est jamais appelé dessus. Init manuelle requise.
        Tabs.init(card);
        this.attachCopyHandler();
        this.attachDownloadHandler();
    }

    /**
     * Même chose à partir de plusieurs <pre> directs avec data-label
     */
    private buildMultipleStructureFromPres(pres: HTMLPreElement[]): void {
        const root = this.el;
        const panes = pres.map((pre) => {
            const pane = document.createElement('div');
            pane.className = 'codeblock__pane';
            const label = pre.getAttribute('data-label') || '';
            pane.setAttribute('data-tab-label', label);
            const icon = pre.getAttribute('data-icon') || '';
            if (icon) pane.setAttribute('data-icon', icon);
            pane.appendChild(pre);
            return pane;
        });
        root.innerHTML = '';
        panes.forEach((p) => root.appendChild(p));
        this.buildMultipleStructure(panes);
    }

    private attachCopyHandler(): void {
        if (!this.copyBtn) return;
        const getText = (): string => this.getActiveCodeEl()?.textContent ?? '';

        this.registerEvent(this.copyBtn, 'click', () => {
            const text = getText();
            if (!text) return;
            copyToClipboard(text)
                .then(() => {
                    if (this.copyBtn) {
                        this.copyBtn.setAttribute('data-copy-state', 'success');
                        setAriaAttributes(this.copyBtn, { 'aria-label': LocaleManager.t('codeblock.copySuccess') });
                    }
                    if (this.options.showToastOnCopy) {
                        Snackbar.show({
                            text: LocaleManager.t('codeblock.copySuccess'),
                            type: 'success',
                        });
                    }
                    if (this.copyTimeoutId) window.clearTimeout(this.copyTimeoutId);
                    this.copyTimeoutId = window.setTimeout(() => {
                        if (this.copyBtn) {
                            this.copyBtn.removeAttribute('data-copy-state');
                            setAriaAttributes(this.copyBtn, { 'aria-label': LocaleManager.t('codeblock.copy') });
                        }
                        this.copyTimeoutId = 0;
                    }, 2000);
                })
                .catch(() => {
                    if (this.copyBtn) {
                        this.copyBtn.setAttribute('data-copy-state', 'error');
                        setAriaAttributes(this.copyBtn, { 'aria-label': LocaleManager.t('codeblock.copyError') });
                    }
                    if (this.copyTimeoutId) window.clearTimeout(this.copyTimeoutId);
                    this.copyTimeoutId = window.setTimeout(() => {
                        if (this.copyBtn) {
                            this.copyBtn.removeAttribute('data-copy-state');
                            setAriaAttributes(this.copyBtn, { 'aria-label': LocaleManager.t('codeblock.copy') });
                        }
                        this.copyTimeoutId = 0;
                    }, 3000);
                });
        });
    }

    /**
     * Déclenche le téléchargement du code en fichier
     */
    private attachDownloadHandler(): void {
        if (!this.downloadBtn) return;
        const getText = (): string => this.getActiveCodeEl()?.textContent ?? '';
        const getLabel = (): string => {
            const codeEl = this.getActiveCodeEl();
            const pre = codeEl?.closest('.codeblock__content')?.querySelector('pre');
            return (
                this.options.label ||
                this.el.getAttribute('data-label') ||
                (pre?.getAttribute('data-label') ?? '') ||
                'code'
            );
        };
        const getExtension = (): string => {
            const code = this.getActiveCodeEl();
            if (!code) return 'txt';
            const lang = getLanguageFromElement(code);
            const ext: Record<string, string> = {
                html: 'html', javascript: 'js', typescript: 'ts', css: 'css',
                scss: 'scss', sass: 'sass', xml: 'xml', sql: 'sql', php: 'php',
                lua: 'lua', markdown: 'md', md: 'md',
            };
            return ext[lang] ?? 'txt';
        };

        this.registerEvent(this.downloadBtn, 'click', () => {
            const text = getText();
            if (!text) return;
            const label = getLabel().replace(/[^\w.-]+/g, '_') || 'code';
            const ext = getExtension();
            const filename = label.includes('.') ? label : `${label}.${ext}`;
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    private setupAccessibility(): void {
        setAriaAttributes(this.el, {
            role: 'region',
            'aria-label': LocaleManager.t('codeblock.ariaLabel'),
        });
    }

    /**
     * Sanitise le HTML produit par le highlighter avant injection via `innerHTML`.
     * Le highlighter échappe déjà le texte, mais cette étape constitue une défense en profondeur
     * en n'autorisant que les balises `<span class="...">` attendues.
     */
    private sanitizeHighlightOutput(html: string): string {
        return sanitizeHtmlFragment(html, HIGHLIGHT_ALLOWED_TAGS, HIGHLIGHT_ALLOWED_ATTRS);
    }

    /**
     * Coloration syntaxique intégrée (sans dépendance externe). En mode multiple, colore tous les blocs.
     */
    private runHighlight(): void {
        const codeEls = this.el.querySelectorAll('code');
        codeEls.forEach((codeEl) => {
            const raw = codeEl.textContent ?? '';
            if (!raw) return;
            const lang = getLanguageFromElement(codeEl);
            codeEl.innerHTML = this.sanitizeHighlightOutput(highlight(raw, lang));
        });
    }

    /**
     * Coloration "fallback" :
     * - ne touche pas aux blocs déjà pré-rendus (ex: tokens type Prism)
     * - tente highlight uniquement sur les <code> sans enfant HTML
     * - si highlight échoue, conserve le texte brut
     */
    private applyHighlightFallback(): void {
        const codeEls = this.el.querySelectorAll('code');
        codeEls.forEach((codeEl) => {
            // Déjà tokenisé / pré-rendu -> on ne modifie rien.
            if (codeEl.children.length > 0) return;

            const raw = codeEl.textContent ?? '';
            if (!raw) return;

            try {
                const lang = getLanguageFromElement(codeEl);
                codeEl.innerHTML = this.sanitizeHighlightOutput(highlight(raw, lang));
            } catch (_err) {
                codeEl.textContent = raw;
            }
        });
    }

    /**
     * Rend le contenu des balises <code> en mode robuste.
     * - `useSyntaxHighlight = false` : affichage texte pur (sans dépendance à highlight)
     * - `useSyntaxHighlight = true` : coloration syntaxique avec fallback texte
     */
    private renderCode(useSyntaxHighlight: boolean): void {
        const codeEls = this.el.querySelectorAll('code');
        codeEls.forEach((codeEl) => {
            const raw = codeEl.textContent ?? '';
            if (!raw) return;

            if (!useSyntaxHighlight) {
                // textContent garantit que le code reste visible et non interprété comme HTML.
                codeEl.textContent = raw;
                return;
            }

            try {
                const lang = getLanguageFromElement(codeEl);
                codeEl.innerHTML = this.sanitizeHighlightOutput(highlight(raw, lang));
            } catch (_err) {
                // Fallback silencieux : ne jamais casser le rendu du composant.
                codeEl.textContent = raw;
            }
        });
    }

    /**
     * Re-colore le bloc (utile après mise à jour du code)
     */
    public highlight(): void {
        this.renderCode(true);
    }

    public override destroy(): void {
        if (this.copyTimeoutId) window.clearTimeout(this.copyTimeoutId);
        this.logger.info('Component destroyed');
        super.destroy();
    }
}

/**
 * Custom Element <k3ui-codeblock>
 * @description Permet l'utilisation de <k3ui-codeblock> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-codeblock')) {
    customElements.define('k3ui-codeblock', class extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }
        disconnectedCallback(): void {
            const instance = CodeBlock.getInstance(this);
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        }
    });
}
