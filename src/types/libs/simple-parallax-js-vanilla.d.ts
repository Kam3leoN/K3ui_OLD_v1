/**
 * Déclarations TypeScript pour simple-parallax-js/vanilla (moduleResolution node).
 */
declare module 'simple-parallax-js/vanilla' {
    type ParallaxOrientation =
        | 'up'
        | 'right'
        | 'down'
        | 'left'
        | 'up left'
        | 'up right'
        | 'down left'
        | 'down right';

    interface SimpleParallaxSettings {
        delay?: number;
        maxTransition?: number;
        orientation?: ParallaxOrientation;
        overflow?: boolean;
        scale?: number;
        transition?: string;
        customContainer?: string | HTMLElement;
        customWrapper?: string;
    }

    export default class SimpleParallax {
        constructor(
            elements: string | Element | NodeList | HTMLCollection | Element[],
            options?: Partial<SimpleParallaxSettings>
        );
        refresh(): void;
        destroy(): void;
    }
}
