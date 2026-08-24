/**
 * @fileoverview Composant Confetti pour K3UI
 * @description Refactorisé basé sur canvas-confetti v1.9.4
 * @description Utilise directement le code source de canvas-confetti adapté en TypeScript
 * @author K3UI Team
 * @version 1.0.0
 */

import { Component } from '../../../core/base/Component';
import { ComponentType, toComponentClassDef } from '../../../types/components/component-base';
import { ConfettiOptions } from '../../../types/components';
import { PriorityLevel } from '../../../types/base';
import { setAriaAttributes, removeAriaAttribute } from '../../../utils/dom/aria';
import { LoggerManager, LocaleManager } from '../../../core/managers';
import { ManagerFactory } from '../../../core/factories';
import { getConfettiDefaults } from '../../../specs/components/confetti.specs';
import { getPreferReducedMotion } from '../../../utils/accessibility';
import type { ConfettiFireOptions } from '../../../types/confetti/confetti-fire';

// ============================================================================
// TYPES ET INTERFACES (basés sur canvas-confetti)
// ============================================================================

/**
 * Forme de confetti avec path SVG
 */
interface PathShape {
    type: 'path';
    path: string;
    matrix: number[];
}

/**
 * Forme de confetti avec bitmap
 */
interface BitmapShape {
    type: 'bitmap';
    bitmap: ImageBitmap;
    matrix: number[];
}

/**
 * Type de forme de confetti
 */
type ConfettiShape = string | PathShape | BitmapShape;

/**
 * Particule de confetti (identique à canvas-confetti)
 */
interface Fetti {
    x: number;
    y: number;
    wobble: number;
    wobbleSpeed: number;
    velocity: number;
    angle2D: number;
    tiltAngle: number;
    color: { r: number; g: number; b: number };
    shape: ConfettiShape;
    tick: number;
    totalTicks: number;
    decay: number;
    drift: number;
    random: number;
    tiltSin: number;
    tiltCos: number;
    wobbleX: number;
    wobbleY: number;
    gravity: number;
    ovalScalar: number;
    scalar: number;
    flat: boolean;
}

/**
 * Objet d'animation (identique à canvas-confetti)
 */
interface AnimationObject {
    addFettis: (fettis: Fetti[]) => Promise<void>;
    canvas: HTMLCanvasElement;
    promise: Promise<void>;
    reset: () => void;
}

/**
 * Options pour fire() (identique à canvas-confetti)
 */
interface FireOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    shapes?: (string | PathShape | BitmapShape)[];
    zIndex?: number;
    colors?: string[];
    disableForReducedMotion?: boolean;
    scalar?: number;
    flat?: boolean;
}

/**
 * Valeurs par défaut pour les options
 */
const _defaults: ConfettiOptions = getConfettiDefaults();

// ============================================================================
// DÉTECTION DES CAPACITÉS DU NAVIGATEUR (identique à canvas-confetti)
// ============================================================================

/**
 * Vérifie si Path2D et DOMMatrix sont disponibles
 * Identique à canvas-confetti
 */
const canUsePaths = typeof Path2D === 'function' && typeof DOMMatrix === 'function';

/**
 * Vérifie si OffscreenCanvas est disponible et peut dessiner des bitmaps
 * Identique à canvas-confetti
 */
const canDrawBitmap = (function () {
    if (typeof OffscreenCanvas === 'undefined') {
        return false;
    }

    try {
        const canvas = new OffscreenCanvas(1, 1);
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        ctx.fillRect(0, 0, 1, 1);
        const bitmap = canvas.transferToImageBitmap();
        ctx.createPattern(bitmap, 'no-repeat');
        return true;
    } catch (e) {
        return false;
    }
})();

// ============================================================================
// UTILITAIRES (identiques à canvas-confetti)
// ============================================================================

/**
 * Mapper pour les bitmaps (cache pour performances)
 * Identique à canvas-confetti bitmapMapper
 * @see https://github.com/catdad/canvas-confetti/issues/209
 */
const bitmapMapper = (function (skipTransform: boolean, map: Map<ImageBitmap, OffscreenCanvas>) {
    return {
        transform: function (bitmap: ImageBitmap): OffscreenCanvas | ImageBitmap {
            if (skipTransform) {
                return bitmap;
            }

            if (map.has(bitmap)) {
                return map.get(bitmap)!;
            }

            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(bitmap, 0, 0);
            map.set(bitmap, canvas);
            return canvas;
        },
        clear: function (): void {
            map.clear();
        },
    };
})(!canDrawBitmap, new Map<ImageBitmap, OffscreenCanvas>());

/**
 * Gestionnaire RAF amélioré
 * Identique à canvas-confetti raf
 */
const raf = (function () {
    const TIME = Math.floor(1000 / 60);
    let frame: ((cb: () => void) => number) | null = null;
    let cancel: ((id: number) => void) | null = null;
    const frames: { [key: number]: number } = {};
    let lastFrameTime = 0;

    if (typeof requestAnimationFrame === 'function' && typeof cancelAnimationFrame === 'function') {
        frame = function (cb: () => void): number {
            const id = Math.random();

            frames[id] = requestAnimationFrame(function onFrame(time: number) {
                if (lastFrameTime === time || lastFrameTime + TIME - 1 < time) {
                    lastFrameTime = time;
                    delete frames[id];
                    cb();
                } else {
                    frames[id] = requestAnimationFrame(onFrame);
                }
            });

            return id;
        };

        cancel = function (id: number): void {
            if (frames[id]) {
                cancelAnimationFrame(frames[id]);
                delete frames[id];
            }
        };
    } else {
        frame = function (cb: () => void): number {
            return window.setTimeout(cb, TIME);
        };

        cancel = function (timer: number): void {
            clearTimeout(timer);
        };
    }

    return { frame: frame!, cancel: cancel! };
})();

// ============================================================================
// CLASSE CONFETTI (basée sur canvas-confetti confettiCannon)
// ============================================================================

/**
 * Classe Confetti pour K3UI
 * Refactorisée basée sur canvas-confetti v1.9.4
 * Utilise directement le code source de canvas-confetti adapté en TypeScript
 */
export class Confetti extends Component<ConfettiOptions> {
    /** Niveau de priorité du composant */
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    /** Logger pour le composant */
    private logger: LoggerManager;

    /** Canvas pour l'animation (toujours null car isLibCanvas = true) */
    private canvas: HTMLCanvasElement | null = null;

    /** Objet d'animation actuel */
    private animationObj: AnimationObject | null = null;

    /** État d'initialisation */
    private initialized = false;

    /** Préfère moins de mouvement */
    private preferLessMotion: boolean;

    /** Permet le redimensionnement */
    private allowResize: boolean;

    /** Événement de redimensionnement enregistré */
    private hasResizeEventRegistered = false;

    /** isLibCanvas : true si le canvas est créé par la lib (attaché à body), false si c'est un canvas personnalisé */
    private readonly isLibCanvas: boolean;

    /** Désactiver pour mouvement réduit (global) */
    private globalDisableForReducedMotion: boolean;

    /** Fonction de redimensionnement */
    private resizer: (canvas: HTMLCanvasElement) => void;

    /**
     * Options par défaut du composant
     * @returns Les options par défaut
     */
    static get defaults(): ConfettiOptions {
        return { ..._defaults };
    }

    /**
     * Obtient l'instance du composant pour un élément donné
     * @param el Élément HTML
     * @returns L'instance Confetti
     */
    static getInstance(el: HTMLElement): Confetti | undefined {
        return Component.getInstance(el) as Confetti | undefined;
    }

    /**
     * Initialise les composants
     * @param els Éléments HTML ou sélecteur CSS
     * @param options Options de configuration
     * @returns Tableau des instances créées
     */
    static init(
        els: HTMLElement | NodeListOf<HTMLElement> | string | HTMLCollectionOf<HTMLElement>,
        options: Partial<ConfettiOptions> = {}
    ): Confetti[] {
        return Component.init(els, options, toComponentClassDef(Confetti)) as Confetti[];
    }



    /**
     * Constructeur du composant
     * Identique à canvas-confetti confettiCannon
     * @param el Élément HTML
     * @param options Options de configuration
     */
    constructor(el: HTMLElement, options: Partial<ConfettiOptions> = {}) {
        super(el, options, toComponentClassDef(Confetti));

        this.logger = ManagerFactory.getLoggerManager('[Confetti]');

        // Détecter si l'élément est un canvas personnalisé
        // Si c'est un canvas, on l'utilise directement (isLibCanvas = false)
        // Sinon, on crée un canvas global attaché à body (isLibCanvas = true)
        this.isLibCanvas = !(el instanceof HTMLCanvasElement);

        // Si c'est un canvas personnalisé, l'utiliser directement
        if (!this.isLibCanvas) {
            this.canvas = el as HTMLCanvasElement;
        }

        // Initialiser les options
        this.options = {
            ...Confetti.defaults,
            ...options,
        };

        // Détecter prefers-reduced-motion (système + override global window.K.preferReducedMotion)
        this.preferLessMotion = getPreferReducedMotion();

        // Permettre le redimensionnement (identique à canvas-confetti)
        this.allowResize = Boolean(prop(this.options, 'resize'));

        // Désactiver pour mouvement réduit (global) (identique à canvas-confetti)
        this.globalDisableForReducedMotion = Boolean(
            prop(this.options, 'disableForReducedMotion', (val) => Boolean(val))
        );

        // Fonction de redimensionnement (identique à canvas-confetti)
        this.resizer = this.isLibCanvas ? setCanvasWindowSize : setCanvasRectSize;

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
            'aria-label': LocaleManager.t('confetti.ariaLabel'),
        });

        this.logger.info('Component initialized');
    }

    /**
     * Lance l'animation locale
     * Identique à canvas-confetti fireLocal
     * @param options Options
     * @param size Taille
     * @param done Callback de fin
     * @returns Promise de l'animation
     */
    private fireLocal(
        options: FireOptions,
        size: { width: number; height: number },
        done: () => void
    ): Promise<void> {
        const particleCount = prop(options, 'particleCount', (val) =>
            onlyPositiveInt(Number(val))
        ) as number;
        const angle = Number(prop(options, 'angle', Number));
        const spread = Number(prop(options, 'spread', Number));
        const startVelocity = Number(prop(options, 'startVelocity', Number));
        const decay = Number(prop(options, 'decay', Number));
        const gravity = Number(prop(options, 'gravity', Number));
        const drift = Number(prop(options, 'drift', Number));
        const colors = prop(options, 'colors', (val) =>
            colorsToRgb(val as string[])
        ) as { r: number; g: number; b: number }[];
        const ticks = Number(prop(options, 'ticks', Number));
        const shapes = (prop(options, 'shapes') as string[]) ?? ['square'];
        const scalar = Number(prop(options, 'scalar'));
        const flat = Boolean(prop(options, 'flat'));
        const origin = getOrigin(options);

        let temp = particleCount;
        const fettis: Fetti[] = [];

        const startX = this.canvas!.width * origin.x;
        const startY = this.canvas!.height * origin.y;

        while (temp--) {
            fettis.push(
                randomPhysics({
                    x: startX,
                    y: startY,
                    angle: angle,
                    spread: spread,
                    startVelocity: startVelocity,
                    color: colors[temp % colors.length],
                    shape: shapes[randomInt(0, shapes.length)],
                    ticks: ticks,
                    decay: decay,
                    gravity: gravity,
                    drift: drift,
                    scalar: scalar,
                    flat: flat,
                })
            );
        }

        // Si on a une animation en cours, ajouter les nouveaux confettis
        if (this.animationObj) {
            return this.animationObj.addFettis(fettis);
        }

        this.animationObj = animate(this.canvas!, fettis, this.resizer, size, done);
        return this.animationObj.promise;
    }

    /**
     * Lance l'animation de confettis
     * Identique à canvas-confetti fire
     * @param options Options d'animation
     * @returns Promise résolue quand l'animation est terminée
     */
    public fire(options: FireOptions = {}): Promise<void> {
        const disableForReducedMotion =
            this.globalDisableForReducedMotion ||
            Boolean(prop(options, 'disableForReducedMotion', (val) => Boolean(val)));
        const zIndex = Number(prop(options, 'zIndex', Number));

        if (disableForReducedMotion && getPreferReducedMotion()) {
            return Promise.resolve();
        }

        // Logique identique à canvas-confetti
        if (this.isLibCanvas && this.animationObj) {
            // Utiliser le canvas existant de l'animation en cours
            this.canvas = this.animationObj.canvas;
        } else if (this.isLibCanvas && !this.canvas) {
            // Créer et initialiser un nouveau canvas
            this.canvas = getCanvas(zIndex);
            document.body.appendChild(this.canvas);
        }
        // Si c'est un canvas personnalisé, il est déjà défini dans le constructeur

        // Identique à canvas-confetti
        if (!this.isLibCanvas && !this.initialized) {
            // Pour un canvas personnalisé, initialiser la taille au moins une fois
            this.resizer(this.canvas!);
        } else if (this.allowResize && !this.initialized) {
            // Initialiser la taille d'un canvas fourni par l'utilisateur
            this.resizer(this.canvas!);
        } else if (this.isLibCanvas && !this.initialized) {
            // Pour le canvas global, TOUJOURS initialiser la taille au moins une fois
            // même si resize n'est pas activé, car le canvas doit avoir des dimensions valides
            setCanvasWindowSize(this.canvas!);
        } else if (this.isLibCanvas && this.canvas && (this.canvas.width === 0 || this.canvas.height === 0)) {
            // Si le canvas existe mais n'a pas de taille valide, l'initialiser
            setCanvasWindowSize(this.canvas);
        } else if (!this.isLibCanvas && this.canvas && (this.canvas.width === 0 || this.canvas.height === 0)) {
            // Si le canvas personnalisé n'a pas de taille valide, l'initialiser
            this.resizer(this.canvas);
        }

        const size = {
            width: this.canvas!.width,
            height: this.canvas!.height,
        };

        this.initialized = true;

        const onResize = () => {
            // Ne pas interroger la taille ici, car cela peut s'exécuter fréquemment
            size.width = size.height = 0;
        };

        const done = () => {
            this.animationObj = null;

            if (this.allowResize) {
                this.hasResizeEventRegistered = false;
                window.removeEventListener('resize', onResize);
            }

            if (this.isLibCanvas && this.canvas) {
                if (document.body.contains(this.canvas)) {
                    document.body.removeChild(this.canvas);
                }
                this.canvas = null;
                this.initialized = false;
            }
        };

        if (this.allowResize && !this.hasResizeEventRegistered) {
            this.hasResizeEventRegistered = true;
            window.addEventListener('resize', onResize, false);
        }

        // Appeler les callbacks
        if (this.options.onOpenStart) {
            this.options.onOpenStart(this.el);
        }

        return this.fireLocal(options, size, () => {
            if (this.options.onOpenEnd) {
                this.options.onOpenEnd(this.el);
            }
            done();
        });
    }

    /**
     * Réinitialise l'animation
     */
    public reset(): void {
        if (this.animationObj) {
            this.animationObj.reset();
        }
    }

    /**
     * Crée une forme à partir d'un path SVG
     * Identique à canvas-confetti shapeFromPath
     * @param pathData Path SVG ou objet avec path et matrix
     * @returns Forme de confetti
     */
    static shapeFromPath(
        pathData: string | { path: string; matrix?: number[] }
    ): PathShape {
        return shapeFromPath(pathData);
    }

    /**
     * Crée une forme à partir d'un texte/emoji
     * Identique à canvas-confetti shapeFromText
     * @param textData Texte ou objet avec texte et options
     * @returns Forme de confetti bitmap
     */
    static shapeFromText(
        textData:
            | string
            | {
                text: string;
                scalar?: number;
                fontFamily?: string;
                color?: string;
            }
    ): BitmapShape {
        return shapeFromText(textData);
    }

    /**
     * Détruit l'instance du composant
     */
    public override destroy(): void {
        // Réinitialiser l'animation
        this.reset();

        // Nettoyer le canvas
        if (this.canvas) {
            if (document.body.contains(this.canvas)) {
                document.body.removeChild(this.canvas);
            }
        }

        // Nettoyer le cache des bitmaps
        bitmapMapper.clear();

        // Nettoyer les attributs ARIA
        removeAriaAttribute(this.el, 'role');
        removeAriaAttribute(this.el, 'aria-label');

        super.destroy();
        this.logger.info('Component destroyed');
    }
}

// ============================================================================
// FONCTIONS GLOBALES (identiques à canvas-confetti)
// ============================================================================

/**
 * Crée une forme à partir d'un path SVG
 * Identique à canvas-confetti shapeFromPath
 */
function shapeFromPath(
    pathData: string | { path: string; matrix?: number[] }
): PathShape {
    if (!canUsePaths) {
        throw new Error('path confetti are not supported in this browser');
    }

    let path: string;
    let matrix: number[] | undefined;

    if (typeof pathData === 'string') {
        path = pathData;
    } else {
        path = pathData.path;
        matrix = pathData.matrix;
    }

    const path2d = new Path2D(path);
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;

    if (!matrix) {
        // Tenter de déterminer la largeur du path, jusqu'à 1000x1000
        const maxSize = 1000;
        let minX = maxSize;
        let minY = maxSize;
        let maxX = 0;
        let maxY = 0;
        let width: number, height: number;

        // Faire un saut de lignes... c'est plus rapide que de vérifier
        // chaque pixel et sera toujours correct
        for (let x = 0; x < maxSize; x += 2) {
            for (let y = 0; y < maxSize; y += 2) {
                if (tempCtx.isPointInPath(path2d, x, y, 'nonzero')) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        width = maxX - minX;
        height = maxY - minY;

        const maxDesiredSize = 10;
        const scale = Math.min(maxDesiredSize / width, maxDesiredSize / height);

        matrix = [
            scale,
            0,
            0,
            scale,
            -Math.round((width / 2) + minX) * scale,
            -Math.round((height / 2) + minY) * scale,
        ];
    }

    return {
        type: 'path',
        path: path,
        matrix: matrix,
    };
}

/**
 * Crée une forme à partir d'un texte/emoji
 * Identique à canvas-confetti shapeFromText
 * @see https://nolanlawson.com/2022/04/08/the-struggle-of-using-native-emoji-on-the-web/
 */
function shapeFromText(
    textData:
        | string
        | {
            text: string;
            scalar?: number;
            fontFamily?: string;
            color?: string;
        }
): BitmapShape {
    if (typeof OffscreenCanvas === 'undefined') {
        throw new Error('text confetti are not supported in this browser');
    }

    let text: string;
    let scalar = 1;
    let color = '#000000';
    // Voir https://nolanlawson.com/2022/04/08/the-struggle-of-using-native-emoji-on-the-web/
    const fontFamily =
        '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "Twemoji Mozilla", "system emoji", sans-serif';

    if (typeof textData === 'string') {
        text = textData;
    } else {
        text = textData.text;
        scalar = 'scalar' in textData ? textData.scalar || 1 : scalar;
        color = 'color' in textData ? textData.color || color : color;
    }

    // Tous les autres confettis font 10 pixels,
    // donc cette taille de pixel est le facteur d'échelle 100% de facto
    const fontSize = 10 * scalar;
    const font = `${fontSize}px ${fontFamily}`;

    let canvas = new OffscreenCanvas(fontSize, fontSize);
    let ctx = canvas.getContext('2d')!;

    ctx.font = font;
    const size = ctx.measureText(text);
    let width = Math.ceil(size.actualBoundingBoxRight + size.actualBoundingBoxLeft);
    let height = Math.ceil(size.actualBoundingBoxAscent + size.actualBoundingBoxDescent);

    const padding = 2;
    const x = size.actualBoundingBoxLeft + padding;
    const y = size.actualBoundingBoxAscent + padding;
    width += padding + padding;
    height += padding + padding;

    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext('2d')!;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);

    const scale = 1 / scalar;

    return {
        type: 'bitmap',
        bitmap: canvas.transferToImageBitmap(),
        matrix: [scale, 0, 0, scale, (-width * scale) / 2, (-height * scale) / 2],
    };
}

/**
 * Transforme un Path2D avec une matrice de transformation
 * Identique à canvas-confetti transformPath2D
 */
function transformPath2D(
    pathString: string,
    pathMatrix: number[],
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    rotation: number
): Path2D {
    if (!canUsePaths) {
        throw new Error('Path2D is not supported in this browser');
    }

    const path2d = new Path2D(pathString);
    const t1 = new Path2D();
    t1.addPath(path2d, new DOMMatrix(pathMatrix));

    const t2 = new Path2D();
    // Voir https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix/DOMMatrix
    t2.addPath(
        t1,
        new DOMMatrix([
            Math.cos(rotation) * scaleX,
            Math.sin(rotation) * scaleX,
            -Math.sin(rotation) * scaleY,
            Math.cos(rotation) * scaleY,
            x,
            y,
        ])
    );

    return t2;
}

/**
 * Convertit une valeur avec transformation optionnelle
 * Identique à canvas-confetti convert
 */
function convert<T>(val: unknown, transform?: (val: unknown) => T): T {
    return transform ? transform(val) : (val as T);
}

/**
 * Vérifie si une valeur est valide (non null et non undefined)
 * Identique à canvas-confetti isOk
 */
function isOk(val: unknown): boolean {
    return !(val === null || val === undefined);
}

type ConfettiPropSource = ConfettiFireOptions | ConfettiOptions;

/**
 * Récupère une propriété depuis les options ou les defaults
 * Identique à canvas-confetti prop
 */
function prop(
    options: ConfettiPropSource,
    name: string,
    transform?: (val: unknown) => unknown
): unknown {
    const defaults = _defaults as unknown as Record<string, unknown>;
    const source = options as unknown as Record<string, unknown>;
    const raw = source && isOk(source[name]) ? source[name] : defaults[name];
    return convert(raw, transform);
}

/**
 * Convertit un nombre en entier positif
 * Identique à canvas-confetti onlyPositiveInt
 */
function onlyPositiveInt(number: number): number {
    return number < 0 ? 0 : Math.floor(number);
}

/**
 * Génère un entier aléatoire entre min et max [min, max)
 * Identique à canvas-confetti randomInt
 */
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Convertit une couleur hex en RGB
 * Identique à canvas-confetti hexToRgb
 */
function hexToRgb(str: string): { r: number; g: number; b: number } {
    let val = String(str).replace(/[^0-9a-f]/gi, '');

    if (val.length < 6) {
        val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
    }

    return {
        r: parseInt(val.substring(0, 2), 16),
        g: parseInt(val.substring(2, 4), 16),
        b: parseInt(val.substring(4, 6), 16),
    };
}

/**
 * Convertit un tableau de couleurs hex en RGB
 * Identique à canvas-confetti colorsToRgb
 */
function colorsToRgb(colors: string[]): { r: number; g: number; b: number }[] {
    return colors.map(hexToRgb);
}

/**
 * Récupère l'origine depuis les options
 * Identique à canvas-confetti getOrigin
 * 
 * IMPORTANT: Dans canvas-confetti, prop(origin, 'x', Number) cherche defaults.x (pas defaults.origin.x)
 * car les valeurs par défaut sont x: 0.5 et y: 0.5 directement dans defaults, pas dans defaults.origin
 * 
 * Pour simuler ce comportement, on utilise directement les valeurs par défaut depuis _defaults.origin
 * et on applique la même logique que prop() manuellement
 */
function getOrigin(options: ConfettiFireOptions): { x: number; y: number } {
    const origin = (prop(options, 'origin') ?? {}) as { x?: number; y?: number };
    const defaultX = _defaults.origin?.x ?? 0.5;
    const defaultY = _defaults.origin?.y ?? 0.5;
    const x = isOk(origin.x) ? Number(origin.x) : Number(defaultX);
    const y = isOk(origin.y) ? Number(origin.y) : Number(defaultY);
    return { x, y };
}

/**
 * Définit la taille du canvas selon la fenêtre
 * Identique à canvas-confetti setCanvasWindowSize
 */
function setCanvasWindowSize(canvas: HTMLCanvasElement): void {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
}

/**
 * Définit la taille du canvas selon son rect
 * Identique à canvas-confetti setCanvasRectSize
 */
function setCanvasRectSize(canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

/**
 * Crée un canvas pour la fenêtre
 * Identique à canvas-confetti getCanvas
 */
function getCanvas(zIndex: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    // Forcer position: fixed avec !important pour éviter les conflits avec les styles CSS
    canvas.style.setProperty('position', 'fixed', 'important');
    canvas.style.setProperty('top', '0px', 'important');
    canvas.style.setProperty('left', '0px', 'important');
    canvas.style.setProperty('pointer-events', 'none', 'important');
    canvas.style.setProperty('z-index', String(zIndex), 'important');
    // S'assurer qu'aucune classe CSS ne surcharge nos styles
    canvas.removeAttribute('class');
    return canvas;
}

/**
 * Dessine une ellipse (fallback pour navigateurs sans support)
 * Identique à canvas-confetti ellipse
 */
function ellipse(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    antiClockwise?: boolean
): void {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.scale(radiusX, radiusY);
    context.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
    context.restore();
}

/**
 * Génère une physique aléatoire pour une particule
 * Identique à canvas-confetti randomPhysics
 */
interface ConfettiPhysicsInput {
    angle: number;
    spread: number;
    startVelocity: number;
    x: number;
    y: number;
    color: { r: number; g: number; b: number };
    shape: ConfettiShape;
    ticks: number;
    decay: number;
    drift: number;
    gravity: number;
    scalar: number;
    flat: boolean;
}

function randomPhysics(opts: ConfettiPhysicsInput): Fetti {
    const radAngle = opts.angle * (Math.PI / 180);
    const radSpread = opts.spread * (Math.PI / 180);

    return {
        x: opts.x,
        y: opts.y,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.min(0.11, Math.random() * 0.1 + 0.05),
        velocity: opts.startVelocity * 0.5 + Math.random() * opts.startVelocity,
        angle2D: -radAngle + (0.5 * radSpread - Math.random() * radSpread),
        tiltAngle: (Math.random() * (0.75 - 0.25) + 0.25) * Math.PI,
        color: opts.color,
        shape: opts.shape,
        tick: 0,
        totalTicks: opts.ticks,
        decay: opts.decay,
        drift: opts.drift,
        random: Math.random() + 2,
        tiltSin: 0,
        tiltCos: 0,
        wobbleX: 0,
        wobbleY: 0,
        gravity: opts.gravity * 3,
        ovalScalar: 0.6,
        scalar: opts.scalar,
        flat: opts.flat,
    };
}

/**
 * Met à jour une particule de confetti
 * Identique à canvas-confetti updateFetti
 */
function updateFetti(context: CanvasRenderingContext2D, fetti: Fetti): boolean {
    fetti.x += Math.cos(fetti.angle2D) * fetti.velocity + fetti.drift;
    fetti.y += Math.sin(fetti.angle2D) * fetti.velocity + fetti.gravity;
    fetti.velocity *= fetti.decay;

    if (fetti.flat) {
        fetti.wobble = 0;
        fetti.wobbleX = fetti.x + 10 * fetti.scalar;
        fetti.wobbleY = fetti.y + 10 * fetti.scalar;
        fetti.tiltSin = 0;
        fetti.tiltCos = 0;
        fetti.random = 1;
    } else {
        fetti.wobble += fetti.wobbleSpeed;
        fetti.wobbleX = fetti.x + 10 * fetti.scalar * Math.cos(fetti.wobble);
        fetti.wobbleY = fetti.y + 10 * fetti.scalar * Math.sin(fetti.wobble);
        fetti.tiltAngle += 0.1;
        fetti.tiltSin = Math.sin(fetti.tiltAngle);
        fetti.tiltCos = Math.cos(fetti.tiltAngle);
        fetti.random = Math.random() + 2;
    }

    const progress = fetti.tick++ / fetti.totalTicks;
    const x1 = fetti.x + fetti.random * fetti.tiltCos;
    const y1 = fetti.y + fetti.random * fetti.tiltSin;
    const x2 = fetti.wobbleX + fetti.random * fetti.tiltCos;
    const y2 = fetti.wobbleY + fetti.random * fetti.tiltSin;

    context.fillStyle = `rgba(${fetti.color.r}, ${fetti.color.g}, ${fetti.color.b}, ${1 - progress})`;
    context.beginPath();

    // Support des paths SVG (identique à canvas-confetti)
    if (
        canUsePaths &&
        typeof fetti.shape === 'object' &&
        fetti.shape.type === 'path' &&
        typeof fetti.shape.path === 'string' &&
        Array.isArray(fetti.shape.matrix)
    ) {
        context.fill(
            transformPath2D(
                fetti.shape.path,
                fetti.shape.matrix,
                fetti.x,
                fetti.y,
                Math.abs(x2 - x1) * 0.1,
                Math.abs(y2 - y1) * 0.1,
                (Math.PI / 10) * fetti.wobble
            )
        );
    }
    // Support des bitmaps (identique à canvas-confetti)
    else if (typeof fetti.shape === 'object' && fetti.shape.type === 'bitmap') {
        const rotation = (Math.PI / 10) * fetti.wobble;
        const scaleX = Math.abs(x2 - x1) * 0.1;
        const scaleY = Math.abs(y2 - y1) * 0.1;
        const width = fetti.shape.bitmap.width * fetti.scalar;
        const height = fetti.shape.bitmap.height * fetti.scalar;

        const matrix = new DOMMatrix([
            Math.cos(rotation) * scaleX,
            Math.sin(rotation) * scaleX,
            -Math.sin(rotation) * scaleY,
            Math.cos(rotation) * scaleY,
            fetti.x,
            fetti.y,
        ]);

        // Appliquer la matrice de transformation de la forme
        matrix.multiplySelf(new DOMMatrix(fetti.shape.matrix));

        const pattern = context.createPattern(
            bitmapMapper.transform(fetti.shape.bitmap) as CanvasImageSource,
            'no-repeat'
        );
        if (pattern) {
            pattern.setTransform(matrix);
            context.globalAlpha = 1 - progress;
            context.fillStyle = pattern;
            context.fillRect(fetti.x - width / 2, fetti.y - height / 2, width, height);
            context.globalAlpha = 1;
        }
    }
    // Support des cercles (identique à canvas-confetti)
    else if (fetti.shape === 'circle') {
        context.ellipse
            ? context.ellipse(
                fetti.x,
                fetti.y,
                Math.abs(x2 - x1) * fetti.ovalScalar,
                Math.abs(y2 - y1) * fetti.ovalScalar,
                (Math.PI / 10) * fetti.wobble,
                0,
                2 * Math.PI
            )
            : ellipse(
                context,
                fetti.x,
                fetti.y,
                Math.abs(x2 - x1) * fetti.ovalScalar,
                Math.abs(y2 - y1) * fetti.ovalScalar,
                (Math.PI / 10) * fetti.wobble,
                0,
                2 * Math.PI
            );
    }
    // Support des étoiles (identique à canvas-confetti)
    else if (fetti.shape === 'star') {
        let rot = (Math.PI / 2) * 3;
        const innerRadius = 4 * fetti.scalar;
        const outerRadius = 8 * fetti.scalar;
        let x = fetti.x;
        let y = fetti.y;
        let spikes = 5;
        const step = Math.PI / spikes;

        while (spikes--) {
            x = fetti.x + Math.cos(rot) * outerRadius;
            y = fetti.y + Math.sin(rot) * outerRadius;
            context.lineTo(x, y);
            rot += step;
            x = fetti.x + Math.cos(rot) * innerRadius;
            y = fetti.y + Math.sin(rot) * innerRadius;
            context.lineTo(x, y);
            rot += step;
        }
    }
    // Formes carrées par défaut (identique à canvas-confetti)
    else {
        context.moveTo(Math.floor(fetti.x), Math.floor(fetti.y));
        context.lineTo(Math.floor(fetti.wobbleX), Math.floor(y1));
        context.lineTo(Math.floor(x2), Math.floor(y2));
        context.lineTo(Math.floor(x1), Math.floor(fetti.wobbleY));
    }

    context.closePath();
    context.fill();

    return fetti.tick < fetti.totalTicks;
}

/**
 * Anime les confettis
 * Identique à canvas-confetti animate
 */
function animate(
    canvas: HTMLCanvasElement,
    fettis: Fetti[],
    resizer: (canvas: HTMLCanvasElement) => void,
    size: { width: number; height: number },
    done: () => void
): AnimationObject {
    let animatingFettis = fettis.slice();
    const context = canvas.getContext('2d')!;
    let animationFrame: number | null = null;
    let destroy: (() => void) | null = null;

    const promise = new Promise<void>((resolve) => {
        const onDone = () => {
            animationFrame = null;
            destroy = null;
            context.clearRect(0, 0, size.width, size.height);
            bitmapMapper.clear();
            done();
            resolve();
        };

        const update = () => {
            if (!size.width && !size.height) {
                resizer(canvas);
                size.width = canvas.width;
                size.height = canvas.height;
            }

            context.clearRect(0, 0, size.width, size.height);

            animatingFettis = animatingFettis.filter((fetti) => updateFetti(context, fetti));

            if (animatingFettis.length) {
                animationFrame = raf.frame(update);
            } else {
                onDone();
            }
        };

        animationFrame = raf.frame(update);
        destroy = onDone;
    });

    return {
        addFettis: (newFettis: Fetti[]) => {
            animatingFettis = animatingFettis.concat(newFettis);
            return promise;
        },
        canvas,
        promise,
        reset: () => {
            if (animationFrame !== null) {
                raf.cancel(animationFrame);
            }
            if (destroy) {
                destroy();
            }
        },
    };
}


/**
 * Enregistrement du Web Component k3ui-confetti
 * @description Permet l'utilisation de <k3ui-confetti> dans le HTML. Initialisation par AutoInit.
 */
if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-confetti')) {
    customElements.define('k3ui-confetti', class extends HTMLElement {
        private confettiInstance: Confetti | null = null;

        connectedCallback() {
            // L'initialisation sera geree par AutoInit
            // ou manuellement via K.Confetti.init(this)
            if (!this.hasAttribute('data-initialized')) {
                this.setAttribute('data-initialized', 'true');
            }
        }

        disconnectedCallback() {
            // Nettoyage lors de la suppression du DOM
            if (this.confettiInstance) {
                this.confettiInstance.destroy();
                this.confettiInstance = null;
            }
        }
    });
}
