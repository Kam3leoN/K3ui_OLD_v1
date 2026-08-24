/**
 * @fileoverview Composant Heatmap pour K3UI
 * @description Grille type contribution (année, 7×~53, intensité par jour)
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import type { HeatmapOptions, HeatmapDataPoint } from '../types/components';
import { PriorityLevel, InitElements } from '../types/base';
import { setAriaAttributes } from '../utils/dom/aria';
import { ManagerFactory } from '../core/factories';
import { LocaleManager } from '../core/managers';
import { Tooltips } from './Tooltips';
import { getHeatmapDefaults } from '../specs/components/heatmap.specs';

const _defaults: HeatmapOptions = getHeatmapDefaults();

const SIZE_CELL: Record<'small' | 'medium' | 'large', { cellSize: number; cellGap: number }> = {
    small: { cellSize: 12, cellGap: 3 },
    medium: { cellSize: 14, cellGap: 3 },
    large: { cellSize: 16, cellGap: 3 },
};

/**
 * Retourne le premier jour de la première semaine qui touche l'année (dimanche ou lundi selon option)
 */
function getWeekStart(year: number, firstDayOfWeek: 0 | 1): Date {
    const jan1 = new Date(year, 0, 1);
    const d = new Date(jan1);
    const day = d.getDay();
    const offset = (day - firstDayOfWeek + 7) % 7;
    d.setDate(d.getDate() - offset);
    return d;
}

/**
 * Formate une chaîne YYYY-MM-DD pour l'affichage (tooltip)
 */
function formatDateLabel(isoDate: string): string {
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Construit une map date -> count à partir des données
 */
function buildDataMap(data: HeatmapDataPoint[]): Record<string, number> {
    const map: Record<string, number> = {};
    for (const p of data) {
        map[p.date] = (map[p.date] || 0) + p.count;
    }
    return map;
}

/**
 * Calcule le niveau d'intensité (0 à levels-1) pour une valeur
 */
function getLevel(count: number, maxCount: number, levels: number): number {
    if (count === 0) return 0;
    if (maxCount === 0) return 0;
    return Math.min(levels - 1, Math.ceil((count / maxCount) * (levels - 1)));
}

/**
 * Lit les options depuis les attributs data-* de l'élément
 */
function readDataOptions(el: HTMLElement): Partial<HeatmapOptions> {
    const o: Partial<HeatmapOptions> = {};
    if (el.dataset.year != null) o.year = parseInt(el.dataset.year, 10) || _defaults.year;
    if (el.dataset.cellSize != null) o.cellSize = parseInt(el.dataset.cellSize, 10) || _defaults.cellSize;
    if (el.dataset.cellGap != null) o.cellGap = parseInt(el.dataset.cellGap, 10) || _defaults.cellGap;
    if (el.dataset.levels != null) o.levels = Math.max(2, Math.min(5, parseInt(el.dataset.levels, 10) || _defaults.levels));
    if (el.dataset.firstDayOfWeek != null) o.firstDayOfWeek = el.dataset.firstDayOfWeek === '0' ? 0 : 1;
    if (el.dataset.showMonthLabels != null) o.showMonthLabels = el.dataset.showMonthLabels !== 'false';
    if (el.dataset.showWeekdayLabels != null) o.showWeekdayLabels = el.dataset.showWeekdayLabels !== 'false';
    if (el.dataset.size != null && ['small', 'medium', 'large'].includes(el.dataset.size)) {
        o.size = el.dataset.size as 'small' | 'medium' | 'large';
    }
    return o;
}

/**
 * Classe Heatmap pour K3UI
 */
export class Heatmap extends Component<HeatmapOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger = ManagerFactory.getLoggerManager('[Heatmap]');
    private gridRoot: HTMLElement | null = null;

    static get defaults(): HeatmapOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Heatmap | undefined {
        return Component.getInstance(el) as Heatmap | undefined;
    }

    static init(
        els: HTMLElement | InitElements<HTMLElement> | string,
        options: Partial<HeatmapOptions> = {}
    ): Heatmap | Heatmap[] {
        const resolved: HTMLElement | InitElements<HTMLElement> =
            typeof els === 'string' ? document.querySelectorAll<HTMLElement>(els) : els;
        return Component.init(resolved, options, toComponentClassDef(Heatmap)) as Heatmap | Heatmap[];
    }

    constructor(el: HTMLElement, options: Partial<HeatmapOptions> = {}) {
        super(el, options, toComponentClassDef(Heatmap));

        const dataOptions = readDataOptions(el);
        this.options = {
            ..._defaults,
            ...options,
            ...dataOptions,
        };
        const size = this.options.size;
        if (size === 'small' || size === 'medium' || size === 'large') {
            this.options.cellSize = SIZE_CELL[size].cellSize;
            this.options.cellGap = SIZE_CELL[size].cellGap;
        }
        this.init();
    }

    private init(): void {
        this.logger.info('Heatmap initializing');
        this.render();
        setAriaAttributes(this.el, {
            role: 'img',
            'aria-label': LocaleManager.t('heatmap.ariaLabel'),
        });
        this.logger.info('Heatmap initialized');
    }

    /**
     * Construit le DOM de la grille (labels mois, labels jours, cellules)
     */
    private render(): void {
        const { year, data, levels, firstDayOfWeek, showMonthLabels, showWeekdayLabels, cellSize, cellGap } = this.options;
        const dataMap = buildDataMap(data);
        const maxCount = data.length ? Math.max(...data.map((p) => p.count), 0) : 0;

        const weekStart = getWeekStart(year, firstDayOfWeek);
        const jan1 = new Date(year, 0, 1);
        const dec31 = new Date(year, 11, 31);

        const COLUMNS = 53;
        const ROWS = 7;

        const cells: { col: number; row: number; date: Date; iso: string; count: number; level: number }[] = [];
        let firstColByMonth: Record<number, number> = {};

        for (let col = 0; col < COLUMNS; col++) {
            for (let row = 0; row < ROWS; row++) {
                const d = new Date(weekStart);
                d.setDate(d.getDate() + col * 7 + row);
                if (d < jan1 || d > dec31) continue;
                const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const count = dataMap[iso] ?? 0;
                const level = getLevel(count, maxCount, levels);
                cells.push({ col, row, date: d, iso, count, level });
                const m = d.getMonth();
                if (firstColByMonth[m] === undefined) firstColByMonth[m] = col;
            }
        }

        this.el.innerHTML = '';
        this.el.classList.add('heatmap');

        const inner = document.createElement('div');
        inner.className = 'heatmap__inner';

        const gridWrap = document.createElement('div');
        gridWrap.className = 'heatmap__grid-wrap';
        gridWrap.style.setProperty('--heatmap-cell-size', `${cellSize}px`);
        gridWrap.style.setProperty('--heatmap-cell-gap', `${cellGap}px`);
        if (!showMonthLabels) {
            gridWrap.style.gridTemplateRows = `repeat(7, var(--heatmap-cell-size))`;
        }

        // Une seule grille CSS : ligne 1 = spacer + mois, lignes 2–8 = 7 jours + 7 lignes de cellules (alignement garanti)
        if (showMonthLabels) {
            const spacer = document.createElement('div');
            spacer.className = 'heatmap__weekdays-spacer';
            spacer.setAttribute('aria-hidden', 'true');
            spacer.style.gridRow = '1';
            spacer.style.gridColumn = '1';
            gridWrap.appendChild(spacer);
        }
        const dataRowStart = showMonthLabels ? 2 : 1;
        if (showWeekdayLabels) {
            const WEEKDAY_LABEL_ROWS = [1, 3, 5];
            for (let r = 0; r < ROWS; r++) {
                const span = document.createElement('span');
                span.className = 'heatmap__weekday';
                span.style.gridRow = String(dataRowStart + r);
                span.style.gridColumn = '1';
                if (WEEKDAY_LABEL_ROWS.includes(r)) {
                    span.textContent = LocaleManager.t(`datepicker.weekday${r}`) + '.';
                }
                gridWrap.appendChild(span);
            }
        }
        if (showMonthLabels) {
            const monthRow = document.createElement('div');
            monthRow.className = 'heatmap__months';
            monthRow.setAttribute('aria-hidden', 'true');
            monthRow.style.gridRow = '1';
            monthRow.style.gridColumn = '2';
            for (let m = 0; m < 12; m++) {
                const col = firstColByMonth[m];
                if (col === undefined) continue;
                const span = document.createElement('span');
                span.className = 'heatmap__month';
                span.textContent = LocaleManager.t(`datepicker.month${m}`).slice(0, 3) + '.';
                span.style.gridColumnStart = String(col + 1);
                monthRow.appendChild(span);
            }
            gridWrap.appendChild(monthRow);
        }

        const grid = document.createElement('div');
        grid.className = 'heatmap__grid';
        grid.style.setProperty('--heatmap-cell-size', `${cellSize}px`);
        grid.style.setProperty('--heatmap-cell-gap', `${cellGap}px`);
        grid.style.gridTemplateColumns = `repeat(${COLUMNS}, var(--heatmap-cell-size))`;
        grid.style.gridTemplateRows = `repeat(${ROWS}, var(--heatmap-cell-size))`;

        const cellByKey = new Map<string, { count: number; level: number; iso: string }>();
        for (const c of cells) {
            cellByKey.set(`${c.col}-${c.row}`, { count: c.count, level: c.level, iso: c.iso });
        }

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLUMNS; col++) {
                const key = `${col}-${row}`;
                const info = cellByKey.get(key);
                const cell = document.createElement('div');
                cell.className = 'heatmap__cell';
                if (info) {
                    cell.classList.add(`heatmap__cell--level-${info.level}`);
                    const label = info.count === 0
                        ? `${formatDateLabel(info.iso)} – ${LocaleManager.t('heatmap.noActivity')}`
                        : LocaleManager.t('heatmap.tooltipCount')
                            .replace('{date}', formatDateLabel(info.iso))
                            .replace('{count}', String(info.count));
                    cell.setAttribute('data-tooltip', label);
                } else {
                    cell.classList.add('heatmap__cell--empty');
                }
                grid.appendChild(cell);
            }
        }

        grid.style.gridRow = `${dataRowStart} / span 7`;
        grid.style.gridColumn = '2';
        gridWrap.appendChild(grid);
        inner.appendChild(gridWrap);
        this.el.appendChild(inner);
        this.gridRoot = grid;

        // Initialiser les tooltips K3UI sur les cellules (créées dynamiquement)
        const cellsWithTooltip = grid.querySelectorAll<HTMLElement>('.heatmap__cell[data-tooltip]');
        if (cellsWithTooltip.length > 0 && typeof Tooltips !== 'undefined') {
            Tooltips.init(cellsWithTooltip);
        }
    }

    /**
     * Met à jour les données et rafraîchit la grille
     */
    setData(data: HeatmapDataPoint[]): void {
        this.options.data = data;
        this.render();
    }

    /**
     * Met à jour l'année affichée
     */
    setYear(year: number): void {
        this.options.year = year;
        this.render();
    }

    /**
     * Détruit l'instance du composant
     */
    public override destroy(): void {
        this.gridRoot = null;
        this.logger.info('Heatmap destroyed');
        super.destroy();
    }
}

/**
 * Custom Element <k3ui-heatmap>
 * @description Permet l'utilisation de <k3ui-heatmap> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-heatmap')) {
    customElements.define('k3ui-heatmap', class extends HTMLElement {
        connectedCallback(): void {
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }
        disconnectedCallback(): void {
            const instance = Heatmap.getInstance(this);
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        }
    });
}
