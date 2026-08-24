import { isElement } from '../../utils-dom';
import type { VirtualElement } from '../types';

export function unwrapElement(element: Element | VirtualElement): Element {
    return !isElement(element)
        ? (element as VirtualElement).contextElement!
        : (element as Element);
}
