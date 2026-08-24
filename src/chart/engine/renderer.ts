/**
 * @fileoverview Moteur de rendu graphique interne K3UI
 * @description Abstraction du rendu — non exposée dans l'API publique
 */

import rendererCore from './register-modules';

/** Configuration de rendu produite par les presets K3UI */
export type ChartRenderConfig = Record<string, unknown>;

/**
 * Moteur de rendu graphique K3UI
 */
export class ChartRendererEngine {
    private instance: ReturnType<typeof rendererCore.init> | null = null;

    /**
     * Monte le moteur sur un conteneur DOM
     * @param container Élément hôte du rendu
     */
    mount(container: HTMLElement): void {
        const existing = rendererCore.getInstanceByDom(container);
        if (existing) {
            this.instance = existing;
            return;
        }

        this.instance = rendererCore.init(container, undefined, { renderer: 'canvas' });
    }

    /**
     * Applique une configuration de rendu
     * @param config Configuration produite par un preset
     */
    applyConfig(config: ChartRenderConfig): void {
        if (!this.instance) {
            return;
        }

        this.instance.setOption(config, { notMerge: true, lazyUpdate: false });
        this.instance.resize();
    }

    /**
     * Redimensionne le rendu selon le conteneur
     */
    resize(): void {
        this.instance?.resize();
    }

    /**
     * Libère les ressources du moteur
     */
    dispose(): void {
        if (this.instance) {
            this.instance.dispose();
            this.instance = null;
        }
    }

    /**
     * Exporte le graphique en image (data URL)
     * @param type Format d'image
     */
    toDataURL(type: 'png' | 'jpeg' = 'png'): string {
        if (!this.instance) {
            return '';
        }

        return this.instance.getDataURL({
            type,
            pixelRatio: 2,
            backgroundColor: 'transparent',
        });
    }
}
