/**
 * Helpers d’initialisation composant pour Jest (LOT 6).
 */

/**
 * Exécute les `setTimeout(0)` de `Component` (hook `onInit`) après construction.
 * À appeler quand les timers réels sont actifs (défaut LOT 6).
 */
export async function flushComponentInit(): Promise<void> {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
    });
}

/**
 * Active les fake timers, flush les timers en attente, puis repasse en timers réels.
 */
export function withFakeTimersRun(fn: () => void): void {
    jest.useFakeTimers();
    try {
        fn();
        jest.runOnlyPendingTimers();
    } finally {
        jest.useRealTimers();
    }
}

/**
 * Attend la passe différée AutoInit (`setTimeout(0)` + microtasks + import dynamique).
 */
export async function flushDeferredAutoInit(maxWaitMs = 500): Promise<void> {
    await flushComponentInit();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
        await new Promise<void>((resolve) => setTimeout(resolve, 25));
    }
}
