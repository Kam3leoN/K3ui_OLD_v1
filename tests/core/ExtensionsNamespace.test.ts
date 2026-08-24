/// <reference types="@types/jest" />
/**
 * Tests namespace K.Extensions
 */

import {
    attachDeferredComponentsToK,
    attachExtensionNamespace,
    resetDeferredComponentsLoadCache,
} from '../../src/core/autoinit/deferred-component-loaders';

describe('K.Extensions namespace', () => {
    beforeEach(() => {
        resetDeferredComponentsLoadCache();
        (window as unknown as { K: Record<string, unknown> }).K = {
            Extensions: {},
        };
    });

    test('attachExtensionNamespace mirror les classes chargées', () => {
        const FakeQr = { name: 'QrCode' };
        const K = (window as unknown as { K: Record<string, unknown> }).K;
        attachExtensionNamespace({ QrCode: FakeQr }, K);
        expect(K.Extensions).toBeDefined();
        expect((K.Extensions as Record<string, unknown>).QrCode).toBe(FakeQr);
    });

    test('attachDeferredComponentsToK remplit flat + Extensions', () => {
        const FakeSnow = { name: 'Snow' };
        attachDeferredComponentsToK({ Snow: FakeSnow });
        const K = (window as unknown as { K: Record<string, unknown> }).K;
        expect(K.Snow).toBe(FakeSnow);
        expect((K.Extensions as Record<string, unknown>).Snow).toBe(FakeSnow);
        expect(K.Snow).toBe((K.Extensions as Record<string, unknown>).Snow);
    });
});
