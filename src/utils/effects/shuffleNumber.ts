/**
 * @fileoverview Animation ShuffleNumber — roulement vertical caractère par caractère
 * @description Portage interne K3UI inspiré de NumberFlow (sans dépendance externe)
 * @see https://number-flow.barvian.me/
 */

/** Classes CSS utilisées par l'animation */
export const SHUFFLE_NUMBER_CSS = {
    root: 'shuffle-number',
    char: 'shuffle-number__char',
    sizer: 'shuffle-number__char-sizer',
    face: 'shuffle-number__char-face',
    resizing: 'shuffle-number__char--resizing',
    prefix: 'shuffle-number__prefix',
    suffix: 'shuffle-number__suffix',
    willChange: 'shuffle-number--will-change',
} as const;

/** @deprecated Utiliser SHUFFLE_NUMBER_CSS */
export const SLOT_CSS = SHUFFLE_NUMBER_CSS;

/** Direction du roulement */
export type ShuffleNumberDirection = 'up' | 'down';

/** Fonction de couleur par index */
export type ShuffleNumberColorFn = (index: number, total: number) => string;

/** Options d'animation */
export interface ShuffleNumberAnimationOptions {
    direction?: ShuffleNumberDirection;
    stagger?: number;
    duration?: number;
    exitOffset?: number;
    easing?: string;
    bounce?: number;
    color?: string | ShuffleNumberColorFn;
    colorFade?: number;
    skipUnchanged?: boolean;
    interrupt?: boolean;
    /** Passe par les chiffres intermédiaires (plugin continuous NumberFlow) */
    continuous?: boolean;
    onStart?: () => void;
    onFinish?: () => void;
}

/** Options du helper chromatic */
export interface ShuffleNumberChromaticOptions {
    from?: number;
    spread?: number;
    saturation?: number;
    lightness?: number;
}

const DEFAULTS: Required<
    Omit<ShuffleNumberAnimationOptions, 'color' | 'onStart' | 'onFinish' | 'continuous'>
> & {
    color?: string | ShuffleNumberColorFn;
    continuous: boolean;
} = {
    direction: 'down',
    stagger: 45,
    duration: 300,
    exitOffset: 50,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 0.6,
    colorFade: 280,
    skipUnchanged: true,
    interrupt: true,
    continuous: false,
};

const NBSP = '\u00A0';
const DIGIT_RE = /^\d$/;

interface ShuffleRunState {
    timers: number[];
    target: string;
    pending?: { text: string; options: ShuffleNumberAnimationOptions };
}

const states = new WeakMap<HTMLElement, ShuffleRunState>();

const glyph = (char: string): string => (char === ' ' ? NBSP : char);

/**
 * Construit une fonction de couleur arc-en-ciel par caractère.
 * @param options - Paramètres HSL
 * @returns Fonction (index, total) => couleur CSS
 */
export function chromatic({
    from = 0,
    spread = 320,
    saturation = 92,
    lightness = 60,
}: ShuffleNumberChromaticOptions = {}): ShuffleNumberColorFn {
    return (index: number, total: number) => {
        const t = total <= 1 ? 0 : index / (total - 1);
        return `hsl(${(from + t * spread) % 360} ${saturation}% ${lightness}%)`;
    };
}

/** Annule l'animation en cours et fige le texte cible. */
function settle(container: HTMLElement): void {
    const state = states.get(container);
    if (!state) return;
    state.timers.forEach((t) => window.clearTimeout(t));
    states.delete(container);
    buildShuffleNumber(container, state.target);
}

function makeFace(char: string): HTMLSpanElement {
    const face = document.createElement('span');
    face.className = SHUFFLE_NUMBER_CSS.face;
    face.textContent = glyph(char);
    return face;
}

function buildChar(char: string): HTMLSpanElement {
    const cell = document.createElement('span');
    cell.className = SHUFFLE_NUMBER_CSS.char;
    cell.dataset.char = char;

    const sizer = document.createElement('span');
    sizer.className = SHUFFLE_NUMBER_CSS.sizer;
    sizer.textContent = glyph(char);

    cell.append(sizer, makeFace(char));
    return cell;
}

/**
 * Construit le DOM pour un texte donné.
 * @param container - Élément hôte
 * @param text - Texte à afficher
 */
export function buildShuffleNumber(container: HTMLElement, text: string): void {
    if (!container.hasAttribute('data-shuffle-value')) {
        container.classList.add(SHUFFLE_NUMBER_CSS.root);
    }
    container.replaceChildren(...Array.from(text, buildChar));
}

/** @deprecated Utiliser buildShuffleNumber */
export const buildSlotText = buildShuffleNumber;

/**
 * Liste les faces intermédiaires pour un passage continuous entre deux chiffres.
 * Inclut le caractère de départ en tête pour un strip fluide.
 */
function continuousSequence(
    fromChar: string,
    toChar: string,
    direction: ShuffleNumberDirection
): string[] {
    if (!DIGIT_RE.test(fromChar) || !DIGIT_RE.test(toChar) || fromChar === toChar) {
        return [toChar];
    }
    const from = Number(fromChar);
    const to = Number(toChar);
    const step = direction === 'down' ? 1 : -1;
    const seq: string[] = [fromChar];
    let cur = from;
    for (let n = 0; n < 9; n++) {
        cur = (cur + step + 10) % 10;
        seq.push(String(cur));
        if (cur === to) break;
    }
    return seq;
}

/**
 * Anime le passage vers un nouveau texte.
 * @param container - Élément hôte
 * @param toText - Texte cible
 * @param options - Options d'animation
 */
export function animateShuffleNumber(
    container: HTMLElement,
    toText: string,
    options: ShuffleNumberAnimationOptions = {}
): void {
    const {
        direction,
        stagger,
        duration,
        exitOffset,
        easing,
        bounce,
        color,
        colorFade,
        skipUnchanged,
        interrupt,
        continuous,
        onStart,
        onFinish,
    } = { ...DEFAULTS, ...options };

    const running = states.get(container);
    if (running && !interrupt) {
        if (toText !== running.target) {
            running.pending = { text: toText, options };
        }
        return;
    }

    settle(container);

    if (!container.querySelector(`.${SHUFFLE_NUMBER_CSS.char}`)) {
        buildShuffleNumber(container, toText);
        onFinish?.();
        return;
    }

    const cells = Array.from(
        container.querySelectorAll<HTMLElement>(`.${SHUFFLE_NUMBER_CSS.char}`)
    );
    const fromText = cells.map((s) => s.dataset.char ?? '').join('');

    if (!interrupt && fromText === toText) {
        onFinish?.();
        return;
    }

    onStart?.();

    const maxLen = Math.max(fromText.length, toText.length);
    const sample = cells.find((s) => (s.dataset.char ?? '') !== '') ?? cells[0];
    const cs = getComputedStyle(container);
    const H =
        Math.ceil(
            sample?.getBoundingClientRect().height ||
                sample?.offsetHeight ||
                container.getBoundingClientRect().height ||
                parseFloat(cs.lineHeight) ||
                0
        ) ||
        Math.ceil(parseFloat(cs.fontSize) * 1.3) ||
        18;

    const restColor = color ? cs.color : '';

    for (let i = cells.length; i < maxLen; i++) {
        const cell = buildChar('');
        container.appendChild(cell);
        cells.push(cell);
    }

    const timers: number[] = [];
    const state: ShuffleRunState = { timers, target: toText };
    states.set(container, state);

    const outY = direction === 'down' ? H : -H;
    const inStart = direction === 'down' ? -H : H;

    const wobble = (i: number, salt: number): number => {
        const n = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    };

    let maxEnd = 0;

    for (let i = 0; i < maxLen; i++) {
        const fromChar = fromText[i] || '';
        const toChar = toText[i] || '';
        if (fromChar === toChar && (skipUnchanged || fromChar === '')) continue;

        const cell = cells[i];
        const sizer = cell.querySelector<HTMLElement>(`.${SHUFFLE_NUMBER_CSS.sizer}`);
        const oldFace = cell.querySelector<HTMLElement>(`.${SHUFFLE_NUMBER_CSS.face}`);
        if (!sizer) continue;

        const useContinuous =
            continuous &&
            DIGIT_RE.test(fromChar) &&
            DIGIT_RE.test(toChar) &&
            fromChar !== toChar;

        const oldW = cell.getBoundingClientRect().width;
        sizer.textContent = glyph(toChar);
        const newW = sizer.getBoundingClientRect().width;
        const widthChanges = Math.abs(newW - oldW) > 0.5;
        if (widthChanges) cell.style.width = `${oldW}px`;

        if (fromChar === '' || toChar === '') cell.classList.add(SHUFFLE_NUMBER_CSS.resizing);

        const tint = typeof color === 'function' ? color(i, maxLen) : color;
        const isTail = toChar === '';
        const seq = useContinuous
            ? continuousSequence(fromChar, toChar, direction)
            : [toChar];
        const steps = Math.max(1, seq.length - (useContinuous ? 1 : 0));
        const d = Math.round(
            duration * (isTail ? 0.75 : 1) * (useContinuous ? Math.max(1, steps * 0.55) : 1) *
                (1 + bounce * 0.45 * wobble(i, 1))
        );
        const staggerIndex = isTail ? toText.length * 0.5 + (i - toText.length) * 0.25 : i;
        const base = Math.round(staggerIndex * stagger * (1 + bounce * 0.25 * wobble(i, 2)));
        const tilt = (bounce * 5 * wobble(i, 3)).toFixed(2);
        const rollTrans = `transform ${d}ms ${easing}`;
        const trans = color ? `${rollTrans}, color ${colorFade}ms linear ${d}ms` : rollTrans;

        if (widthChanges) {
            let wDelay = base;
            let wDur = d;
            if (isTail) {
                wDelay = base + Math.round(d * 0.55);
                wDur = Math.max(140, Math.round(d * 0.6));
            } else if (fromChar === '') {
                wDur = Math.max(140, Math.round(d * 0.45));
            }
            timers.push(
                window.setTimeout(() => {
                    cell.style.transition = `width ${wDur}ms cubic-bezier(0.2, 0, 0, 1)`;
                    cell.style.width = `${newW}px`;
                }, wDelay)
            );
            maxEnd = Math.max(maxEnd, wDelay + wDur);
        }

        maxEnd = Math.max(maxEnd, base + exitOffset + d + (color ? colorFade : 0));

        if (useContinuous && oldFace) {
            // Strip unique : un seul translateY fluide (pas de faces empilées)
            const ordered = direction === 'down' ? [...seq].reverse() : seq;
            const startY = direction === 'down' ? -(ordered.length - 1) * H : 0;
            const endY = direction === 'down' ? 0 : -(ordered.length - 1) * H;

            const strip = document.createElement('span');
            strip.className = SHUFFLE_NUMBER_CSS.face;
            strip.style.display = 'flex';
            strip.style.flexDirection = 'column';
            strip.style.alignItems = 'center';
            strip.style.top = '0';
            strip.style.left = '0';
            strip.style.right = '0';
            strip.style.bottom = 'auto';
            strip.style.height = `${ordered.length * H}px`;
            strip.style.transformOrigin = '50% 0';
            strip.style.transform = `translateY(${startY}px)`;
            if (tint) strip.style.color = tint;

            ordered.forEach((ch) => {
                const row = document.createElement('span');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.justifyContent = 'center';
                row.style.height = `${H}px`;
                row.style.width = '100%';
                row.textContent = glyph(ch);
                strip.appendChild(row);
            });

            oldFace.remove();
            cell.appendChild(strip);
            void cell.offsetWidth;

            timers.push(
                window.setTimeout(() => {
                    strip.style.transition = trans;
                    strip.style.transform = `translateY(${endY}px)`;
                    if (color) strip.style.color = restColor;
                    const done = (e: TransitionEvent) => {
                        if (e.propertyName !== 'transform') return;
                        strip.removeEventListener('transitionend', done);
                        cell.dataset.char = toChar;
                        cell.style.removeProperty('transition');
                        cell.style.removeProperty('width');
                        cell.classList.remove(SHUFFLE_NUMBER_CSS.resizing);
                        const keepSizer =
                            cell.querySelector<HTMLElement>(`.${SHUFFLE_NUMBER_CSS.sizer}`) ??
                            sizer;
                        keepSizer.textContent = glyph(toChar);
                        cell.replaceChildren(keepSizer, makeFace(toChar));
                    };
                    strip.addEventListener('transitionend', done);
                }, base)
            );
            continue;
        }

        // Roulement classique : une face sort, une entre (fluide)
        if (oldFace) {
            timers.push(
                window.setTimeout(() => {
                    oldFace.style.transition = rollTrans;
                    oldFace.style.transform = `translateY(${outY}px) rotate(${-Number(tilt)}deg)`;
                }, base)
            );
        }

        timers.push(
            window.setTimeout(() => {
                const newFace = makeFace(toChar);
                newFace.style.transformOrigin = '50% 50%';
                newFace.style.transform = `translateY(${inStart}px) rotate(${tilt}deg)`;
                if (tint) newFace.style.color = tint;
                cell.appendChild(newFace);
                void cell.offsetWidth;

                newFace.style.transition = trans;
                newFace.style.transform = 'translateY(0) rotate(0deg)';
                if (color) newFace.style.color = restColor;

                const done = (e: TransitionEvent) => {
                    if (e.propertyName !== 'transform') return;
                    newFace.removeEventListener('transitionend', done);
                    cell.dataset.char = toChar;
                    cell.style.removeProperty('transition');
                    cell.style.removeProperty('width');
                    cell.classList.remove(SHUFFLE_NUMBER_CSS.resizing);
                    cell.querySelectorAll(`.${SHUFFLE_NUMBER_CSS.face}`).forEach((f) => {
                        if (f !== newFace) f.remove();
                    });
                };
                newFace.addEventListener('transitionend', done);
            }, base + exitOffset)
        );
    }

    const total = maxEnd + 80;
    timers.push(
        window.setTimeout(() => {
            const pending = state.pending;
            states.delete(container);
            buildShuffleNumber(container, toText);
            onFinish?.();
            if (pending) {
                animateShuffleNumber(container, pending.text, pending.options);
            }
        }, total)
    );
}

/** @deprecated Utiliser animateShuffleNumber */
export const animateSlotText = animateShuffleNumber;

/**
 * Supprime la structure et restaure un texte simple.
 * @param container - Élément hôte
 * @param text - Texte à laisser dans l'élément
 */
export function clearShuffleNumber(container: HTMLElement, text = ''): void {
    settle(container);
    if (!container.hasAttribute('data-shuffle-value')) {
        container.classList.remove(SHUFFLE_NUMBER_CSS.root);
        container.classList.remove(SHUFFLE_NUMBER_CSS.willChange);
    }
    container.textContent = text;
}

/** @deprecated Utiliser clearShuffleNumber */
export const clearSlotText = clearShuffleNumber;
