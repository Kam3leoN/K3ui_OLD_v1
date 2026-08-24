/**
 * @fileoverview Composant Snow pour K3UI
 * @description Animation de neige avec GSAP 3
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../../../core/base/Component';
import { ComponentType, toComponentClassDef } from '../../../types/components/component-base';
import { SnowOptions } from '../../../types/components';
import { PriorityLevel } from '../../../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../../../utils/dom/aria';
import { LoggerManager, LocaleManager } from '../../../core/managers';
import { ManagerFactory } from '../../../core/factories';
import { getSnowDefaults } from '../../../specs/components/snow.specs';
import gsap from 'gsap';
import { getPreferReducedMotion } from '../../../utils/accessibility';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Particule de neige
 */
interface SnowParticle {
    x: number;
    y: number;
    size: number;
    dur: number;
    alpha: number;
    progress: number;
    rotation: number;
    image: HTMLImageElement;
}

/**
 * Valeurs par défaut pour les options
 */
const _defaults: SnowOptions = getSnowDefaults();

/**
 * Classe Snow pour K3UI
 */
export class Snow extends Component<SnowOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    /** Logger pour le composant */
    private logger: LoggerManager;

    /** Canvas pour l'animation */
    private canvas: HTMLCanvasElement | null = null;

    /** Contexte 2D du canvas */
    private ctx: CanvasRenderingContext2D | null = null;

    /** Largeur du canvas */
    private cw: number = 0;

    /** Hauteur du canvas */
    private ch: number = 0;

    /** Image de flocon de neige */
    private img: HTMLImageElement | null = null;

    /** Tableau des particules */
    private particles: SnowParticle[] = [];

    /** Nombre de particules */
    private particleNumber: number = 0;

    /** Animation en cours */
    private _isAnimating: boolean = false;

    /** Événement de redimensionnement enregistré */
    private hasResizeEventRegistered: boolean = false;

    /** Préfère moins de mouvement */
    private preferLessMotion: boolean;

    /** isLibCanvas : true si le canvas est créé par la lib (attaché à body), false si c'est un canvas personnalisé */
    private readonly isLibCanvas: boolean;

    /**
     * Options par défaut du composant
     * @returns Les options par défaut
     */
    static get defaults(): SnowOptions {
        return { ..._defaults };
    }

    /**
     * Obtient l'instance du composant pour un élément donné
     * @param el Élément HTML
     * @returns L'instance Snow
     */
    static getInstance(el: HTMLElement): Snow | undefined {
        return Component.getInstance(el) as Snow | undefined;
    }

    /**
     * Initialise les composants
     * @param els Éléments HTML ou sélecteur CSS
     * @param options Options de configuration
     * @returns Tableau des instances créées
     */
    static init(
        els: HTMLElement | NodeListOf<HTMLElement> | string | HTMLCollectionOf<HTMLElement>,
        options: Partial<SnowOptions> = {}
    ): Snow | Snow[] {
        return Component.init(els, options, toComponentClassDef(Snow)) as Snow | Snow[];
    }

    /**
     * Constructeur du composant
     * @param el Élément HTML
     * @param options Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<SnowOptions> = {}) {
        super(el, options, toComponentClassDef(Snow));

        this.logger = ManagerFactory.getLoggerManager('[Snow]');

        // Détecter si l'élément est un canvas personnalisé
        this.isLibCanvas = !(el instanceof HTMLCanvasElement);

        // Si c'est un canvas personnalisé, l'utiliser directement
        if (!this.isLibCanvas) {
            this.canvas = el as HTMLCanvasElement;
            this.ctx = this.canvas.getContext('2d');
        }

        // Initialiser les options
        this.options = {
            ...Snow.defaults,
            ...options,
        };

        // Détecter prefers-reduced-motion (système + override global window.K.preferReducedMotion)
        this.preferLessMotion = getPreferReducedMotion();

        // L'instance est gérée via ComponentRegistry (voir getInstance())

        // Initialiser le composant
        this.init();
    }

    /**
     * Initialise le composant
     * @private
     */
    private init(): void {
        // Configurer les attributs ARIA
        setAriaAttributes(this.el, {
            role: 'region',
            'aria-label': LocaleManager.t('snow.ariaLabel'),
        });

        // Charger l'image de flocon de neige
        this.loadSnowflakeImage();

        this.logger.info('Component initialized');
    }

    /**
     * Charge l'image de flocon de neige
     * @private
     */
    private loadSnowflakeImage(): void {
        const img = new Image(64, 64);
        img.onload = () => {
            this.img = img;
            // Si l'animation doit démarrer automatiquement (mode auto ou autoStart), la lancer
            if (this.options.mode === 'auto' || this.options.autoStart) {
                this.start();
            }
        };
        img.onerror = () => {
            this.logger.error('Failed to load snowflake image');
        };
        // Image de flocon de neige en base64 (depuis le code fourni)
        img.src =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAulBMVEVHcEz////+/v7////+/v79/f3////x8fH9/f3+/v7+/v7////+/v7////////////////////////////////////////////////+/v7///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+MnUWcAAAAPnRSTlMACQ4GBAoWAQMCDRMQJSIfOlQICxgdSkFyG09hXDcrKUeMLZKgsmmnPoIaL2aHWH4xbaw0d0S8wXu3m5cymMmy7QsAAAVDSURBVHgBzZd3g6JKEMQP99BbzoSYs5jFHDbq9/9ar6qb4aHLxr+uX7jYP6pqmKHn179VGa37sDLyO1/u/aW9f1C/tfAzYr4GYa+23sVLMF9h8OFhd6lkWZZt2/h+qSQMCvmEQNt/+ES0eg4qlUo5KcfxPMvib3+KwOPZz+5UNpv9GxZ+CggZnyDon+JtL4XudDpdDitNCBCwEmbxTgBID97xeHSXF41KQapSqTTKZTBSjk3E72SCAJCe5aXwdHbnc6by+UJlAR1AeEZFAgL9EOA57K8Ucrle1/cDlu/3cjkwFGFzSeTNeBsB+m3tz+d6fnA+dIqszuEc+D0gGjSS9ZAmjdz/yrwFiIEy+wN0z2a12ulUq81mxc6ZCBgBwrETfWS4BBYFNPK57hbtp361Wm628b/+qWYQDfrwiKCPWwATSC8KeH6nWOtXm67rrtdr1wWlbxANRqEiqOEWkKKAnn9gv+u22y2pdttVROAzChFhqYbMdQSOJNDbdmb9prtut5aTyW63myyXLUHMioeAPpCEEO6o4RYAB91z8VR112jf1etHVL2+A2LdrJ5mRfgAIa0EJhkH2BqBLwLay139+LTZzOfzzdNREC59HEJC1ivRxK0CRhAQsG5Ndsen+Wo1GAxWKzCIgIiIIEn+ZgoJgFpVBKB/MJQaAHGsT1prVwg5SdKhiY8Axw36X19Yr0RAhBLOXRAogSuRiS8jQ8znQgAEDIaXEWo6GhGhhCZy2NIEcyQgc/0elAshYCKAl9F0ut/vp9PRCwlw4Tb7M5pYpNVDBMhEAN8AVoPXEdrHqD0IryDsllgLlYClZIyxEO6wjgyhe5j1xcJqCAD6n5+fx2PVcKSJU/HQzf3v4Wo3Sop4kZrr5Q4WXgh4fnh4AGIPwuqpTgmzDj0o4P4a4EQhtHbH+eACAPofH4GAhldKQArigesQBzAEXcgcPTAEhDiajp/RTwJyEAni4cwQuJBXAB5pXMheIB4YwgssAIASCcPBhh6wDt1bAD2Q4PxNV3K+8YAQmEEEeAVg8iHgDhIQ41YlbFYxD2EIBpB7A5AvCyWUIwlPRkIsxbgCz7oGyLnopcxKtkMJJLA/buGcAIjtqHgKF32X0B+9CM0+VsEA9FWOr4SHU8VI4EKQAAQ2BB086asY9Pgi2SXZC/GiBLMQ3BDHDQmjKYvv8oYvUrXWCXKFchKAO6IUe59pAjviZYRiPx0wgo7PveDEt0L8aNQ9qVsKK8Fj5XK58FChgDUiQIaNhAz1ZVAPfBd0V/Ng4sk2YH892s4EwMEtQHc1Pw/YETShZ+t8hQqPxaY4YAQez0TT+OZ01uMdBDnecb4/PbE/dp6YvZjgwYOE6Hxv8wPD2u3YHwpIdhDf1QuYOHdq/Ma18JFCLVvSTwFcg6wNB8mTin5l9SMnX+l1u43mdnvNfp5nZismAbgpS3ZsUCCi6bKa8nXsBL08IqSDhAjMsWBzVCEhOBRnNc4aMmic5APNBLAGpUQBGiNnDRIwbPhnjEpm2MHAFIiBv3oWJANEg+V50by1PRw6HLg6ncPWlwFBBHwMgAtOnGUOjDLxbbfbANOaGZQcAmjhI4IOnUCAIaUD4yKacbgTk1PQsddCEBx7G2Tk0YyZlXMvB072y1ZOJpjB23IgAkbKjUajwlpczbz3H96b7nnzsGwgyDClk7stApjhBwhzfdD7gyk+nZP/Z/3GB0RQhm17nqPl2XZJp+XPAGY9yOAdSquEbrZzRPwKgCrkHkaMFrvjd5/PEfFrJJvNRfK7d1lzk9X6+ZWY19t/sP4DoePqp9agWnMAAAAASUVORK5CYII=';
    }

    /**
     * Crée une particule de neige
     * @param index Index de la particule
     * @returns Particule de neige
     * @private
     */
    private createParticle(index: number): SnowParticle {
        const size = this.rand(5, 10); // Taille par défaut (90% background)
        const dur = (15 - size) / this.options.speed;
        const alpha = this.rand(0.25, 0.75);

        let finalSize = size;
        let finalDur = dur;
        let finalAlpha = alpha;

        // 1% dans le foreground
        if (index < this.options.particleCount / 100) {
            finalSize = this.rand(150, 200);
            finalDur = finalDur / 4;
            finalAlpha = finalAlpha / 3.3;
        }
        // 9% dans le middleground
        else if (index < this.options.particleCount / 10) {
            finalSize = this.rand(19, 33);
            finalDur = finalDur / 2.5;
            finalAlpha = finalAlpha / 1.5;
        }

        const rot = -this.rand(3, 5);
        const rotation = index % 4 === 0 ? -rot : rot;

        const particle: SnowParticle = {
            x: 0,
            y: 0,
            size: finalSize,
            dur: finalDur,
            alpha: finalAlpha,
            progress: 0,
            rotation: rotation,
            image: this.img!,
        };

        return particle;
    }

    /**
     * Configure une particule pour l'animation
     * @param p Particule
     * @private
     */
    private setParticle(p: SnowParticle): void {
        this.particleNumber++;
        const windVariance = this.options.windVariance;
        const wind = this.options.wind;

        const startX = this.rand(-Math.abs(wind), this.cw + Math.abs(wind));
        const endX = startX + this.rand(wind / windVariance, wind * windVariance);

        const timeline = gsap.timeline();
        timeline.fromTo(
            p,
            {
                x: startX,
                y: -p.size,
                progress: 0,
            },
            {
                duration: p.dur,
                x: endX,
                y: this.ch + p.size,
                progress: 1,
                ease: 'none',
                onComplete: () => {
                    this.setParticle(p);
                },
            }
        );

        // Fast forward sur le premier run
        if (this.particleNumber < this.options.particleCount) {
            timeline.seek(p.dur * this.rand(0, 1));
        }
    }

    /**
     * Démarre l'animation de neige
     */
    public start(): void {
        if (this._isAnimating) {
            return;
        }

        this.startAnimation();
    }

    /**
     * Démarre l'animation de neige.
     * @private
     */
    private startAnimation(): void {
        if (this._isAnimating) {
            return;
        }

        // Désactiver si mouvement réduit (relecture pour prendre en compte le toggle global doc)
        if (this.options.disableForReducedMotion && getPreferReducedMotion()) {
            return;
        }

        // Créer le canvas si nécessaire
        if (this.isLibCanvas && !this.canvas) {
            this.canvas = this.createCanvas();
            document.body.appendChild(this.canvas);
        }
        if (this.isLibCanvas && this.canvas && !document.body.contains(this.canvas)) {
            document.body.appendChild(this.canvas);
        }

        // Initialiser le contexte
        if (!this.ctx && this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        }

        if (!this.ctx || !this.canvas) {
            this.logger.error('Failed to initialize canvas');
            return;
        }

        // Initialiser la taille du canvas
        this.resizeCanvas();

        // Attendre que l'image soit chargée
        if (!this.img) {
            // Charger l'image et redémarrer start() après chargement
            const img = new Image(64, 64);
            img.onload = () => {
                this.img = img;
                // Redémarrer start() après chargement de l'image
                this.start();
            };
            img.onerror = () => {
                this.logger.error('Failed to load snowflake image');
            };
            img.src =
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAulBMVEVHcEz////+/v7////+/v79/f3////x8fH9/f3+/v7+/v7////+/v7////////////////////////////////////////////////+/v7///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+MnUWcAAAAPnRSTlMACQ4GBAoWAQMCDRMQJSIfOlQICxgdSkFyG09hXDcrKUeMLZKgsmmnPoIaL2aHWH4xbaw0d0S8wXu3m5cymMmy7QsAAAVDSURBVHgBzZd3g6JKEMQP99BbzoSYs5jFHDbq9/9ar6qb4aHLxr+uX7jYP6pqmKHn179VGa37sDLyO1/u/aW9f1C/tfAzYr4GYa+23sVLMF9h8OFhd6lkWZZt2/h/qSQMCvmEQNt/+ES0eg4qlUo5KcfxPMvib3+KwOPZz+5UNpv9GxZ+CggZnyDon+JtL4XudDpdDitNCBCwEmbxTgBID97xeHSXF41KQapSqTTKZTBSjk3E72SCAJCe5aXwdHbnc6by+UJlAR1AeEZFAgL9EOA57K8Ucrle1/cDlu/3cjkwFGFzSeTNeBsB+m3tz+d6fnA+dIqszuEc+D0gGjSS9ZAmjdz/yrwFiIEy+wN0z2a12ulUq81mxc6ZCBgBwrETfWS4BBYFNPK57hbtp361Wm628b/+qWYQDfrwiKCPWwATSC8KeH6nWOtXm67rrtdr1wWlbxANRqEiqOEWkKKAnn9gv+u22y2pdttVROAzChFhqYbMdQSOJNDbdmb9prtut5aTyW63myyXLUHMioeAPpCEEO6o4RYAB91z8VR112jf1etHVL2+A2LdrJ5mRfgAIa0EJhkH2BqBLwLay139+LTZzOfzzdNREC59HEJC1ivRxK0CRhAQsG5Ndsen+Wo1GAxWKzCIgIiIIEn+ZgoJgFpVBKB/MJQaAHGsT1prVwg5SdKhiY8Axw36X19Yr0RAhBLOXRAogSuRiS8jQ8znQgAEDIaXEWo6GhGhhCZy2NIEcyQgc/0elAshYCKAl9F0ut/vp9PRCwlw4Tb7M5pYpNVDBMhEAN8AVoPXEdrHqD0IryDsllgLlYClZIyxEO6wjgyhe5j1xcJqCAD6n5+fx2PVcKSJU/HQzf3v4Wo3Sop4kZrr5Q4WXgh4fnh4AGIPwuqpTgmzDj0o4P4a4EQhtHbH+eACAPofH4GAhldKQArigesQBzAEXcgcPTAEhDiajp/RTwJyEAni4cwQuJBXAB5pXMheIB4YwgssAIASCcPBhh6wDt1bAD2Q4PxNV3K+8YAQmEEEeAVg8iHgDhIQ41YlbFYxD2EIBpB7A5AvCyWUIwlPRkIsxbgCz7oGyLnopcxKtkMJJLA/buGcAIjtqHgKF32X0B+9CM0+VsEA9FWOr4SHU8VI4EKQAAQ2BB086asY9Pgi2SXZC/GiBLMQ3BDHDQmjKYvv8oYvUrXWCXKFchKAO6IUe59pAjviZYRiPx0wgo7PveDEt0L8aNQ9qVsKK8Fj5XK58FChgDUiQIaNhAz1ZVAPfBd0V/Ng4sk2YH892s4EwMEtQHc1Pw/YETShZ+t8hQqPxaY4YAQez0TT+OZ01uMdBDnecb4/PbE/dp6YvZjgwYOE6Hxv8wPD2u3YHwpIdhDf1QuYOHdq/Ma18JFCLVvSTwFcg6wNB8mTin5l9SMnX+l1u43mdnvNfp5nZismAbgpS3ZsUCCi6bKa8nXsBL08IqSDhAjMsWBzVCEhOBRnNc4aMmic5APNBLAGpUQBGiNnDRIwbPhnjEpm2MHAFIiBv3oWJANEg+V50by1PRw6HLg6ncPWlwFBBHwMgAtOnGUOjDLxbbfbANOaGZQcAmjhI4IOnUCAIaUD4yKacbgTk1PQsddCEBx7G2Tk0YyZlXMvB072y1ZOJpjB23IgAkbKjUajwlpczbz3H96b7nnzsGwgyDClk7stApjhBwhzfdD7gyk+nZP/Z/3GB0RQhm17nqPl2XZJp+XPAGY9yOAdSquEbrZzRPwKgCrkHkaMFrvjd5/PEfFrJJvNRfK7d1lzk9X6+ZWY19t/sP4DoePqp9agWnMAAAAASUVORK5CYII=';
            return;
        }

        // Réinitialiser
        this.particles = [];
        this.particleNumber = 0;

        // Créer les particules
        for (let i = 0; i < this.options.particleCount; i++) {
            const particle = this.createParticle(i);
            this.particles.push(particle);
            this.setParticle(particle);
        }

        // Démarrer l'animation
        this._isAnimating = true;

        // Appeler les callbacks
        if (this.options.onOpenStart) {
            this.options.onOpenStart(this.el);
        }

        // Écouter les ticks de GSAP (API GSAP 3 : add/remove, pas addEventListener)
        gsap.ticker.add(this.tickHandler);

        // Gérer le redimensionnement
        if (this.options.resize && !this.hasResizeEventRegistered) {
            this.hasResizeEventRegistered = true;
            window.addEventListener('resize', this.resizeHandler);
        }

        this.logger.info('Snow animation started');
    }

    /**
     * Vérifie si l'animation est en cours
     * @returns true si l'animation est active
     */
    public get isAnimating(): boolean {
        return this._isAnimating;
    }

    /**
     * Arrête l'animation de neige
     */
    public stop(): void {
        if (!this._isAnimating) {
            return;
        }

        // Appeler les callbacks avant l'arrêt
        if (this.options.onCloseStart) {
            this.options.onCloseStart(this.el);
        }

        // Arrêter toutes les animations GSAP
        this.particles.forEach((particle) => {
            gsap.killTweensOf(particle);
        });

        gsap.ticker.remove(this.tickHandler);

        // Retirer le resize handler
        if (this.hasResizeEventRegistered) {
            window.removeEventListener('resize', this.resizeHandler);
            this.hasResizeEventRegistered = false;
        }

        // Nettoyer le canvas
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this._isAnimating = false;
        this.particles = [];
        this.particleNumber = 0;

        // Appeler les callbacks
        if (this.options.onCloseEnd) {
            this.options.onCloseEnd(this.el);
        }

        this.logger.info('Snow animation stopped');
    }

    /**
     * Handler pour le tick de GSAP
     * @private
     */
    private tickHandler = (): void => {
        if (!this.ctx || !this.canvas) return;

        this.ctx.clearRect(0, 0, this.cw, this.ch);
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (!p.image) continue;

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation * p.progress);
            this.ctx.globalAlpha = p.alpha;
            this.ctx.drawImage(
                p.image,
                -p.size / 2,
                -p.size / 2,
                p.size,
                p.size
            );
            this.ctx.restore();
        }
    };

    /**
     * Handler pour le redimensionnement
     * @private
     */
    private resizeHandler = (): void => {
        this.particleNumber = 0;
        this.resizeCanvas();

        // Réinitialiser toutes les particules
        for (let i = 0; i < this.particles.length; i++) {
            gsap.killTweensOf(this.particles[i]);
            this.setParticle(this.particles[i]);
        }
    };

    /**
     * Redimensionne le canvas
     * @private
     */
    private resizeCanvas(): void {
        if (!this.canvas) return;

        if (this.isLibCanvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        } else {
            const rect = this.canvas.getBoundingClientRect();
            const w = rect.width || this.canvas.clientWidth || 300;
            const h = rect.height || this.canvas.clientHeight || 150;
            this.canvas.width = Math.max(1, Math.floor(w));
            this.canvas.height = Math.max(1, Math.floor(h));
        }

        this.cw = this.canvas.width;
        this.ch = this.canvas.height;
    }

    /**
     * Crée un canvas pour la fenêtre
     * @private
     */
    private createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.style.setProperty('position', 'fixed', 'important');
        canvas.style.setProperty('top', '0px', 'important');
        canvas.style.setProperty('left', '0px', 'important');
        canvas.style.setProperty('width', '100vw', 'important');
        canvas.style.setProperty('height', '100vh', 'important');
        canvas.style.setProperty('pointer-events', 'none', 'important');
        canvas.style.setProperty('z-index', String(this.options.zIndex), 'important');
        canvas.removeAttribute('class');
        return canvas;
    }

    /**
     * Génère un nombre aléatoire entre min et max
     * @param min Minimum
     * @param max Maximum
     * @returns Nombre aléatoire
     * @private
     */
    private rand(min: number = 0, max: number = 1): number {
        return min + (max - min) * Math.random();
    }

    /**
     * Détruit l'instance du composant
     */
    public override destroy(): void {
        // Arrêter l'animation
        this.stop();

        // Nettoyer le canvas
        if (this.canvas && this.isLibCanvas) {
            if (document.body.contains(this.canvas)) {
                document.body.removeChild(this.canvas);
            }
        }

        // Nettoyer les attributs ARIA
        removeAriaAttribute(this.el, 'role');
        removeAriaAttribute(this.el, 'aria-label');

        this.logger.info('Component destroyed');
        super.destroy();
    }
}



/**
 * Enregistrement du Web Component k3ui-snow
 * @description Permet l'utilisation de <k3ui-snow> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-snow')) {
    customElements.define('k3ui-snow', class extends HTMLElement {
        private snowInstance: Snow | null = null;

        connectedCallback() {
            // L'initialisation sera geree par AutoInit
            // ou manuellement via K.Snow.init(this)
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback() {
            // Nettoyage lors de la suppression du DOM
            if (this.snowInstance) {
                this.snowInstance.destroy();
                this.snowInstance = null;
            }
        }
    });
}
