import { createCoords, round } from '../../core/utils';
import { isHTMLElement } from '../../utils-dom';
import type { VirtualElement } from '../types';
import { getCssDimensions } from './getCssDimensions';
import { unwrapElement } from './unwrapElement';

export function getScale(element: Element | VirtualElement): { x: number; y: number } {
    const domElement = unwrapElement(element as VirtualElement);
    if (!isHTMLElement(domElement)) {
        return createCoords(1);
    }
    const rect = domElement.getBoundingClientRect();
    const { width, height, $ } = getCssDimensions(domElement);
    let x = ($ ? round(rect.width) : rect.width) / width;
    let y = ($ ? round(rect.height) : rect.height) / height;
    if (!x || !Number.isFinite(x)) x = 1;
    if (!y || !Number.isFinite(y)) y = 1;
    return { x, y };
}
