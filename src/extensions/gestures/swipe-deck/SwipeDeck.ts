/**
 * @fileoverview SwipeDeck — pile de cartes swipables (gesture)
 * @description Extension K3UI utilisant GestureManager + MotionManager + Stack.layoutDeck
 */

import { Component } from '../../../core/base/Component';
import { toComponentClassDef } from '../../../types/components/component-base';
import type { SwipeDeckOptions } from '../../../types/components';
import { PriorityLevel, KElement, InitElements } from '../../../types/base';
import { setAriaAttributes } from '../../../utils/dom/aria';
import { LocaleManager } from '../../../core/managers';
import { Gesture } from '../../../core/managers/GestureManager';
import { MotionManager } from '../../../core/managers/MotionManager';
import type { GesturePanDetail } from '../../../types/managers/gesture';
import type { SwipeDirection } from '../../../types/base/dom';
import { getSwipeDeckDefaults } from '../../../specs/components/swipe-deck.specs';
import { Stack } from '../../../components/Stack';

const _defaults: SwipeDeckOptions = getSwipeDeckDefaults();

interface SwipedCardSnapshot {
    el: HTMLElement;
    parent: Node;
    nextSibling: ChildNode | null;
}

/**
 * Pile de cartes avec swipe gauche / droite / haut.
 */
export class SwipeDeck extends Component<SwipeDeckOptions> {
    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    /** Offset Y par couche — Stack deck compact (shadcn) */
    private static readonly STACK_OFFSET = 6;
    private static readonly STACK_SCALE_STEP = 0.05;
    private static readonly STACK_OPACITY_STEP = 0;

    private gesture: Gesture | null = null;
    private cards: HTMLElement[] = [];
    private history: SwipedCardSnapshot[] = [];
    private animating = false;

    static get defaults(): SwipeDeckOptions {
        return { ..._defaults };
    }

    static getInstance(el: HTMLElement): SwipeDeck | undefined {
        return Component.getInstance(el) as SwipeDeck | undefined;
    }

    static init(
        els: KElement | InitElements<KElement> | string,
        options: Partial<SwipeDeckOptions> = {}
    ): SwipeDeck | SwipeDeck[] {
        return Component.init(els, options, toComponentClassDef(SwipeDeck)) as
            | SwipeDeck
            | SwipeDeck[];
    }

    constructor(el: HTMLElement, options: Partial<SwipeDeckOptions> = {}) {
        super(el, options, toComponentClassDef(SwipeDeck));
        this.options = { ...SwipeDeck.defaults, ...options };
        this.setupDom();
        this.refreshCards();
        this.attachGesture();
        this.options.onOpenEnd?.(this.el);
    }

    private setupDom(): void {
        this.el.classList.add('swipe-deck', 'stack', 'stack--deck', 'stack--direction-bottom');
        this.el.style.setProperty('--k3ui-stack-offset', `${SwipeDeck.STACK_OFFSET}px`);
        this.el.style.setProperty(
            '--k3ui-stack-depth',
            String(Math.min(this.options.stackDepth, 3))
        );
        this.el.style.setProperty('--k3ui-stack-scale-step', String(SwipeDeck.STACK_SCALE_STEP));
        this.el.style.setProperty('--k3ui-stack-opacity-step', String(SwipeDeck.STACK_OPACITY_STEP));
        setAriaAttributes(this.el, {
            role: 'group',
            label: LocaleManager.t('swipedeck.ariaLabel'),
        });
    }

    private refreshCards(): void {
        this.cards = Array.from(
            this.el.querySelectorAll<HTMLElement>(
                ':scope > .swipe-deck__card, :scope > [data-swipe-card], :scope > .stack__item'
            )
        );
        Stack.layoutDeck(this.cards, {
            depth: Math.min(this.options.stackDepth, 3),
            offset: SwipeDeck.STACK_OFFSET,
            scaleStep: SwipeDeck.STACK_SCALE_STEP,
            opacityStep: SwipeDeck.STACK_OPACITY_STEP,
            direction: 'bottom',
        });
    }

    private getTopCard(): HTMLElement | null {
        return this.cards[0] ?? null;
    }

    private attachGesture(): void {
        const top = this.getTopCard();
        if (!top) {
            return;
        }
        this.gesture?.destroy();
        this.gesture = new Gesture({
            target: top,
            panThreshold: 8,
            swipeThreshold: this.options.threshold,
            preventDefault: true,
            onPan: (detail) => this.onPan(detail),
            onPanEnd: (detail) => this.onPanEnd(detail),
            onSwipe: (direction) => this.handleSwipe(direction),
        });
    }

    private onPan(detail: GesturePanDetail): void {
        if (this.animating || MotionManager.isReducedMotion()) {
            return;
        }
        const card = this.getTopCard();
        if (!card) {
            return;
        }
        const rot = detail.dx * this.options.rotationFactor;
        card.style.transform = `translate(${detail.dx}px, ${detail.dy}px) rotate(${rot}deg)`;
        card.style.transition = 'none';
    }

    private onPanEnd(detail: GesturePanDetail): void {
        if (this.animating) {
            return;
        }
        const card = this.getTopCard();
        if (!card) {
            return;
        }
        const absX = Math.abs(detail.dx);
        const absY = Math.abs(detail.dy);
        if (absX < this.options.threshold && absY < this.options.threshold) {
            card.style.transition = 'transform 200ms ease-out';
            card.style.transform = '';
        }
    }

    private handleSwipe(direction: SwipeDirection): void {
        if (direction === 'down') {
            const card = this.getTopCard();
            if (card) {
                card.style.transition = 'transform 200ms ease-out';
                card.style.transform = '';
            }
            return;
        }
        this.swipe(direction);
    }

    /**
     * Swipe programmatique de la carte du dessus
     */
    swipe(direction: 'left' | 'right' | 'up'): void {
        if (this.animating) {
            return;
        }
        const card = this.getTopCard();
        if (!card) {
            this.options.onStackEmpty?.(this);
            return;
        }

        this.animating = true;
        this.options.onCloseStart?.(card);

        const reduced = MotionManager.isReducedMotion();
        const exitX = direction === 'left' ? -window.innerWidth : direction === 'right' ? window.innerWidth : 0;
        const exitY = direction === 'up' ? -window.innerHeight : 0;
        const rot = direction === 'left' ? -30 : direction === 'right' ? 30 : 0;

        const finish = (): void => {
            this.history.push({
                el: card,
                parent: card.parentNode as Node,
                nextSibling: card.nextSibling,
            });
            card.remove();
            this.cards.shift();
            this.animating = false;
            this.options.onCloseEnd?.(card);

            if (direction === 'left') {
                this.options.onSwipeLeft?.(card, this);
            } else if (direction === 'right') {
                this.options.onSwipeRight?.(card, this);
            } else {
                this.options.onSwipeUp?.(card, this);
            }

            if (this.cards.length === 0) {
                this.options.onStackEmpty?.(this);
                this.gesture?.destroy();
                this.gesture = null;
            } else {
                this.refreshCards();
                this.attachGesture();
            }
        };

        if (reduced) {
            finish();
            return;
        }

        card.style.transition = 'transform 280ms ease-in, opacity 280ms ease-in';
        card.style.transform = `translate(${exitX}px, ${exitY}px) rotate(${rot}deg)`;
        card.style.opacity = '0';
        window.setTimeout(finish, 290);
    }

    /**
     * Restaure la dernière carte swipée
     */
    undo(): boolean {
        if (!this.options.allowUndo || this.history.length === 0 || this.animating) {
            return false;
        }
        const snap = this.history.pop()!;
        if (snap.nextSibling && snap.parent.contains(snap.nextSibling)) {
            snap.parent.insertBefore(snap.el, snap.nextSibling);
        } else {
            snap.parent.appendChild(snap.el);
        }
        snap.el.style.transition = '';
        snap.el.style.transform = '';
        snap.el.style.opacity = '1';
        this.refreshCards();
        this.attachGesture();
        return true;
    }

    /** Nombre de cartes restantes */
    getRemainingCount(): number {
        return this.cards.length;
    }

    override destroy(): void {
        this.gesture?.destroy();
        this.gesture = null;
        this.el.classList.remove('stack', 'stack--deck', 'stack--direction-bottom');
        this.history = [];
        this.options.onCloseEnd?.(this.el);
        super.destroy();
    }
}

export type { SwipeDeckOptions };
