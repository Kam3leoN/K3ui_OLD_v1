/**
 * Helpers pour enregistrer des mocks dans ComponentRegistry (LOT 5).
 */
import type { Component } from '../../src/core/base/Component';
import type { BaseOptions } from '../../src/types/base';

/** Adapte un mock minimal pour `ComponentRegistry.register`. */
export function asRegistryComponent<T extends { destroy(): void }>(mock: T): Component<BaseOptions> {
    return mock as unknown as Component<BaseOptions>;
}
