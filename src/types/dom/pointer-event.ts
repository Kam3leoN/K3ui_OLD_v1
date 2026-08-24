/** `PointerEvent` étendu (Safari / appareils avec identifiant persistant). */
export interface PointerEventWithPersistentId extends PointerEvent {
    persistentDeviceId?: number;
}

/**
 * Identifiant stable du pointeur pour le tracé signature.
 * @param event - Événement pointer
 */
export function getSignaturePointerId(event: PointerEvent): number {
    const extended = event as PointerEventWithPersistentId;
    return extended.persistentDeviceId ?? event.pointerId;
}
