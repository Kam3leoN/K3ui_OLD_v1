/**
 * @fileoverview Utilitaires de sanitization DOM/HTML
 */

const DANGEROUS_ATTR_PREFIX = 'on';
const URL_ATTRS = new Set(['href', 'src', 'xlink:href']);
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:', '#', '/'];

export function escapeHtml(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isSafeUrl(value: string): boolean {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return true;
    if (ALLOWED_PROTOCOLS.some((p) => trimmed.startsWith(p))) return true;
    return !trimmed.includes(':');
}

export function sanitizeHtmlFragment(
    input: string,
    allowedTags: Set<string>,
    allowedAttrsByTag: Record<string, Set<string>> = {},
): string {
    const root = document.createElement('div');
    root.innerHTML = input;

    const isAttrAllowed = (name: string, allowedAttrs: Set<string>): boolean => {
        if (allowedAttrs.has(name)) return true;
        for (const pattern of allowedAttrs) {
            if (pattern.endsWith('*') && name.startsWith(pattern.slice(0, -1))) {
                return true;
            }
        }
        return false;
    };

    const sanitizeNode = (node: Node): void => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (!allowedTags.has(tag)) {
            const frag = document.createDocumentFragment();
            while (el.firstChild) frag.appendChild(el.firstChild);
            el.parentNode?.replaceChild(frag, el);
            Array.from(frag.childNodes).forEach(sanitizeNode);
            return;
        }

        const allowedAttrs = allowedAttrsByTag[tag] ?? new Set<string>();
        Array.from(el.attributes).forEach((attr) => {
            const name = attr.name.toLowerCase();
            const value = attr.value ?? '';

            if (name.startsWith(DANGEROUS_ATTR_PREFIX)) {
                el.removeAttribute(attr.name);
                return;
            }

            if (!isAttrAllowed(name, allowedAttrs)) {
                el.removeAttribute(attr.name);
                return;
            }

            if (URL_ATTRS.has(name) && !isSafeUrl(value)) {
                el.removeAttribute(attr.name);
            }
        });

        Array.from(el.childNodes).forEach(sanitizeNode);
    };

    Array.from(root.childNodes).forEach(sanitizeNode);
    return root.innerHTML;
}

