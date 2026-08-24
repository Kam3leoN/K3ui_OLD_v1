import { createCoords } from '../../core/utils';
import { getWindow, isWebKit } from '../../utils-dom';

export function getVisualOffsets(element: Element): { x: number; y: number } {
    const win = getWindow(element);
    if (!isWebKit() || !win.visualViewport) {
        return createCoords(0);
    }
    return {
        x: win.visualViewport.offsetLeft,
        y: win.visualViewport.offsetTop,
    };
}
