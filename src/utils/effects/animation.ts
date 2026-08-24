/**
 * @fileoverview Gestionnaire d'animation avec requestAnimationFrame
 * @description Utilitaire pour gérer les animations de manière propre et réutilisable
 * @author K3UI Team
 * @version 1.0.0
 */

/**
 * Gestionnaire d'animation avec requestAnimationFrame
 * @description Permet de gérer les animations de manière propre avec cleanup automatique
 * @example
 * ```typescript
 * const animator = new AnimationManager();
 * animator.start((timestamp) => {
 *   // Code d'animation
 *   if (progress < 1) {
 *     animator.continue();
 *   }
 * });
 * ```
 */
export class AnimationManager {
    /** ID de la frame d'animation en cours */
    private frameId: number | null = null;

    /** Indique si une animation est en cours */
    private isRunning: boolean = false;

    /** Compteur d'animation pour identifier les animations actives */
    private animationId: number = 0;

    /** Callback d'animation actuel */
    private animationCallback: ((timestamp: number) => void) | null = null;

    /**
     * Lance une animation
     * @param callback - Fonction appelée à chaque frame avec le timestamp
     * @returns ID unique de l'animation (pour vérification)
     */
    public start(callback: (timestamp: number) => void): number {
        // Arrêter l'animation précédente si elle existe
        this.stop();

        // Incrémenter le compteur pour invalider les anciennes animations
        this.animationId++;
        const currentAnimationId = this.animationId;

        // Stocker le callback
        this.animationCallback = callback;

        // Marquer comme en cours
        this.isRunning = true;

        // Fonction d'animation interne
        const animate = (timestamp: number): void => {
            // Vérifier que cette animation est toujours valide
            if (currentAnimationId !== this.animationId) {
                return; // Une nouvelle animation a été lancée, arrêter celle-ci
            }

            // Appeler le callback
            if (this.animationCallback) {
                this.animationCallback(timestamp);
            }

            // Vérifier à nouveau avant de planifier la prochaine frame
            if (currentAnimationId === this.animationId && this.isRunning) {
                this.frameId = requestAnimationFrame(animate);
            } else {
                this.frameId = null;
                this.isRunning = false;
            }
        };

        // Lancer l'animation
        this.frameId = requestAnimationFrame(animate);

        return currentAnimationId;
    }

    /**
     * Continue l'animation en cours (utile pour les animations qui se gèrent elles-mêmes)
     * @internal
     */
    public continue(): void {
        if (this.isRunning && this.frameId === null && this.animationCallback) {
            const currentAnimationId = this.animationId;
            const animate = (timestamp: number): void => {
                if (currentAnimationId !== this.animationId) {
                    return;
                }
                if (this.animationCallback) {
                    this.animationCallback(timestamp);
                }
                if (currentAnimationId === this.animationId && this.isRunning) {
                    this.frameId = requestAnimationFrame(animate);
                } else {
                    this.frameId = null;
                    this.isRunning = false;
                }
            };
            this.frameId = requestAnimationFrame(animate);
        }
    }

    /**
     * Arrête l'animation en cours
     */
    public stop(): void {
        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        this.isRunning = false;
        this.animationCallback = null;
    }

    /**
     * Vérifie si une animation est en cours
     * @returns true si une animation est active
     */
    public isActive(): boolean {
        return this.isRunning && this.frameId !== null;
    }

    /**
     * Obtient l'ID de l'animation actuelle
     * @returns ID de l'animation actuelle
     */
    public getAnimationId(): number {
        return this.animationId;
    }

    /**
     * Nettoie les ressources et arrête toute animation en cours
     */
    public destroy(): void {
        this.stop();
        this.animationId = 0;
    }
}

