/**
 * @fileoverview Composant Table pour K3UI
 * @description Composant de table de données selon Material Design 3 Expressive
 * @author Kam3leon
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { TableOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { getK3uiGlobal } from '../types/global/k3ui-window';
import { setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { LoggerManager, IconManager, LocaleManager } from '../core/managers';
import { ManagerFactory } from '../core/factories';
import { getTableDefaults } from '../specs/components/table.specs';
import { Field } from './Field';

interface KTableHTMLElement extends HTMLElement {
    K_Table?: Table;
}

/**
 * Valeurs par défaut pour les options
 */
const _defaults: TableOptions = getTableDefaults();

/**
 * Classe Table pour K3UI
 */
export class Table extends Component<TableOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    /** Logger pour le composant */
    private logger: LoggerManager;

    /** État de tri actuel */
    private sortState: { column: number | null; direction: 'asc' | 'desc' | null } = {
        column: null,
        direction: null
    };

    /** Lignes sélectionnées */
    private selectedRows: Set<number> = new Set();

    /** État de recherche */
    private searchTerm: string = '';

    /** État de pagination */
    private currentPage: number = 1;

    /** Toutes les lignes originales (non filtrées) */
    private allRows: HTMLTableRowElement[] = [];

    /** Lignes filtrées actuellement affichées */
    private filteredRows: HTMLTableRowElement[] = [];

    /** Délégation clic/keydown sur tbody (une seule paire d'écouteurs) */
    private _rowSelectionDelegationActive = false;

    private _onSelectableTbodyClick = (e: Event): void => {
        if (!this.options.selectable) return;
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const row = target.closest('tbody tr') as HTMLTableRowElement | null;
        if (!row || !this.el.contains(row)) return;
        if (target.closest('button, a')) return;
        const tbody = row.parentElement;
        if (!tbody) return;
        const index = Array.from(tbody.children).indexOf(row);
        if (index < 0) return;
        this.toggleRowSelection(index, row);
    };

    private _onSelectableTbodyKeydown = (e: Event): void => {
        if (!this.options.selectable) return;
        const ke = e as KeyboardEvent;
        if (ke.key !== 'Enter' && ke.key !== ' ') return;
        const target = ke.target as HTMLElement | null;
        if (!target) return;
        const row = target.closest('tbody tr') as HTMLTableRowElement | null;
        if (!row || !this.el.contains(row)) return;
        ke.preventDefault();
        const tbody = row.parentElement;
        if (!tbody) return;
        const index = Array.from(tbody.children).indexOf(row);
        if (index < 0) return;
        this.toggleRowSelection(index, row);
    };

    /**
     * Options par défaut du composant
     * @returns Les options par défaut
     */
    static get defaults(): TableOptions {
        return { ..._defaults };
    }

    /**
     * Obtient l'instance du composant pour un élément donné
     * @param el Élément HTML
     * @returns L'instance Table
     */
    static getInstance(el: HTMLElement): Table {
        return (el as KTableHTMLElement).K_Table!;
    }

    /**
     * Initialise les composants
     * @param els Éléments HTML ou sélecteur CSS
     * @param options Options de configuration
     * @returns Tableau des instances créées
     */
    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<TableOptions> = {}
    ): Table[] {
        return Component.init(els, options, toComponentClassDef(Table)) as Table[];
    }

    /**
     * Constructeur du composant
     * @param el Élément HTML
     * @param options Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<TableOptions> = {}) {
        super(el, options, toComponentClassDef(Table));

        this.logger = ManagerFactory.getLoggerManager('[Table]');

        // Initialiser les options
        this.options = {
            ...Table.defaults,
            ...options
        };

        // Stocker l'instance sur l'élément
        (el as KTableHTMLElement).K_Table = this;

        // Initialiser le composant
        this.init();
    }

    /**
     * Initialise le composant
     * @private
     */
    private init(): void {
        this.setupAriaAttributes();
        this.storeOriginalRows();
        this.setupSearch();
        this.setupPagination();
        this.setupSortableHeaders();
        this.setupSelectableRows();
        this.setupEventListeners();
        this.logger.info('Table initialized');
    }

    /**
     * Configure les attributs ARIA
     * @private
     */
    private setupAriaAttributes(): void {
        setAriaAttributes(this.el, {
            role: 'table',
            'aria-label': this.options.ariaLabel ?? LocaleManager.t('table.defaultAriaLabel')
        });
    }

    /**
     * Configure les en-têtes triables
     * @private
     */
    private setupSortableHeaders(): void {
        if (!this.options.sortable) return;

        const thead = this.el.querySelector('thead');
        if (!thead) return;

        const headerRow = thead.querySelector('tr');
        if (!headerRow) return;

        // Obtenir tous les headers (triables et non-triables) pour calculer l'index correct
        const allHeaders = Array.from(headerRow.querySelectorAll('th'));
        const sortableHeaders = this.el.querySelectorAll<HTMLElement>('th.table__header--sortable');

        sortableHeaders.forEach((header) => {
            // Calculer l'index réel de la colonne dans la table
            const columnIndex = allHeaders.indexOf(header as HTMLTableCellElement);
            if (columnIndex === -1) return;

            header.setAttribute('tabindex', '0');
            header.setAttribute('role', 'button');
            header.setAttribute('aria-sort', 'none');

            // Créer l'icône de tri si elle n'existe pas
            let iconElement = header.querySelector<HTMLElement>('.table__sort-icon');
            if (!iconElement) {
                iconElement = document.createElement('i');
                iconElement.className = 'table__sort-icon k3ui-icon';
                // Définir l'icône "sort" par défaut pour toutes les colonnes triables
                iconElement.setAttribute('name', 'sort');
                // Insérer l'icône après le texte du header
                const textNode = Array.from(header.childNodes).find(
                    (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
                );
                if (textNode) {
                    header.insertBefore(iconElement, textNode.nextSibling);
                } else {
                    header.appendChild(iconElement);
                }
            } else {
                // Si l'icône existe déjà, s'assurer qu'elle a l'attribut "sort" par défaut
                if (!iconElement.hasAttribute('name')) {
                    iconElement.setAttribute('name', 'sort');
                }
            }

            header.addEventListener('click', () => this.handleSort(columnIndex, header));
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleSort(columnIndex, header);
                }
            });
        });

        // Forcer le chargement des icônes
        setTimeout(() => {
            getK3uiGlobal()?.IconManager?.forceDisplayIcons();
        }, 100);
    }

    /**
     * Gère le tri d'une colonne
     * @param columnIndex Index de la colonne
     * @param header Élément en-tête
     * @private
     */
    private handleSort(columnIndex: number, header: HTMLElement): void {
        const tbody = this.el.querySelector('tbody');
        if (!tbody) return;

        // Utiliser les lignes filtrées si la recherche est active, sinon toutes les lignes
        const rowsToSort = this.searchTerm || this.options.pagination
            ? Array.from(tbody.querySelectorAll('tr'))
            : this.allRows.length > 0
                ? [...this.allRows]
                : Array.from(tbody.querySelectorAll('tr'));

        if (rowsToSort.length === 0) return;

        // Déterminer la direction de tri
        let direction: 'asc' | 'desc' = 'asc';
        // Si c'est la même colonne, alterner entre asc et desc
        if (this.sortState.column === columnIndex && this.sortState.direction !== null) {
            // Alterner : si actuellement 'asc', passer à 'desc', sinon passer à 'asc'
            direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // Nouvelle colonne ou première fois, commencer par asc
            direction = 'asc';
        }

        // Réinitialiser les attributs ARIA de tous les en-têtes
        const allHeaders = this.el.querySelectorAll<HTMLElement>('th.table__header--sortable');
        allHeaders.forEach((h) => {
            h.setAttribute('aria-sort', 'none');
            const icon = h.querySelector<HTMLElement>('.table__sort-icon');
            if (icon) {
                icon.classList.remove('table__sort-icon--active', 'table__sort-icon--asc', 'table__sort-icon--desc');
                // Remettre l'icône "sort" neutre pour toutes les colonnes non-triées
                icon.setAttribute('name', 'sort');
                // Forcer la mise à jour de l'icône
                getK3uiGlobal()?.IconManager?.updateIcon(icon);
            }
        });

        // Mettre à jour l'état de tri
        this.sortState.column = columnIndex;
        this.sortState.direction = direction;

        // Mettre à jour l'en-tête actif
        header.setAttribute('aria-sort', direction);
        const icon = header.querySelector<HTMLElement>('.table__sort-icon');
        if (icon) {
            icon.classList.add('table__sort-icon--active', `table__sort-icon--${direction}`);
            // Changer l'icône selon la direction
            icon.setAttribute('name', direction === 'asc' ? 'sort-up' : 'sort-down');

            // Forcer la mise à jour de l'icône
            getK3uiGlobal()?.IconManager?.updateIcon(icon);
        }

        // Trier les lignes
        const sortedRows = rowsToSort.sort((a, b) => {
            const aCell = a.cells[columnIndex];
            const bCell = b.cells[columnIndex];
            if (!aCell || !bCell) return 0;

            const aText = aCell.textContent?.trim() || '';
            const bText = bCell.textContent?.trim() || '';

            // Essayer de détecter et trier les dates (format YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(aText) && dateRegex.test(bText)) {
                const aDate = new Date(aText).getTime();
                const bDate = new Date(bText).getTime();
                return direction === 'asc' ? aDate - bDate : bDate - aDate;
            }

            // Essayer de détecter et trier les montants (format avec €, espaces, virgules)
            const amountRegex = /^[\d\s,]+(?:\.\d+)?\s*€?$/;
            if (amountRegex.test(aText) && amountRegex.test(bText)) {
                // Nettoyer le texte pour extraire le nombre
                const aClean = aText.replace(/[\s€,]/g, '').replace(',', '.');
                const bClean = bText.replace(/[\s€,]/g, '').replace(',', '.');
                const aNum = parseFloat(aClean);
                const bNum = parseFloat(bClean);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return direction === 'asc' ? aNum - bNum : bNum - aNum;
                }
            }

            // Essayer de comparer numériquement (nombres simples)
            const aNum = parseFloat(aText.replace(/\s/g, '').replace(',', '.'));
            const bNum = parseFloat(bText.replace(/\s/g, '').replace(',', '.'));
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return direction === 'asc' ? aNum - bNum : bNum - aNum;
            }

            // Comparaison textuelle (par défaut)
            return direction === 'asc'
                ? aText.localeCompare(bText, undefined, { numeric: true, sensitivity: 'base' })
                : bText.localeCompare(aText, undefined, { numeric: true, sensitivity: 'base' });
        });

        // Réorganiser les lignes sans innerHTML (moins de parse / une seule passe de layout)
        this.clearSelection();
        sortedRows.forEach((row) => {
            tbody.appendChild(row);
        });

        this.setupSelectableRows();

        // Appeler le callback
        if (this.options.onSort) {
            const column = this.options.columns?.[columnIndex];
            this.options.onSort(column || columnIndex, direction, this);
        }

        this.logger.info(`Table sorted by column ${columnIndex} (${direction})`);
    }

    /**
     * Écouteurs délégués sur tbody + attributs ARIA sur chaque ligne
     * @private
     */
    private setupSelectableRows(): void {
        if (!this.options.selectable) return;

        const tbody = this.el.querySelector('tbody');
        if (!tbody) return;

        if (!this._rowSelectionDelegationActive) {
            this.registerEvent(tbody, 'click', this._onSelectableTbodyClick as EventListener);
            this.registerEvent(tbody, 'keydown', this._onSelectableTbodyKeydown as EventListener);
            this._rowSelectionDelegationActive = true;
        }

        const rows = tbody.querySelectorAll<HTMLElement>('tr');
        rows.forEach((row, index) => {
            row.setAttribute('role', 'row');
            row.setAttribute('tabindex', '0');
            row.setAttribute('aria-selected', this.selectedRows.has(index) ? 'true' : 'false');
            if (this.selectedRows.has(index)) {
                row.classList.add('table__row--selected');
            } else {
                row.classList.remove('table__row--selected');
            }
        });
    }

    /**
     * Bascule la sélection d'une ligne
     * @param index Index de la ligne
     * @param row Élément ligne
     * @private
     */
    private toggleRowSelection(index: number, row: HTMLElement): void {
        const isSelected = this.selectedRows.has(index);

        if (isSelected) {
            this.selectedRows.delete(index);
            row.classList.remove('table__row--selected');
            row.setAttribute('aria-selected', 'false');
        } else {
            if (!this.options.multiSelect) {
                // Désélectionner toutes les autres lignes
                this.selectedRows.forEach((selectedIndex) => {
                    const selectedRow = this.el.querySelectorAll('tbody tr')[selectedIndex] as HTMLElement;
                    if (selectedRow) {
                        selectedRow.classList.remove('table__row--selected');
                        selectedRow.setAttribute('aria-selected', 'false');
                    }
                });
                this.selectedRows.clear();
            }
            this.selectedRows.add(index);
            row.classList.add('table__row--selected');
            row.setAttribute('aria-selected', 'true');
        }

        // Appeler le callback
        if (this.options.onRowSelect) {
            const selectedIndices = Array.from(this.selectedRows);
            this.options.onRowSelect(selectedIndices, index, !isSelected);
        }

        this.logger.info(`Row ${index} ${isSelected ? 'deselected' : 'selected'}`);
    }

    /**
     * Configure les écouteurs d'événements
     * @private
     */
    private setupEventListeners(): void {
        // Gestion des actions de ligne
        const actionButtons = this.el.querySelectorAll<HTMLElement>('.table__action-icon');
        actionButtons.forEach((button) => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = button.closest('tr');
                if (row && this.options.onRowAction) {
                    const rowIndex = Array.from(row.parentElement?.children || []).indexOf(row);
                    this.options.onRowAction(rowIndex, button);
                }
            });
        });
    }

    /**
     * Obtient les lignes sélectionnées
     * @returns Tableau des indices des lignes sélectionnées
     */
    getSelectedRows(): number[] {
        return Array.from(this.selectedRows);
    }

    /**
     * Sélectionne une ligne
     * @param index Index de la ligne
     */
    selectRow(index: number): void {
        const rows = this.el.querySelectorAll<HTMLElement>('tbody tr');
        if (rows[index]) {
            this.toggleRowSelection(index, rows[index]);
        }
    }

    /**
     * Désélectionne toutes les lignes
     */
    clearSelection(): void {
        this.selectedRows.forEach((index) => {
            const row = this.el.querySelectorAll<HTMLElement>('tbody tr')[index];
            if (row) {
                row.classList.remove('table__row--selected');
                row.setAttribute('aria-selected', 'false');
            }
        });
        this.selectedRows.clear();
    }

    /**
     * Stocke les lignes originales
     * @private
     */
    private storeOriginalRows(): void {
        const tbody = this.el.querySelector('tbody');
        if (!tbody) return;
        this.allRows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>('tr'));
        this.filteredRows = [...this.allRows];
    }

    /**
     * Configure la recherche
     * @private
     */
    private setupSearch(): void {
        if (!this.options.searchable) return;

        // Vérifier si un conteneur de recherche existe déjà
        const existingContainer = this.el.parentElement?.querySelector('.table__search-container');
        if (existingContainer) {
            // Si le conteneur existe déjà, réutiliser le Field existant
            const existingField = existingContainer.querySelector('k3ui-field') as HTMLElement | null;
            if (existingField) {
                const fieldInstance = Field.getInstance(existingField);
                if (fieldInstance?.inputElement) {
                    // Réattacher l'écouteur d'événements
                    fieldInstance.inputElement.addEventListener('input', (e) => {
                        const target = e.target as HTMLInputElement;
                        this.searchTerm = target.value.trim().toLowerCase();
                        this.applyFilters();
                    });
                }
            }
            return;
        }

        // Créer le conteneur de recherche
        const searchContainer = document.createElement('div');
        searchContainer.className = 'table__search-container';

        // Créer un élément Field K3UI pour la recherche
        const fieldElement = document.createElement('k3ui-field');
        fieldElement.className = 'no-autoinit'; // Empêcher l'AutoInit de l'initialiser
        fieldElement.setAttribute('type', 'text');
        fieldElement.setAttribute('variant', 'outlined');
        fieldElement.setAttribute(
            'placeholder',
            this.options.searchPlaceholder ?? LocaleManager.t('table.searchPlaceholder')
        );
        fieldElement.setAttribute('leading-icon', 'magnifying-glass');
        fieldElement.setAttribute('aria-label', LocaleManager.t('table.searchAriaLabel'));

        searchContainer.appendChild(fieldElement);

        // Insérer avant la table
        this.el.parentElement?.insertBefore(searchContainer, this.el);

        // Initialiser le Field
        const fieldInstance = Field.init(fieldElement);

        // Écouter les changements sur l'input du Field
        if (fieldInstance.inputElement) {
            fieldInstance.inputElement.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                this.searchTerm = target.value.trim().toLowerCase();
                this.applyFilters();
            });
        }
    }

    /**
     * Configure la pagination
     * @private
     */
    private setupPagination(): void {
        if (!this.options.pagination) return;

        // Créer le conteneur de pagination
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'table__pagination-container';
        paginationContainer.setAttribute('role', 'navigation');
        paginationContainer.setAttribute('aria-label', LocaleManager.t('table.paginationNavAriaLabel'));

        // Insérer après la table
        this.el.parentElement?.insertBefore(paginationContainer, this.el.nextSibling);

        this.updatePagination();
    }

    /**
     * Applique les filtres (recherche + pagination)
     * @private
     */
    private applyFilters(): void {
        const tbody = this.el.querySelector('tbody');
        if (!tbody) return;

        // Filtrer par recherche
        if (this.searchTerm) {
            this.filteredRows = this.allRows.filter((row) => {
                const cells = Array.from(row.querySelectorAll('td, th'));
                return cells.some((cell) => {
                    const text = cell.textContent?.trim().toLowerCase() || '';
                    return text.includes(this.searchTerm);
                });
            });
        } else {
            this.filteredRows = [...this.allRows];
        }

        // Appeler le callback de recherche
        if (this.options.onSearch) {
            this.options.onSearch(this.searchTerm, this.filteredRows.length);
        }

        // Réinitialiser à la page 1 après recherche
        this.currentPage = 1;

        // Appliquer la pagination
        this.updateDisplayedRows();
        this.updatePagination();
    }

    /**
     * Met à jour les lignes affichées selon la pagination
     * @private
     */
    private updateDisplayedRows(): void {
        const tbody = this.el.querySelector('tbody');
        if (!tbody) return;

        this.clearSelection();

        const frag = document.createDocumentFragment();

        if (!this.options.pagination) {
            this.filteredRows.forEach((row) => {
                frag.appendChild(row.cloneNode(true) as HTMLTableRowElement);
            });
            tbody.replaceChildren(frag);
            this.setupSelectableRows();
            return;
        }

        const pageSize = this.options.itemsPerPage ?? 10;
        const startIndex = (this.currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const rowsToShow = this.filteredRows.slice(startIndex, endIndex);

        rowsToShow.forEach((row) => {
            frag.appendChild(row.cloneNode(true) as HTMLTableRowElement);
        });
        tbody.replaceChildren(frag);

        this.setupSelectableRows();
    }

    /**
     * Met à jour l'interface de pagination
     * @private
     */
    private updatePagination(): void {
        if (!this.options.pagination) return;

        const paginationContainer = this.el.parentElement?.querySelector('.table__pagination-container');
        if (!paginationContainer) return;

        const pageSize = this.options.itemsPerPage ?? 10;
        const totalPages = Math.ceil(this.filteredRows.length / pageSize) || 1;
        const startItem = this.filteredRows.length === 0 ? 0 : (this.currentPage - 1) * pageSize + 1;
        const endItem = Math.min(this.currentPage * pageSize, this.filteredRows.length);

        const rangeText = LocaleManager.t('table.resultsRange')
            .replace('{start}', String(startItem))
            .replace('{end}', String(endItem))
            .replace('{total}', String(this.filteredRows.length));
        const pageText = LocaleManager.t('table.pageOfTotal')
            .replace('{current}', String(this.currentPage))
            .replace('{total}', String(totalPages));

        paginationContainer.innerHTML = `
            <div class="table__pagination-info">
                <span>${rangeText}</span>
            </div>
            <div class="table__pagination-controls">
                <button 
                    class="btn btn--text table__pagination-btn" 
                    data-page="prev"
                    ${this.currentPage === 1 ? 'disabled' : ''}
                    aria-label="${LocaleManager.t('pagination.ariaPrevious')}">
                    <i class="k3ui-icon table__pagination-icon--prev" name="chevron"></i>
                </button>
                <span class="table__pagination-page">${pageText}</span>
                <button 
                    class="btn btn--text table__pagination-btn" 
                    data-page="next"
                    ${this.currentPage === totalPages ? 'disabled' : ''}
                    aria-label="${LocaleManager.t('pagination.ariaNext')}">
                    <i class="k3ui-icon table__pagination-icon--next" name="chevron"></i>
                </button>
            </div>
        `;

        // Ajouter les écouteurs d'événements
        const prevBtn = paginationContainer.querySelector('[data-page="prev"]');
        const nextBtn = paginationContainer.querySelector('[data-page="next"]');

        prevBtn?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.updateDisplayedRows();
                this.updatePagination();
                if (this.options.onPageChange) {
                    this.options.onPageChange(this.currentPage, totalPages);
                }
            }
        });

        nextBtn?.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.updateDisplayedRows();
                this.updatePagination();
                if (this.options.onPageChange) {
                    this.options.onPageChange(this.currentPage, totalPages);
                }
            }
        });

        // Forcer le chargement des icônes
        setTimeout(() => {
            getK3uiGlobal()?.IconManager?.forceDisplayIcons();
        }, 100);
    }

    /**
     * Détruit l'instance du composant
     */
    public override destroy(): void {
        // Nettoyer les éléments de recherche et pagination
        const searchContainer = this.el.parentElement?.querySelector('.table__search-container');
        if (searchContainer) {
            searchContainer.remove();
        }

        const paginationContainer = this.el.parentElement?.querySelector('.table__pagination-container');
        if (paginationContainer) {
            paginationContainer.remove();
        }

        // Nettoyage
        if ((this.el as KTableHTMLElement).K_Table === this) {
            delete (this.el as KTableHTMLElement).K_Table;
        }
        this.selectedRows.clear();
        this.allRows = [];
        this.filteredRows = [];
        this._rowSelectionDelegationActive = false;
        this.logger.info('Table destroyed');
        super.destroy();
    }
}



/**
 * Enregistrement du Web Component k3ui-table
 * @description Permet l'utilisation de <k3ui-table> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-table')) {
    customElements.define('k3ui-table', class extends HTMLElement {
        private tableInstance: Table | null = null;

        connectedCallback() {
            // L'initialisation sera geree par AutoInit
            // ou manuellement via K.Table.init(this)
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback() {
            // Nettoyage lors de la suppression du DOM
            if (this.tableInstance) {
                this.tableInstance.destroy();
                this.tableInstance = null;
            }
        }
    });
}
