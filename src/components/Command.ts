/**
 * @fileoverview Composant Command K3UI - Palette de commandes Material Design 3 You Expressive
 * @description Palette de commandes type Command Palette / Spotlight conforme MD3
 * @see https://m3.material.io/components/dialogs/overview
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { InitElements, KElement } from '../types/base';
import type { CommandOptions, CommandItem, CommandGroupDefinition, DialogOptions, ListOptions } from '../types/components';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { getCommandDefaults } from '../specs/components/command.specs';
import { setAriaAttributes } from '../utils/dom/aria';
import { LocaleManager, IconManager } from '../core/managers';
import { Field } from './Field';
import { List } from './List';
import { Dialog } from './Dialog';

const _defaults: CommandOptions = getCommandDefaults();

/** Résultat de recherche avec score et highlights */
interface SearchResult {
    command: CommandItem;
    score: number;
    highlights: { name?: string; desc?: string };
}

export class Command extends Component<CommandOptions> {
    /** Si la palette est ouverte */
    isOpen: boolean = false;

    private _dialogInstance!: InstanceType<typeof Dialog>;
    private _dialogEl!: HTMLElement;
    private _surface!: HTMLDivElement;
    private _input!: HTMLInputElement;
    private _fieldInstance!: InstanceType<typeof Field>;
    private _resultsEl!: HTMLDivElement;
    private _listEl: HTMLElement | null = null;
    private _listInstance: InstanceType<typeof List> | null = null;
    private _listWrapper: HTMLDivElement | null = null;
    /** En mode grouped : une liste par section (titre h6 + list), pour sync sélection / scroll */
    private _sectionListRefs: { listEl: HTMLElement; instance: InstanceType<typeof List>; startIndex: number }[] = [];
    private _emptyEl: HTMLDivElement | null = null;
    private _clearBtn!: HTMLButtonElement;
    private _countEl!: HTMLSpanElement;
    private _query: string = '';
    private _activeIndex: number = 0;
    private _results: SearchResult[] = [];
    private _boundKeydown: (e: KeyboardEvent) => void;
    private _previousActiveElement: HTMLElement | null = null;
    private _id: string;

    constructor(el: HTMLElement, options: Partial<CommandOptions> = {}) {
        super(el, options, toComponentClassDef(Command));

        this.options = { ...Command.defaults, ...options };
        this._id = this.el.id || `command-${Date.now()}`;
        this._boundKeydown = this._onKeyDown.bind(this);

        this._buildDOM();
        this._setupAccessibility();
        this._bindTrigger();
        this._bindShortcut();
        this._bindInput();

        ManagerFactory.getLoggerManager('Command').info('Command initialisé', this.el);
    }

    static getInstance(el: HTMLElement): Command | undefined {
        return Component.getInstance(el) as Command | undefined;
    }

    static get defaults(): CommandOptions {
        return _defaults;
    }

    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<CommandOptions>
    ): Command | Command[] {
        if (els instanceof HTMLElement) {
            return new Command(els, options);
        }
        if (els && (els as NodeListOf<HTMLElement>).length) {
            const list = els as NodeListOf<HTMLElement>;
            return Array.from(list).map((el) => new Command(el, options));
        }
        return [];
    }

    /**
     * Ouvre la palette (via Dialog)
     */
    open(trigger?: HTMLElement): void {
        if (this.isOpen) return;
        this._previousActiveElement = document.activeElement as HTMLElement | null;
        this.options.onOpenStart?.(this.el);
        this._computeResults();
        this._renderResults();
        this.isOpen = true;
        this._dialogInstance.open(trigger);
        requestAnimationFrame(() => {
            this._input.focus();
            this._input.select();
            this.options.onOpenEnd?.(this.el);
        });
    }

    /**
     * Ferme la palette (fermeture du Dialog)
     */
    close(): void {
        if (!this.isOpen) return;
        this.options.onCloseStart?.(this.el);
        this.isOpen = false;
        this._activeIndex = 0;
        this._dialogInstance.close();
        if (this._previousActiveElement && typeof this._previousActiveElement.focus === 'function') {
            this._previousActiveElement.focus();
        }
        this.options.onCloseEnd?.(this.el);
    }

    /**
     * Met à jour la liste des commandes
     */
    setCommands(commands: CommandItem[]): void {
        this.options.commands = commands;
        this._computeResults();
        this._renderResults();
    }

    private _buildDOM(): void {
        const dialogEl = document.createElement('div');
        dialogEl.className = `dialog command-palette-dialog command__container--${this.options.size || 'default'}`;
        dialogEl.id = `${this._id}-dialog`;
        dialogEl.setAttribute('aria-label', LocaleManager.t('command.ariaLabel'));
        dialogEl.innerHTML = '<div class="dialog-container"><div class="dialog-header"></div><div class="dialog-content"></div><div class="dialog-footer"></div></div>';
        const dialogHeader = dialogEl.querySelector('.dialog-header') as HTMLDivElement;
        const dialogContent = dialogEl.querySelector('.dialog-content') as HTMLDivElement;
        const dialogFooter = dialogEl.querySelector('.dialog-footer') as HTMLDivElement;

        const search = document.createElement('div');
        search.className = 'command__search';
        search.setAttribute('role', 'search');

        const fieldEl = document.createElement('k3ui-field');
        fieldEl.className = 'no-autoinit command__search-field';
        fieldEl.setAttribute('type', 'text');
        fieldEl.setAttribute('variant', 'outlined');
        fieldEl.setAttribute('placeholder', LocaleManager.t('command.searchPlaceholder'));
        fieldEl.setAttribute('autocomplete', 'off');
        fieldEl.setAttribute('leading-icon', 'search');
        fieldEl.setAttribute('aria-label', LocaleManager.t('command.ariaLabel'));

        const fieldInstance = Field.init(fieldEl) as InstanceType<typeof Field>;
        const input = fieldInstance.inputElement as HTMLInputElement;
        input.classList.add('command__search-input');
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-expanded', 'true');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-controls', `${this._id}-results`);
        input.setAttribute('aria-activedescendant', '');

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'command__search-clear';
        clearBtn.setAttribute('aria-label', LocaleManager.t('command.ariaClearSearch'));
        clearBtn.setAttribute('tabindex', '-1');
        const clearIcon = document.createElement('i');
        clearIcon.className = 'k3ui-icon';
        clearIcon.setAttribute('name', 'close');
        clearIcon.setAttribute('size', 'lg');
        clearIcon.setAttribute('aria-hidden', 'true');
        clearBtn.appendChild(clearIcon);

        search.appendChild(fieldEl);
        search.appendChild(clearBtn);

        const results = document.createElement('div');
        results.id = `${this._id}-results`;
        results.className = 'command__results';
        results.setAttribute('role', 'listbox');
        results.setAttribute('aria-label', LocaleManager.t('command.ariaLabel'));
        results.setAttribute('aria-live', 'polite');

        const emptyEl = document.createElement('div');
        emptyEl.className = 'command__empty';
        emptyEl.setAttribute('role', 'status');
        emptyEl.style.display = 'none';

        const listWrapper = document.createElement('div');
        listWrapper.className = 'command__results-list';
        listWrapper.style.display = 'none';
        const listEl = document.createElement('div');
        listEl.className = 'list no-autoinit';
        listEl.setAttribute('aria-label', LocaleManager.t('command.ariaLabel'));
        listWrapper.appendChild(listEl);
        results.appendChild(emptyEl);
        results.appendChild(listWrapper);

        const footer = document.createElement('div');
        footer.className = 'command__footer';
        footer.setAttribute('aria-hidden', 'true');
        footer.innerHTML = `
          <div class="command__footer-hint"><kbd>↑↓</kbd> ${LocaleManager.t('command.footerNavigate')}</div>
          <div class="command__footer-hint"><kbd>↵</kbd> ${LocaleManager.t('command.footerRun')}</div>
          <div class="command__footer-hint"><kbd>Esc</kbd> ${LocaleManager.t('command.footerClose')}</div>
          <div class="command__footer-spacer"></div>
          <div class="command__footer-count" id="${this._id}-count"></div>
        `;

        dialogHeader.appendChild(search);
        dialogContent.appendChild(results);
        dialogFooter.appendChild(footer);

        document.body.appendChild(dialogEl);
        dialogEl.style.display = 'none';

        this._dialogEl = dialogEl;
        this._surface = dialogEl.querySelector('.dialog-container') as HTMLDivElement;
        this._fieldInstance = fieldInstance;
        this._input = input;
        this._resultsEl = results;
        this._emptyEl = emptyEl;
        this._listWrapper = listWrapper;
        this._listEl = listEl;
        this._clearBtn = clearBtn;
        this._countEl = dialogFooter.querySelector('.command__footer-count') as HTMLSpanElement;

        const dialogInstance = new Dialog(dialogEl, {
            dismissible: true,
            onCloseStart: () => {
                this.isOpen = false;
                this._activeIndex = 0;
                this.options.onCloseEnd?.(this.el);
            },
        } satisfies Partial<DialogOptions>);
        this._dialogInstance = dialogInstance;

        requestAnimationFrame(() => {
            if (this.isDestroyed || !this._surface) return;
            IconManager.processIconsInContainer(this._surface);
            IconManager.forceDisplayIcons?.();
        });
    }

    private _setupAccessibility(): void {
        setAriaAttributes(this._dialogEl, {
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': LocaleManager.t('command.ariaLabel'),
            'aria-haspopup': 'listbox',
        });
    }

    private _bindTrigger(): void {
        const sel = this.options.triggerSelector;
        if (!sel) return;
        const trigger = document.querySelector(sel) as HTMLElement | null;
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                this.open();
            });
        }
    }

    private _parseShortcut(): { mod: 'ctrl' | 'meta'; alt: boolean; shift: boolean; key: string } {
        const raw = (this.options.shortcutKey || 'ctrl+k').toLowerCase();
        const isMac = typeof navigator !== 'undefined' && /mac|darwin/i.test(navigator.platform);
        let remaining = raw;
        let mod: 'ctrl' | 'meta' = 'ctrl';

        if (remaining.startsWith('meta+')) {
            mod = 'meta';
            remaining = remaining.slice(5);
        } else if (remaining.startsWith('ctrl+')) {
            mod = isMac ? 'meta' : 'ctrl';
            remaining = remaining.slice(5);
        }

        let alt = false;
        let shift = false;
        while (remaining.startsWith('alt+') || remaining.startsWith('shift+')) {
            if (remaining.startsWith('alt+')) {
                alt = true;
                remaining = remaining.slice(4);
            } else {
                shift = true;
                remaining = remaining.slice(6);
            }
        }

        return { mod, alt, shift, key: remaining };
    }

    private _bindShortcut(): void {
        document.addEventListener('keydown', this._boundKeydown);
    }

    private _matchesShortcut(e: KeyboardEvent): boolean {
        const { mod, alt, shift, key } = this._parseShortcut();
        const isMod = mod === 'meta' ? e.metaKey : e.ctrlKey;
        return isMod && e.altKey === alt && e.shiftKey === shift && e.key.toLowerCase() === key;
    }

    private _onKeyDown(e: KeyboardEvent): void {
        if (this._matchesShortcut(e)) {
            e.preventDefault();
            if (this.isOpen) this.close();
            else this.open();
            return;
        }
        if (!this.isOpen) return;
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this._activeIndex = Math.min(this._activeIndex + 1, this._results.length - 1);
                this._renderResults();
                this._scrollActiveIntoView();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this._activeIndex = Math.max(this._activeIndex - 1, 0);
                this._renderResults();
                this._scrollActiveIntoView();
                break;
            case 'Enter':
                e.preventDefault();
                if (this._results.length > 0) this._runCommand(this._activeIndex);
                break;
            case 'Tab':
                e.preventDefault();
                if (e.shiftKey) {
                    this._activeIndex = Math.max(this._activeIndex - 1, 0);
                } else {
                    this._activeIndex = Math.min(this._activeIndex + 1, this._results.length - 1);
                }
                this._renderResults();
                this._scrollActiveIntoView();
                break;
        }
    }

    private _bindInput(): void {
        this._input.addEventListener('input', () => {
            this._query = this._input.value;
            this._activeIndex = 0;
            this._computeResults();
            this._renderResults();
            this._updateClearButton();
            this._updateSearchIcon();
        });
        this._clearBtn.addEventListener('click', () => {
            this._input.value = '';
            this._query = '';
            this._activeIndex = 0;
            this._computeResults();
            this._renderResults();
            this._updateClearButton();
            this._updateSearchIcon();
            this._input.focus();
        });
    }

    private _updateClearButton(): void {
        if (this._query.length > 0) this._clearBtn.classList.add('command__search-clear--visible');
        else this._clearBtn.classList.remove('command__search-clear--visible');
    }

    private _updateSearchIcon(): void {
        const icon = this._surface.querySelector('.command__search-field .leading-icon, .command__search-field i.k3ui-icon') as HTMLElement;
        if (!icon) return;
        const name = this._query.length > 0 ? 'search-plus' : 'search';
        if (icon.getAttribute('name') !== name) {
            icon.setAttribute('name', name);
            IconManager.updateIcon(icon);
        }
        this._surface.querySelector('.command__search-field')?.classList.toggle('command__search-icon--active', this._query.length > 0);
    }

    /** Normalise le nom d’icône : uniquement tirets (k3ui-icons), pas d’underscore. */
    private _normalizeIconName(name: string): string {
        return String(name || '').replace(/_/g, '-').trim() || 'circle';
    }

    /** Titre de section : première lettre en majuscule, reste en minuscules. */
    private _sectionTitleCase(label: string): string {
        const s = String(label || '').trim();
        if (!s) return s;
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    }

    private _fuzzySearch(query: string, commands: CommandItem[]): SearchResult[] {
        if (!query.trim()) {
            return commands.map((c) => ({ command: c, score: 0, highlights: {} }));
        }
        const q = query.toLowerCase();
        return commands
            .map((cmd) => {
                const name = cmd.name.toLowerCase();
                const desc = (cmd.description || '').toLowerCase();
                let score = 0;
                const highlights: SearchResult['highlights'] = {};
                if (name.startsWith(q)) {
                    score = 100;
                    highlights.name = 'prefix';
                } else if (name.includes(q)) {
                    score = 80;
                    highlights.name = 'contains';
                } else {
                    let pos = 0;
                    let matches = 0;
                    for (const ch of q) {
                        const found = name.indexOf(ch, pos);
                        if (found === -1) break;
                        pos = found + 1;
                        matches++;
                    }
                    if (matches === q.length) {
                        score = 40 + (matches / name.length) * 30;
                        highlights.name = 'fuzzy';
                    } else if (desc.includes(q)) {
                        score = 30;
                        highlights.desc = 'contains';
                    }
                }
                return { command: cmd, score, highlights };
            })
            .filter((r) => r.score > 0)
            .sort((a, b) => b.score - a.score);
    }

    private _escapeHtml(str: string): string {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    private _highlightText(text: string, query: string, type?: string): string {
        if (!query || !type) return this._escapeHtml(text);
        const q = query.toLowerCase();
        const t = text.toLowerCase();
        if (type === 'prefix' || type === 'contains') {
            const idx = t.indexOf(q);
            if (idx === -1) return this._escapeHtml(text);
            return (
                this._escapeHtml(text.slice(0, idx)) +
                `<span class="command__item-highlight">${this._escapeHtml(text.slice(idx, idx + q.length))}</span>` +
                this._escapeHtml(text.slice(idx + q.length))
            );
        }
        let result = '';
        let pos = 0;
        for (const ch of q) {
            const found = t.indexOf(ch, pos);
            if (found === -1) break;
            result += this._escapeHtml(text.slice(pos, found));
            result += `<span class="command__item-highlight">${this._escapeHtml(text[found])}</span>`;
            pos = found + 1;
        }
        result += this._escapeHtml(text.slice(pos));
        return result;
    }

    private _computeResults(): void {
        this._results = this._fuzzySearch(this._query, this.options.commands);
        if (this._activeIndex >= this._results.length) this._activeIndex = 0;
    }

    private _getOrderedResultsForRender(): SearchResult[] {
        if (!this.options.showGroups || this._query.trim()) return this._results;
        const groupOrder = this.options.groupOrder?.length ? this.options.groupOrder : [];
        const grouped = new Map<string, SearchResult[]>();
        for (const r of this._results) {
            const g = r.command.group;
            if (!grouped.has(g)) grouped.set(g, []);
            grouped.get(g)!.push(r);
        }
        const out: SearchResult[] = [];
        for (const gid of groupOrder) {
            const items = grouped.get(gid);
            if (items) out.push(...items);
        }
        for (const [gid, items] of grouped) {
            if (!groupOrder.includes(gid)) out.push(...items);
        }
        return out;
    }

    private _renderResults(): void {
        const { showIcons, showDescriptions, showShortcuts, showGroups, groups, groupOrder } = this.options;
        const ordered = this._getOrderedResultsForRender();

        if (ordered.length === 0) {
            if (this._emptyEl) {
                this._emptyEl.innerHTML = `
                  <i class="k3ui-icon" name="times-circle" size="lg" aria-hidden="true"></i>
                  <p>${LocaleManager.t('command.noResults')}${this._query ? ` "${this._escapeHtml(this._query)}"` : ''}</p>`;
                this._emptyEl.style.display = '';
                IconManager.processIconsInContainer(this._emptyEl);
                IconManager.forceDisplayIcons?.();
            }
            if (this._listWrapper) this._listWrapper.style.display = 'none';
            this._countEl.textContent = `0 / ${this.options.commands.length}`;
            this._input.setAttribute('aria-activedescendant', '');
            return;
        }

        this._countEl.textContent = `${ordered.length} / ${this.options.commands.length}`;
        if (this._emptyEl) this._emptyEl.style.display = 'none';
        if (this._listWrapper) this._listWrapper.style.display = '';

        const useGroups = showGroups && !this._query.trim();
        const listOptionsBase: Partial<ListOptions> = {
            config: {
                variant: 'segmented',
                leading: 'icon',
                lines: '2',
                trailing: 'badge',
                selection: 'single',
                grouped: true,
                overline: false,
                withSwitches: false,
                expandCollapse: false,
                accordion: false,
                drag: false,
                swipe: false,
            },
            selectedId: null,
            onSelect: (item, _index, _listInstance) => {
                const ordered = this._getOrderedResultsForRender();
                const idx = ordered.findIndex((r) => String(r.command.id) === String(item.id ?? ''));
                if (idx >= 0) this._runCommand(idx);
            },
        };

        const toListItems = (results: SearchResult[]): ListOptions['items'] =>
            results.map((r) => ({
                id: r.command.id,
                primaryText: r.command.name,
                headline: r.command.name,
                sub1: (showDescriptions !== false && r.command.description) ? r.command.description : undefined,
                icon: (showIcons !== false) ? this._normalizeIconName(r.command.icon || 'circle') : undefined,
                badge: (showShortcuts && r.command.shortcut) ? r.command.shortcut : undefined,
            }));

        if (useGroups) {
            const orderedGroupIds = groupOrder?.length ? groupOrder : [...new Set(ordered.map((r) => r.command.group))];
            const groups: { groupId: string; label: string; results: SearchResult[] }[] = [];
            let i = 0;
            while (i < ordered.length) {
                const g = ordered[i].command.group;
                const groupDef = this.options.groups?.[g] as (CommandGroupDefinition & { label?: string }) | undefined;
                const label = groupDef?.label ?? g;
                const results: SearchResult[] = [];
                while (i < ordered.length && ordered[i].command.group === g) {
                    results.push(ordered[i]);
                    i++;
                }
                groups.push({ groupId: g, label, results });
            }

            if (!this._listWrapper) return;
            this._listWrapper.innerHTML = '';
            this._sectionListRefs = [];
            this._listEl = null;
            this._listInstance = null;

            let startIndex = 0;
            for (const grp of groups) {
                const section = document.createElement('section');
                section.className = 'command__section';
                const title = document.createElement('div');
                title.className = 'command__section-title title-large';
                title.setAttribute('role', 'heading');
                title.setAttribute('aria-level', '6');
                title.textContent = this._sectionTitleCase(grp.label);
                section.appendChild(title);
                const listContainer = document.createElement('div');
                listContainer.className = 'command__section-list';
                const listEl = document.createElement('div');
                listEl.className = 'list no-autoinit';
                listEl.setAttribute('aria-label', LocaleManager.t('command.ariaLabel'));
                listContainer.appendChild(listEl);
                section.appendChild(listContainer);
                this._listWrapper.appendChild(section);

                const groupItems = toListItems(grp.results);
                const listOptions = { ...listOptionsBase, items: groupItems };
                const inst = List.init(listEl, listOptions) as InstanceType<typeof List> | InstanceType<typeof List>[];
                const instance = Array.isArray(inst) ? inst[0] : inst;
                this._sectionListRefs.push({ listEl, instance, startIndex });
                startIndex += grp.results.length;

                requestAnimationFrame(() => {
                    IconManager.processIconsInContainer(listEl);
                    IconManager.forceDisplayIcons?.();
                });
            }

            const activeResult = ordered[this._activeIndex];
            const activeId = activeResult ? activeResult.command.id : null;
            for (const ref of this._sectionListRefs) {
                const end = ref.startIndex + ref.instance.getItems().length;
                if (this._activeIndex >= ref.startIndex && this._activeIndex < end) {
                    ref.instance.setSelectedId(activeId ?? null);
                    break;
                }
            }
        } else {
            const listItems = toListItems(ordered);
            if (!this._listWrapper) return;
            this._listWrapper.innerHTML = '';
            this._sectionListRefs = [];
            const listEl = document.createElement('div');
            listEl.className = 'list no-autoinit';
            listEl.setAttribute('aria-label', LocaleManager.t('command.ariaLabel'));
            this._listWrapper.appendChild(listEl);
            this._listEl = listEl;
            const listOptions = { ...listOptionsBase, items: listItems };
            const inst = List.init(listEl, listOptions) as InstanceType<typeof List> | InstanceType<typeof List>[];
            this._listInstance = Array.isArray(inst) ? inst[0] : inst;
            const activeResult = ordered[this._activeIndex];
            const activeId = activeResult ? activeResult.command.id : null;
            this._listInstance.setSelectedId(activeId ?? null);
            requestAnimationFrame(() => {
                IconManager.processIconsInContainer(listEl);
                IconManager.forceDisplayIcons?.();
            });
        }

        this._scrollActiveIntoView();
        const activeIdForAria = ordered[this._activeIndex]?.command.id;
        this._input.setAttribute(
            'aria-activedescendant',
            activeIdForAria != null ? `command-item-${this._id}-${activeIdForAria}` : ''
        );
    }

    private _renderItem(
        result: SearchResult,
        index: number,
        showIcons: boolean,
        showDescs: boolean,
        showShortcuts: boolean
    ): string {
        const { command, highlights } = result;
        const isActive = index === this._activeIndex;
        const nameHtml = this._highlightText(command.name, this._query, highlights.name);
        const iconHtml =
            showIcons &&
            `<div class="command__item-icon" aria-hidden="true">
        <i class="k3ui-icon" name="${this._escapeHtml(this._normalizeIconName(command.icon || 'circle'))}" size="lg"></i>
      </div>`;
        const descHtml =
            showDescs &&
            command.description &&
            `<div class="command__item-desc">${this._escapeHtml(command.description)}</div>`;
        const shortcutHtml =
            showShortcuts &&
            command.shortcut &&
            `<div class="command__shortcut" aria-label="Shortcut ${this._escapeHtml(command.shortcut)}">
        ${command.shortcut
                .split(' ')
                .map((k) => `<kbd>${this._escapeHtml(k)}</kbd>`)
                .join('')}
      </div>`;
        return `
    <div class="command__item${isActive ? ' command__item--active' : ''}"
         role="option"
         id="command-item-${this._id}-${index}"
         data-index="${index}"
         data-cmd-id="${this._escapeHtml(command.id)}"
         aria-selected="${isActive}"
         aria-label="${this._escapeHtml(command.name)}${command.description ? ': ' + this._escapeHtml(command.description) : ''}">
      ${iconHtml || ''}
      <div class="command__item-text">
        <div class="command__item-name">${nameHtml}</div>
        ${descHtml || ''}
      </div>
      <div class="command__item-right">${shortcutHtml || ''}</div>
    </div>`;
    }

    private _scrollActiveIntoView(): void {
        const ordered = this._getOrderedResultsForRender();
        const activeResult = ordered[this._activeIndex];
        if (!activeResult) return;
        const activeId = String(activeResult.command.id);
        const container = this._listEl ?? this._listWrapper;
        const row = container?.querySelector(`[data-item-id="${CSS.escape(activeId)}"]`);
        if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    private _runCommand(index: number): void {
        const ordered = this._getOrderedResultsForRender();
        const result = ordered[index];
        if (!result) return;
        const cmd = result.command;
        try {
            cmd.action?.();
        } catch (_) { }
        this.options.onCommandSelect?.(cmd);
        this.close();
    }

    override destroy(): void {
        document.removeEventListener('keydown', this._boundKeydown);
        if (this._dialogInstance && typeof this._dialogInstance.destroy === 'function') {
            this._dialogInstance.destroy();
        }
        this._dialogEl?.remove();
        ManagerFactory.getLoggerManager('Command').info('Command détruit', this.el);
        super.destroy();
    }
}
