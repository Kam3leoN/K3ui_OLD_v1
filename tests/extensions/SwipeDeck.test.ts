/// <reference types="@types/jest" />
/**
 * Tests unitaires SwipeDeck
 */

import { SwipeDeck } from '../../src/extensions/gestures/swipe-deck/SwipeDeck';

describe('SwipeDeck', () => {
    let host: HTMLElement;

    beforeEach(() => {
        host = document.createElement('div');
        host.className = 'swipe-deck';
        for (let i = 0; i < 3; i++) {
            const card = document.createElement('div');
            card.className = 'swipe-deck__card';
            card.textContent = `Card ${i}`;
            host.appendChild(card);
        }
        document.body.appendChild(host);
    });

    afterEach(() => {
        const instance = SwipeDeck.getInstance(host);
        instance?.destroy();
        host.remove();
    });

    test('init crée une instance', () => {
        const deck = SwipeDeck.init(host) as SwipeDeck;
        expect(deck).toBeInstanceOf(SwipeDeck);
        expect(deck.getRemainingCount()).toBe(3);
    });

    test('swipe left réduit la pile', () => {
        jest.useFakeTimers();
        const onSwipeLeft = jest.fn();
        const deck = SwipeDeck.init(host, { onSwipeLeft }) as SwipeDeck;
        deck.swipe('left');
        jest.advanceTimersByTime(300);
        expect(deck.getRemainingCount()).toBe(2);
        expect(onSwipeLeft).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test('undo restaure une carte', () => {
        jest.useFakeTimers();
        const deck = SwipeDeck.init(host, { allowUndo: true }) as SwipeDeck;
        deck.swipe('right');
        jest.advanceTimersByTime(300);
        expect(deck.getRemainingCount()).toBe(2);
        expect(deck.undo()).toBe(true);
        expect(deck.getRemainingCount()).toBe(3);
        jest.useRealTimers();
    });
});
