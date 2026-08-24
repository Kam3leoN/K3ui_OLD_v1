/**
 * @fileoverview Composant Chart K3UI — graphiques interactifs Material You 3
 * @element k3ui-chart, div.chart
 */

import { Component } from '../core/base/Component';
import { toComponentClassDef } from '../types/components/component-base';
import type { ChartData, ChartOptions, ChartType } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { ManagerFactory } from '../core/factories';
import { setAriaAttribute, setAriaAttributes, removeAriaAttribute } from '../utils/dom/aria';
import { getChartDefaults } from '../specs/components/chart.specs';
import { debounce } from '../utils/helpers/performance';
import {
    buildAccessibilitySummary,
    buildAccessibilityTable,
    buildChartRenderConfig,
    ChartRendererEngine,
    isSupportedChartType,
    normalizeChartData,
    parseDataAttribute,
    prepareDataForType,
} from '../chart';

const _defaults: ChartOptions = getChartDefaults();

const CANVAS_CLASS = 'chart__canvas';
const A11Y_CLASS = 'chart__a11y';

/**
 * Composant Chart K3UI
 */
export class Chart extends Component<ChartOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private logger = ManagerFactory.getLoggerManager('[Chart]');
    private renderContainer: HTMLElement | null = null;
    private a11yRegion: HTMLElement | null = null;
    private renderer = new ChartRendererEngine();
    private chartData: ChartData = { labels: [], datasets: [{ data: [] }] };
    private resizeObserver: ResizeObserver | null = null;
    private debouncedResize: (() => void) | null = null;

    static get defaults(): ChartOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): Chart | undefined {
        return Component.getInstance(el) as Chart | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<ChartOptions> = {}
    ): Chart | Chart[] {
        return Component.init(els, options, toComponentClassDef(Chart)) as Chart | Chart[];
    }

    constructor(el: HTMLElement, options: Partial<ChartOptions> = {}) {
        super(el, options, toComponentClassDef(Chart));
        this.options = { ...Chart.defaults, ...options };
        this.readAttributes();
        this.chartData = normalizeChartData(this.options.data);
        this.setupDom();
        this.bindResize();
        requestAnimationFrame(() => {
            if (this.renderContainer?.isConnected) {
                this.render();
            }
        });
    }

    private readAttributes(): void {
        const { el } = this;
        const type = el.getAttribute('data-type');
        if (type && isSupportedChartType(type)) {
            this.options.type = type;
        }

        const dataRaw = el.getAttribute('data-data');
        const parsed = parseDataAttribute(dataRaw);
        if (parsed) {
            this.options.data = parsed;
        }

        const theme = el.getAttribute('data-theme-mode');
        if (theme === 'light' || theme === 'dark' || theme === 'auto') {
            this.options.theme = theme;
        }

        if (el.hasAttribute('data-show-grid')) {
            this.options.showGrid = el.getAttribute('data-show-grid') !== 'false';
        }
        if (el.hasAttribute('data-show-legend')) {
            this.options.showLegend = el.getAttribute('data-show-legend') !== 'false';
        }
        if (el.hasAttribute('data-show-labels')) {
            this.options.showLabels = el.getAttribute('data-show-labels') !== 'false';
        }
        if (el.hasAttribute('data-animation')) {
            this.options.animation = el.getAttribute('data-animation') !== 'false';
        }
        if (el.hasAttribute('data-show-accessibility-table')) {
            this.options.showAccessibilityTable = el.getAttribute('data-show-accessibility-table') === 'true';
        }
    }

    private setupDom(): void {
        this.el.classList.add('chart');

        let canvasHost = this.el.querySelector<HTMLElement>(`.${CANVAS_CLASS}`);
        if (!canvasHost) {
            canvasHost = document.createElement('div');
            canvasHost.className = CANVAS_CLASS;
            this.el.appendChild(canvasHost);
        }

        let a11y = this.el.querySelector<HTMLElement>(`.${A11Y_CLASS}`);
        if (!a11y) {
            a11y = document.createElement('div');
            a11y.className = A11Y_CLASS;
            a11y.setAttribute('aria-hidden', 'true');
            this.el.appendChild(a11y);
        }

        this.renderContainer = canvasHost;
        this.a11yRegion = a11y;
        this.updateAccessibility();
    }

    private bindResize(): void {
        this.debouncedResize = debounce(() => this.resize(), 100);

        if (typeof ResizeObserver !== 'undefined' && this.el) {
            this.resizeObserver = new ResizeObserver(() => {
                this.debouncedResize?.();
            });
            this.resizeObserver.observe(this.el);
        }

        this.registerEvent(window, 'resize', () => {
            this.debouncedResize?.();
        });
    }

    /**
     * Met à jour le type de graphique
     */
    setType(type: ChartType): void {
        this.options.type = type;
        this.render();
    }

    /**
     * Met à jour les données du graphique
     */
    setData(data: ChartData): void {
        this.chartData = normalizeChartData(data);
        this.options.data = this.chartData;
        this.render();
    }

    /**
     * Met à jour les options partielles
     */
    setOptions(partial: Partial<ChartOptions>): void {
        this.options = { ...this.options, ...partial };
        if (partial.data) {
            this.chartData = normalizeChartData(partial.data);
        }
        this.render();
    }

    /**
     * Rend le graphique
     */
    render(): void {
        if (!this.renderContainer) {
            return;
        }

        const prepared = prepareDataForType(
            this.options.type,
            this.chartData,
            this.options.clusterCount
        );

        this.renderer.mount(this.renderContainer);
        try {
            const config = buildChartRenderConfig(this.options, prepared, this.el);
            this.renderer.applyConfig(config);
        } catch (error) {
            this.logger.error('Erreur de rendu graphique', error);
        }
        this.updateAccessibility();
        this.options.onOpenEnd?.(this as unknown as HTMLElement);
    }

    /**
     * Redimensionne le graphique
     */
    resize(): void {
        this.renderer.resize();
    }

    /**
     * Exporte le graphique en image (data URL)
     */
    exportImage(format: 'png' | 'jpeg' = 'png'): string {
        return this.renderer.toDataURL(format);
    }

    private updateAccessibility(): void {
        if (!this.renderContainer || !this.a11yRegion) {
            return;
        }

        const label =
            this.options.accessibilityLabel ??
            buildAccessibilitySummary(this.options.type, this.chartData, this.options.accessibilitySummary);

        setAriaAttributes(this.renderContainer, {
            role: 'img',
            label,
        });

        if (this.options.accessibilityDescription) {
            const descId = `${CANVAS_CLASS}-desc-${this.el.id || 'chart'}`;
            let desc = this.a11yRegion.querySelector(`#${descId}`) as HTMLElement | null;
            if (!desc) {
                desc = document.createElement('p');
                desc.id = descId;
                this.a11yRegion.appendChild(desc);
            }
            desc.textContent = this.options.accessibilityDescription;
            setAriaAttribute(this.renderContainer, 'describedby', descId);
        } else {
            removeAriaAttribute(this.renderContainer, 'describedby');
        }

        if (this.options.showAccessibilityTable) {
            const existing = this.a11yRegion.querySelector('.chart__a11y-table');
            existing?.remove();
            this.a11yRegion.appendChild(buildAccessibilityTable(this.chartData));
        }
    }

    /**
     * Détruit l'instance du composant
     */
    destroy(): void {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        this.renderer.dispose();

        if (this.renderContainer) {
            removeAriaAttribute(this.renderContainer, 'role');
            removeAriaAttribute(this.renderContainer, 'label');
            removeAriaAttribute(this.renderContainer, 'describedby');
        }

        this.logger.info('Chart component destroyed');
        super.destroy();
    }
}

/**
 * Custom element k3ui-chart
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-chart')) {
    customElements.define(
        'k3ui-chart',
        class K3uiChartElement extends HTMLElement {
            connectedCallback(): void {
                if (!this.hasAttribute('data-initialized')) {
                    this.setAttribute('data-initialized', 'true');
                }
            }

            disconnectedCallback(): void {
                const instance = Chart.getInstance(this);
                instance?.destroy();
            }
        }
    );
}
