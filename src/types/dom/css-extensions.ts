/** Propriétés CSS legacy encore utilisées par Signature / navigateurs anciens. */
export type LegacyCanvasStyle = CSSStyleDeclaration & {
    msTouchAction?: string;
    webkitUserSelect?: string;
};

/** Applique `touch-action` et variantes vendor sur un canvas de signature. */
export function applySignatureTouchStyle(
    style: CSSStyleDeclaration,
    touchAction: 'none' | 'auto'
): void {
    const legacy = style as LegacyCanvasStyle;
    legacy.touchAction = touchAction;
    legacy.msTouchAction = touchAction;
    legacy.userSelect = touchAction === 'none' ? 'none' : 'auto';
    legacy.webkitUserSelect = touchAction === 'none' ? 'none' : 'auto';
}
