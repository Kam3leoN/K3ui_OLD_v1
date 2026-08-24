/**
 * Configuration de l'environnement de test
 * @description Variables d'environnement pour les tests Jest (LOT 6 — polyfills jsdom)
 */

import { ensurePointerAndAnimatePolyfills } from './helpers/pointer-polyfill';
import { LoggerManager, LogLevel } from '../src/core/managers/LoggerManager';

ensurePointerAndAnimatePolyfills();

// LOT 8 : réduire le bruit console pendant Jest (les tests LoggerManager utilisent leurs propres instances)
LoggerManager.global.setLevel(LogLevel.ERROR);

// Simuler l'environnement navigateur
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Simuler ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Simuler IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Simuler requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// jsdom : SVGPathElement — forcer getTotalLength (Loader / morph / paths dynamiques)
if (typeof SVGPathElement !== 'undefined') {
    SVGPathElement.prototype.getTotalLength = function getTotalLength(): number {
        return 100;
    };
    SVGPathElement.prototype.getPointAtLength = function getPointAtLength(distance: number): DOMPoint {
        return { x: distance, y: 0 } as DOMPoint;
    };
}

// jsdom : scrollIntoView (Command, listes, etc.)
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = jest.fn();
} else if (typeof Element !== 'undefined') {
    Element.prototype.scrollIntoView = jest.fn();
}

// jsdom : contexte canvas 2D (Chart, etc.)
function createMockCanvas2dContext(): CanvasRenderingContext2D {
    return {
        canvas: document.createElement('canvas'),
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        fillText: jest.fn(),
        measureText: jest.fn(() => ({ width: 0 })),
        beginPath: jest.fn(),
        closePath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        fill: jest.fn(),
        arc: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        scale: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        setTransform: jest.fn(),
        drawImage: jest.fn(),
        getImageData: jest.fn(),
        putImageData: jest.fn(),
        createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
        createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
        roundRect: jest.fn(),
    } as unknown as CanvasRenderingContext2D;
}

HTMLCanvasElement.prototype.getContext = function getContext(
    type: string
): RenderingContext | null {
    if (type === '2d') {
        return createMockCanvas2dContext();
    }
    return null;
};

// Paths SVG créés via createElementNS (morph Loader) — héritent parfois sans getTotalLength
const originalCreateElementNS = Document.prototype.createElementNS;
Document.prototype.createElementNS = function createElementNS(
    namespaceURI: string,
    qualifiedName: string
): Element {
    const el = originalCreateElementNS.call(this, namespaceURI, qualifiedName);
    if (qualifiedName === 'path' && namespaceURI.includes('svg')) {
        const path = el as SVGPathElement;
        path.getTotalLength = () => 100;
        path.getPointAtLength = (distance: number) => ({ x: distance, y: 0 }) as DOMPoint;
    }
    return el;
};

// Simuler les événements de clavier
Object.defineProperty(window, 'KeyboardEvent', {
    writable: true,
    value: class KeyboardEvent extends Event {
        key: string;
        code: string;
        ctrlKey: boolean;
        shiftKey: boolean;
        altKey: boolean;
        metaKey: boolean;

        constructor(type: string, eventInitDict?: KeyboardEventInit) {
            super(type, eventInitDict);
            this.key = eventInitDict?.key || '';
            this.code = eventInitDict?.code || '';
            this.ctrlKey = eventInitDict?.ctrlKey || false;
            this.shiftKey = eventInitDict?.shiftKey || false;
            this.altKey = eventInitDict?.altKey || false;
            this.metaKey = eventInitDict?.metaKey || false;
        }
    }
});

// Simuler localStorage (stockage en mémoire pour les tests)
const localStorageStore = new Map<string, string>();
const localStorageMock = {
    getItem: jest.fn((key: string) => (localStorageStore.has(key) ? localStorageStore.get(key)! : null)),
    setItem: jest.fn((key: string, value: string) => {
        localStorageStore.set(key, String(value));
    }),
    removeItem: jest.fn((key: string) => {
        localStorageStore.delete(key);
    }),
    clear: jest.fn(() => {
        localStorageStore.clear();
    }),
    get length() {
        return localStorageStore.size;
    },
    key: jest.fn((index: number) => Array.from(localStorageStore.keys())[index] ?? null),
};
// Mettre aussi sur globalThis pour que `localStorage` soit accessible comme variable globale
Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
});
// Et sur window si on est dans un environnement jsdom
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
        configurable: true,
    });
}

// Simuler sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
};
Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true,
});

// Polyfill pour crypto.randomUUID
if (!global.crypto || !global.crypto.randomUUID) {
    const cryptoRef = globalThis.crypto ?? {};
    Object.defineProperty(globalThis, 'crypto', {
        value: {
            ...cryptoRef,
            randomUUID: () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        },
        writable: true,
        configurable: true,
    });
}