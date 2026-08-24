/**
 * K3UI Todo Component
 * Composant de liste de tâches basé sur Material Design 3
 *
 * @summary Liste de tâches Material Design 3
 * @element .todo
 *
 * @event add - Une tâche est ajoutée
 * @event remove - Une tâche est supprimée
 * @event toggle - Une tâche est cochée/décochée
 * @event edit - Une tâche est éditée
 * @event filter-change - Le filtre change
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { TodoOptions, TodoItem, TodoFilter } from '../types/components';
import { PriorityLevel } from '../types/base';
import { KElement, InitElements } from '../types/base';
import { LoggerManager, LocaleManager, PrivacyManager } from '../core/managers';
import { ManagerFactory } from '../core/factories/ManagerFactory';
import { setAriaAttribute, setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { getTodoDefaults } from '../specs/components/todo.specs';
import { Checkbox } from './Checkbox';
import { Keyboard, Mouse } from '../core/managers';
import { storage } from '../utils/storage/storage';
import { generateGuid } from '../utils/helpers/guid';

/**
 * Options par défaut du composant Todo
 * @description Extrait depuis les specs pour garantir la cohérence
 */
const _defaults: TodoOptions = getTodoDefaults();

/**
 * Classe Todo
 * Gère les listes de tâches avec toutes leurs fonctionnalités selon Material Design 3
 */
export class Todo extends Component<TodoOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private items: TodoItem[] = [];
    private currentFilter: TodoFilter = 'all';
    private logger: LoggerManager;
    private inputElement: HTMLInputElement | null = null;
    private addButtonElement: HTMLElement | null = null;
    private listElement: HTMLElement | null = null;
    private filterButtons: HTMLElement[] = [];
    private counterElement: HTMLElement | null = null;
    private clearCompletedButton: HTMLElement | null = null;
    private editingItemId: string | null = null;
    private editingInputElement: HTMLInputElement | null = null;
    private keyboardHandler: Keyboard | null = null;
    private mouseHandler: Mouse | null = null;

    /**
     * Constructeur
     * @param el - Élément DOM du Todo
     * @param options - Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<TodoOptions> = {}) {
        super(el, options, toComponentClassDef(Todo));

        this.logger = ManagerFactory.getLoggerManager('[Todo]');

        // Initialiser les options avec les valeurs par défaut
        this.options = {
            ...Todo.defaults,
            ...options
        };

        // Récupérer les attributs HTML si présents
        if (el.hasAttribute('data-filter')) {
            const filterValue = el.getAttribute('data-filter');
            if (filterValue === 'all' || filterValue === 'active' || filterValue === 'completed') {
                this.options.filter = filterValue;
            }
        }

        if (el.hasAttribute('data-persist')) {
            this.options.persistToStorage = el.getAttribute('data-persist') !== 'false';
        }

        if (el.hasAttribute('data-storage-key')) {
            this.options.storageKey = el.getAttribute('data-storage-key') || 'k3ui-todo';
        }

        if (el.hasAttribute('data-placeholder')) {
            this.options.placeholder = el.getAttribute('data-placeholder') || LocaleManager.t('todo.placeholder');
        }

        // Initialiser les données
        this.items = [...this.options.items];
        this.currentFilter = this.options.filter;

        // Charger depuis localStorage si activé
        if (this.options.persistToStorage) {
            this.loadFromStorage();
        }

        this.init();
    }

    static getInstance(el: HTMLElement): Todo | undefined {
        return Component.getInstance(el) as Todo | undefined;
    }

    static get defaults(): TodoOptions {
        return _defaults;
    }

    /**
     * Initialise une instance de Todo.
     * @param el Élément HTML.
     * @param options Options du composant.
     */
    static init(el: HTMLElement, options?: Partial<TodoOptions>): Todo;
    /**
     * Initialise des instances de Todo.
     * @param els Éléments HTML.
     * @param options Options du composant.
     */
    static init(els: InitElements<KElement>, options?: Partial<TodoOptions>): Todo[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<TodoOptions>
    ): Todo | Todo[] {
        if (els instanceof Element) {
            const existing = Todo.getInstance(els as HTMLElement);
            if (existing) {
                return existing;
            }
            return new Todo(els as HTMLElement, options);
        } else if (!!els && els.length) {
            const instances = [];
            for (let i = 0; i < els.length; i++) {
                const existing = Todo.getInstance(els[i] as HTMLElement);
                if (existing) {
                    instances.push(existing);
                } else {
                    instances.push(new Todo(els[i] as HTMLElement, options));
                }
            }
            return instances;
        }
        return [];
    }

    /**
     * Initialisation du composant
     */
    private init(): void {
        try {
            this.setupStructure();
            this.setupEventListeners();
            this.render();
            this.saveToStorage();
            this.logger.success('Todo initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Todo:', error);
        }
    }

    /**
     * Configuration de la structure HTML
     */
    private setupStructure(): void {
        // Ajouter la classe de base
        this.el.classList.add('todo');

        // Créer la structure
        this.createStructure();

        // Mettre à jour les attributs ARIA
        this.updateAriaAttributes();
    }

    /**
     * Création de la structure HTML
     */
    private createStructure(): void {
        // Créer le conteneur d'ajout
        const addContainer = document.createElement('div');
        addContainer.classList.add('todo__add');

        // Créer l'input
        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.inputElement.classList.add('todo__input');
        this.inputElement.placeholder = this.options.placeholder;
        setAriaAttribute(this.inputElement, 'label', LocaleManager.t('todo.ariaInputLabel'));
        setAriaAttribute(this.inputElement, 'role', 'textbox');

        // Créer le bouton d'ajout
        this.addButtonElement = document.createElement('button');
        this.addButtonElement.classList.add('todo__add-button', 'btn', 'btn--icon', 'btn--filled');
        (this.addButtonElement as HTMLButtonElement).type = 'button';
        const addIcon = document.createElement('i');
        addIcon.classList.add('k3ui-icon');
        addIcon.setAttribute('name', 'add');
        addIcon.setAttribute('type', 'classic');
        this.addButtonElement.appendChild(addIcon);
        setAriaAttribute(this.addButtonElement, 'label', LocaleManager.t('todo.ariaAddButtonLabel'));

        addContainer.appendChild(this.inputElement);
        addContainer.appendChild(this.addButtonElement);

        // Créer la liste
        this.listElement = document.createElement('ul');
        this.listElement.classList.add('todo__list');
        setAriaAttribute(this.listElement, 'role', 'list');
        setAriaAttribute(this.listElement, 'aria-label', LocaleManager.t('todo.ariaListLabel'));

        // Créer les filtres
        const filterContainer = document.createElement('div');
        filterContainer.classList.add('todo__filters');

        const filterLabels = [
            { key: 'all' as TodoFilter, label: LocaleManager.t('todo.filterAll') },
            { key: 'active' as TodoFilter, label: LocaleManager.t('todo.filterActive') },
            { key: 'completed' as TodoFilter, label: LocaleManager.t('todo.filterCompleted') }
        ];

        filterLabels.forEach(({ key, label }) => {
            const button = document.createElement('button');
            button.classList.add('todo__filter-button', 'chip');
            (button as HTMLButtonElement).type = 'button';
            button.textContent = label;
            button.setAttribute('data-filter', key);
            if (this.currentFilter === key) {
                button.classList.add('chip--active');
            }
            setAriaAttribute(button, 'role', 'tab');
            setAriaAttribute(button, 'aria-selected', this.currentFilter === key);
            this.filterButtons.push(button);
            filterContainer.appendChild(button);
        });

        // Créer le footer avec compteur et bouton clear
        const footer = document.createElement('div');
        footer.classList.add('todo__footer');

        if (this.options.showCounter) {
            this.counterElement = document.createElement('div');
            this.counterElement.classList.add('todo__counter');
            setAriaAttribute(this.counterElement, 'role', 'status');
            setAriaAttribute(this.counterElement, 'aria-live', 'polite');
            footer.appendChild(this.counterElement);
        }

        if (this.options.showClearCompleted) {
            this.clearCompletedButton = document.createElement('button');
            this.clearCompletedButton.classList.add('todo__clear-button', 'btn', 'btn--text');
            (this.clearCompletedButton as HTMLButtonElement).type = 'button';
            this.clearCompletedButton.textContent = LocaleManager.t('todo.clearCompletedText');
            setAriaAttribute(this.clearCompletedButton, 'label', LocaleManager.t('todo.ariaClearCompleted'));
            footer.appendChild(this.clearCompletedButton);
        }

        // Assembler dans le DOM
        this.el.appendChild(addContainer);
        this.el.appendChild(this.listElement);
        this.el.appendChild(filterContainer);
        if (footer.children.length > 0) {
            this.el.appendChild(footer);
        }

        // Forcer l'initialisation des icônes
        requestAnimationFrame(() => {
            const IconManager = ManagerFactory.getIconManager();
            if (IconManager) {
                const icons = this.el.querySelectorAll('.k3ui-icon');
                icons.forEach(icon => IconManager.updateIcon(icon as HTMLElement));
            }
        });
    }

    /**
     * Configuration des écouteurs d'événements
     */
    private setupEventListeners(): void {
        // Gestion de l'ajout
        if (this.inputElement) {
            this.inputElement.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleAdd();
                }
            });
        }

        if (this.addButtonElement) {
            this.addButtonElement.addEventListener('click', () => {
                this.handleAdd();
            });
        }

        // Gestion des filtres
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter') as TodoFilter;
                if (filter) {
                    this.setFilter(filter);
                }
            });
        });

        // Gestion du bouton clear completed
        if (this.clearCompletedButton) {
            this.clearCompletedButton.addEventListener('click', () => {
                this.clearCompleted();
            });
        }

        // Gestion clavier globale pour l'édition
        this.keyboardHandler = new Keyboard({
            target: this.el,
            onKeyDown: (event: KeyboardEvent, key: string) => {
                if (this.editingItemId && key === 'Escape') {
                    this.cancelEdit();
                } else if (this.editingItemId && key === 'Enter') {
                    this.saveEdit();
                }
            }
        });

        // Gestion souris pour le double-clic
        this.mouseHandler = new Mouse({
            target: this.listElement || this.el,
            onDoubleClick: (event: MouseEvent) => {
                if (this.options.allowEditOnDoubleClick) {
                    const itemElement = (event.target as HTMLElement).closest('.todo__item');
                    if (itemElement && !itemElement.classList.contains('todo__item--editing')) {
                        const itemId = itemElement.getAttribute('data-id');
                        if (itemId) {
                            this.startEdit(itemId);
                        }
                    }
                }
            }
        });
    }

    /**
     * Met la première lettre en majuscule
     */
    private capitalizeFirst(text: string): string {
        if (!text) return text;
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    /**
     * Gère l'ajout d'une tâche
     */
    private handleAdd(): void {
        if (!this.inputElement) return;

        const text = this.capitalizeFirst(this.inputElement.value.trim());
        if (!text) return;

        const now = new Date();
        const item: TodoItem = {
            id: generateGuid(),
            text,
            completed: false,
            createdAt: now,
            updatedAt: now
        };

        this.items.push(item);
        this.inputElement.value = '';
        this.render();
        this.saveToStorage();

        this.options.onAdd?.(item, this);
    }

    /**
     * Gère la suppression d'une tâche
     */
    private handleRemove(itemId: string): void {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        this.items = this.items.filter(i => i.id !== itemId);
        this.render();
        this.saveToStorage();

        this.options.onRemove?.(item, this);
        this.options.onDelete?.(item, this);
    }

    /**
     * Gère le toggle d'une tâche
     */
    private handleToggle(itemId: string): void {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        item.completed = !item.completed;
        this.render();
        this.saveToStorage();

        this.options.onToggle?.(item, this);
    }

    /**
     * Démarre l'édition d'une tâche
     */
    private startEdit(itemId: string): void {
        if (this.editingItemId) {
            this.cancelEdit();
        }

        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        this.editingItemId = itemId;
        const itemElement = this.listElement?.querySelector(`[data-id="${itemId}"]`);
        if (!itemElement) return;

        itemElement.classList.add('todo__item--editing');

        const textElement = itemElement.querySelector('.todo__item-text');
        if (!textElement) return;

        const text = textElement.textContent || '';
        textElement.innerHTML = '';

        this.editingInputElement = document.createElement('input');
        this.editingInputElement.type = 'text';
        this.editingInputElement.classList.add('todo__item-edit-input');
        this.editingInputElement.value = text;
        setAriaAttribute(this.editingInputElement, 'label', LocaleManager.t('todo.ariaEditLabel'));
        textElement.appendChild(this.editingInputElement);

        this.editingInputElement.focus();
        this.editingInputElement.select();

        this.editingInputElement.addEventListener('blur', () => {
            setTimeout(() => {
                if (this.editingItemId === itemId) {
                    this.saveEdit();
                }
            }, 200);
        });
    }

    /**
     * Sauvegarde l'édition
     */
    private saveEdit(): void {
        if (!this.editingItemId || !this.editingInputElement) return;

        const item = this.items.find(i => i.id === this.editingItemId);
        if (!item) return;

        const newText = this.capitalizeFirst(this.editingInputElement.value.trim());
        if (newText && newText !== item.text) {
            item.text = newText;
            this.options.onEdit?.(item, this);
        }

        this.cancelEdit();
        this.render();
        this.saveToStorage();
    }

    /**
     * Annule l'édition
     */
    private cancelEdit(): void {
        if (!this.editingItemId) return;

        const itemElement = this.listElement?.querySelector(`[data-id="${this.editingItemId}"]`);
        if (itemElement) {
            itemElement.classList.remove('todo__item--editing');
        }

        this.editingItemId = null;
        this.editingInputElement = null;
    }

    /**
     * Définit le filtre actif
     */
    setFilter(filter: TodoFilter): void {
        if (this.currentFilter === filter) return;

        this.currentFilter = filter;
        this.options.filter = filter;

        // Mettre à jour les boutons de filtre
        this.filterButtons.forEach(button => {
            const buttonFilter = button.getAttribute('data-filter') as TodoFilter;
            if (buttonFilter === filter) {
                button.classList.add('chip--active');
                setAriaAttribute(button, 'aria-selected', true);
            } else {
                button.classList.remove('chip--active');
                setAriaAttribute(button, 'aria-selected', false);
            }
        });

        this.render();
        this.options.onFilterChange?.(filter, this);
    }

    /**
     * Supprime toutes les tâches terminées
     */
    clearCompleted(): void {
        const completed = this.items.filter(i => i.completed);
        this.items = this.items.filter(i => !i.completed);
        this.render();
        this.saveToStorage();

        completed.forEach(item => {
            this.options.onRemove?.(item, this);
            this.options.onDelete?.(item, this);
        });
    }

    /**
     * Rend la liste des tâches
     */
    private render(): void {
        if (!this.listElement) return;

        // Filtrer les tâches
        const filteredItems = this.items.filter(item => {
            if (this.currentFilter === 'active') return !item.completed;
            if (this.currentFilter === 'completed') return item.completed;
            return true;
        });

        // Vider la liste
        this.listElement.innerHTML = '';

        // Créer les items
        filteredItems.forEach(item => {
            const itemElement = this.createItemElement(item);
            this.listElement!.appendChild(itemElement);
        });

        // Mettre à jour le compteur
        this.updateCounter();

        // Mettre à jour les attributs ARIA
        this.updateAriaAttributes();
    }

    /**
     * Crée un élément de tâche
     */
    private createItemElement(item: TodoItem): HTMLElement {
        const li = document.createElement('li');
        li.classList.add('todo__item');
        li.setAttribute('data-id', item.id);
        setAriaAttribute(li, 'role', 'listitem');

        if (item.completed) {
            li.classList.add('todo__item--completed');
        }

        // Créer le checkbox
        const checkboxContainer = document.createElement('div');
        checkboxContainer.classList.add('todo__item-checkbox');
        const checkboxEl = document.createElement('div');
        checkboxEl.classList.add('checkbox');
        if (item.completed) {
            checkboxEl.setAttribute('checked', '');
        }
        checkboxEl.setAttribute('data-label', item.text);
        checkboxEl.setAttribute('data-show-label', 'false');
        Checkbox.init(checkboxEl, {
            checked: item.completed,
            onToggle: () => {
                this.handleToggle(item.id);
            }
        });
        checkboxContainer.appendChild(checkboxEl);

        // Créer le texte
        const textElement = document.createElement('div');
        textElement.classList.add('todo__item-text');
        textElement.textContent = item.text;
        if (item.completed) {
            textElement.classList.add('todo__item-text--completed');
        }

        // Créer le bouton de suppression
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('todo__item-delete', 'btn', 'btn--icon', 'btn--text');
        (deleteButton as HTMLButtonElement).type = 'button';
        const deleteIcon = document.createElement('i');
        deleteIcon.classList.add('k3ui-icon');
        deleteIcon.setAttribute('name', 'trash');
        deleteIcon.setAttribute('type', 'classic');
        deleteButton.appendChild(deleteIcon);
        setAriaAttribute(deleteButton, 'label', LocaleManager.t('todo.ariaDeleteLabel'));
        deleteButton.addEventListener('click', () => {
            this.handleRemove(item.id);
        });

        // Créer le bouton d'édition
        const editButton = document.createElement('button');
        editButton.classList.add('todo__item-edit', 'btn', 'btn--icon', 'btn--text');
        (editButton as HTMLButtonElement).type = 'button';
        const editIcon = document.createElement('i');
        editIcon.classList.add('k3ui-icon');
        editIcon.setAttribute('name', 'edit');
        editIcon.setAttribute('type', 'classic');
        editButton.appendChild(editIcon);
        setAriaAttribute(editButton, 'label', LocaleManager.t('todo.ariaEditLabel'));
        editButton.addEventListener('click', () => {
            this.startEdit(item.id);
        });

        // Créer le conteneur des actions
        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('todo__item-actions');
        actionsContainer.appendChild(editButton);
        actionsContainer.appendChild(deleteButton);

        // Assembler
        li.appendChild(checkboxContainer);
        li.appendChild(textElement);
        li.appendChild(actionsContainer);

        // Forcer l'initialisation des icônes
        requestAnimationFrame(() => {
            const IconManager = ManagerFactory.getIconManager();
            if (IconManager) {
                const icons = li.querySelectorAll('.k3ui-icon');
                icons.forEach(icon => IconManager.updateIcon(icon as HTMLElement));
            }
        });

        return li;
    }

    /**
     * Met à jour le compteur de tâches
     */
    private updateCounter(): void {
        if (!this.counterElement) return;

        const activeCount = this.items.filter(i => !i.completed).length;
        const text = activeCount === 1
            ? LocaleManager.t('todo.taskRemainingOne')
            : LocaleManager.t('todo.tasksRemaining').replace('{count}', String(activeCount));
        this.counterElement.textContent = text;
        setAriaAttribute(this.counterElement, 'aria-label', text);
    }

    /**
     * Met à jour les attributs ARIA
     */
    private updateAriaAttributes(): void {
        if (!this.listElement) return;

        const visibleCount = this.listElement.children.length;
        const taskWord = visibleCount === 1 ? LocaleManager.t('todo.task') : LocaleManager.t('todo.tasks');
        const visibleWord = visibleCount === 1 ? LocaleManager.t('todo.visible') : LocaleManager.t('todo.visibles');
        setAriaAttribute(this.listElement, 'aria-label', `${LocaleManager.t('todo.ariaListLabel')}, ${visibleCount} ${taskWord} ${visibleWord}`);
    }

    /**
     * Charge les données depuis localStorage
     */
    private loadFromStorage(): void {
        try {
            const stored = storage.get<TodoItem[]>(this.options.storageKey);
            if (stored && Array.isArray(stored)) {
                this.items = stored;
            }
        } catch (error) {
            this.logger.warn('Failed to load from storage:', error);
        }
    }

    /**
     * Sauvegarde les données dans localStorage
     */
    private saveToStorage(): void {
        if (!this.options.persistToStorage) return;

        if (!PrivacyManager.canWrite(this.options.storageKey)) {
            this.logger.debug('Todo storage write skipped (privacy consent)');
            return;
        }

        try {
            storage.set(this.options.storageKey, this.items);
        } catch (error) {
            this.logger.warn('Failed to save to storage:', error);
        }
    }

    /**
     * Ajoute une tâche programmatiquement
     */
    addItem(text: string): TodoItem {
        const now = new Date();
        const item: TodoItem = {
            id: generateGuid(),
            text: this.capitalizeFirst((text || '').trim()),
            completed: false,
            createdAt: now,
            updatedAt: now
        };

        this.items.push(item);
        this.render();
        this.saveToStorage();

        this.options.onAdd?.(item, this);
        return item;
    }

    /**
     * Supprime une tâche programmatiquement
     */
    removeItem(itemId: string): boolean {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return false;

        this.items = this.items.filter(i => i.id !== itemId);
        this.render();
        this.saveToStorage();

        this.options.onRemove?.(item, this);
        this.options.onDelete?.(item, this);
        return true;
    }

    /**
     * Obtient toutes les tâches
     */
    getItems(): TodoItem[] {
        return [...this.items];
    }

    /**
     * Obtient les tâches filtrées
     */
    getFilteredItems(): TodoItem[] {
        if (this.currentFilter === 'active') return this.items.filter(i => !i.completed);
        if (this.currentFilter === 'completed') return this.items.filter(i => i.completed);
        return [...this.items];
    }

    /**
     * Obtient le filtre actif
     */
    getFilter(): TodoFilter {
        return this.currentFilter;
    }

    /**
     * Détruit l'instance du composant
     */
    destroy(): void {
        // Nettoyer les événements
        if (this.keyboardHandler) {
            this.keyboardHandler.destroy();
        }
        if (this.mouseHandler) {
            this.mouseHandler.destroy();
        }

        this.logger.success('Todo destroyed');
        super.destroy();
    }
}

// ============================================================================
// WEB COMPONENT REGISTRATION
// ============================================================================

/**
 * Enregistrement du Web Component k3ui-todo
 * @description Permet l'utilisation de <k3ui-todo> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-todo')) {
    customElements.define('k3ui-todo', class extends HTMLElement {
        connectedCallback() {
            // L'initialisation sera gérée par AutoInit
            // ou manuellement via K.Todo.init(this)
        }

        disconnectedCallback() {
            const instance = Todo.getInstance(this);
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        }

        static get observedAttributes() {
            return [
                'data-filter', 'data-persist', 'data-storage-key', 'data-placeholder'
            ];
        }

        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
            const instance = Todo.getInstance(this);
            if (instance && oldValue !== newValue) {
                // Mettre à jour l'instance si elle existe
                // Les mises à jour seront gérées par le composant
            }
        }
    });
}

