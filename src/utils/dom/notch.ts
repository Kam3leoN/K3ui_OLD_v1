/**
 * @file notch.ts
 * @description Utilitaires DOM pour la primitive d'encoche (réf. qt-rounder.ts)
 * Structure : rounders → .notch__rounder-inner (rotation) → svg ; puis pastille
 * @author K3UI Team
 * @version 3.0.0
 */

/** Path SVG unique (viewBox 0 0 30 30) — réf. QT_ROUNDER_PATH */
export const NOTCH_ROUNDER_PATH =
  'M30 0L0 0C16.5685 0 30 13.4315 30 30L30 0Z';

/** Alias explicite de la référence qt-rounder */
export const QT_ROUNDER_PATH = NOTCH_ROUNDER_PATH;

export type NotchCornerPosition = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
export type NotchEdgePosition = 'top-center' | 'bottom-center' | 'left-center' | 'right-center';
export type NotchTabPosition = NotchCornerPosition | NotchEdgePosition;

/** Codes courts qt-rounder (tl/tr/…) */
export type QtCornerPosition = 'tl' | 'tr' | 'bl' | 'br';
export type QtEdgePosition = 'tc' | 'bc' | 'lc' | 'rc';
export type QtTabPosition = QtCornerPosition | QtEdgePosition;

export interface NotchRounderRotation {
  a: number;
  b: number;
}

/**
 * Rotations des deux rounders par position (réf. ROUNDER_ROTATIONS)
 *
 *   Position      │ A (deg) │ B (deg)
 *   top-start TL  │ 270     │ 270
 *   top-end TR    │ 0       │ 0
 *   bottom-start  │ 180     │ 180
 *   bottom-end BR │ 90      │ 90
 *   top-center    │ 0       │ 270
 *   bottom-center │ 90      │ 180
 *   left-center   │ 180     │ 270
 *   right-center  │ 90      │ 0
 */
export const NOTCH_ROUNDER_ROTATIONS: Record<NotchTabPosition, NotchRounderRotation> = {
  'top-start': { a: 270, b: 270 },
  'top-end': { a: 0, b: 0 },
  'bottom-start': { a: 180, b: 180 },
  'bottom-end': { a: 90, b: 90 },
  'top-center': { a: 0, b: 270 },
  'bottom-center': { a: 90, b: 180 },
  'left-center': { a: 180, b: 270 },
  'right-center': { a: 90, b: 0 },
};

/** Alias qt-rounder */
export const ROUNDER_ROTATIONS: Record<QtTabPosition, NotchRounderRotation> = {
  tl: NOTCH_ROUNDER_ROTATIONS['top-start'],
  tr: NOTCH_ROUNDER_ROTATIONS['top-end'],
  bl: NOTCH_ROUNDER_ROTATIONS['bottom-start'],
  br: NOTCH_ROUNDER_ROTATIONS['bottom-end'],
  tc: NOTCH_ROUNDER_ROTATIONS['top-center'],
  bc: NOTCH_ROUNDER_ROTATIONS['bottom-center'],
  lc: NOTCH_ROUNDER_ROTATIONS['left-center'],
  rc: NOTCH_ROUNDER_ROTATIONS['right-center'],
};

const QT_TO_NOTCH: Record<QtTabPosition, NotchTabPosition> = {
  tl: 'top-start',
  tr: 'top-end',
  bl: 'bottom-start',
  br: 'bottom-end',
  tc: 'top-center',
  bc: 'bottom-center',
  lc: 'left-center',
  rc: 'right-center',
};

/**
 * Ajuste la pastille `.notch__label` au texte :
 * - coins / haut / bas → largeur
 * - gauche / droite → hauteur (la largeur = profondeur est fixée en CSS)
 * @param labelEl - Élément `.notch__label` contenant un `<span>`
 * @param padding - Padding total (px) à ajouter à la mesure du texte
 */
export function fitNotchLabelWidth(labelEl: HTMLElement, padding = 28): void {
  const span = labelEl.querySelector('span');
  if (!(span instanceof HTMLElement)) {
    return;
  }

  const host = labelEl.closest('.notch');
  const isSideEdge =
    host?.classList.contains('notch--left-center') ||
    host?.classList.contains('notch--right-center');

  requestAnimationFrame(() => {
    if (isSideEdge) {
      // Largeur = profondeur (token edge) ; hauteur suit le texte
      labelEl.style.width = '20px';
      labelEl.style.height = `${Math.max(span.scrollHeight, span.scrollWidth) + padding}px`;
      return;
    }

    labelEl.style.height = '';
    labelEl.style.width = `${span.scrollWidth + padding}px`;
  });
}

/**
 * Crée un élément SVG de quartier concave pour l'encoche.
 * @returns Élément SVG 30×30 avec le path concave
 */
export function createNotchRounderSvg(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 30 30');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', NOTCH_ROUNDER_PATH);
  svg.appendChild(path);

  return svg;
}

/**
 * Crée un rounder avec inner (réf. .rounder > .ri > svg)
 */
function createNotchRounder(variant: 'a' | 'b'): HTMLDivElement {
  const rounder = document.createElement('div');
  rounder.className = `notch__rounder notch__rounder--${variant}`;

  const inner = document.createElement('div');
  inner.className = 'notch__rounder-inner';
  inner.appendChild(createNotchRounderSvg());
  rounder.appendChild(inner);

  return rounder;
}

/**
 * Garantit la présence de `.notch__rounder-inner` (migration DOM legacy)
 */
function ensureRounderInner(rounder: HTMLElement): void {
  let inner = rounder.querySelector('.notch__rounder-inner');
  if (inner instanceof HTMLElement) {
    return;
  }

  const svg = rounder.querySelector('svg');
  inner = document.createElement('div');
  inner.className = 'notch__rounder-inner';
  if (svg) {
    inner.appendChild(svg);
  } else {
    inner.appendChild(createNotchRounderSvg());
  }
  rounder.appendChild(inner);
}

/**
 * Garantit la structure notch complète sur un hôte (surface ou card).
 * Ordre DOM : rounder A, rounder B, puis label (réf. createTabHTML).
 *
 * @param host - Conteneur (surface / card) qui porte déjà ou recevra `.notch__label-wrapper`
 * @param labelContent - Texte de la pastille (optionnel si label existe)
 * @param spanClassName - Classe CSS du `<span>` interne (ex. `quote__author`, `alert__title`)
 * @returns L’élément `.notch__label`
 */
export function ensureNotchStructure(
  host: HTMLElement,
  labelContent?: string | HTMLElement,
  spanClassName?: string
): HTMLElement {
  let wrapper = host.querySelector('.notch__label-wrapper');

  if (!(wrapper instanceof HTMLElement)) {
    wrapper = document.createElement('div');
    wrapper.className = 'notch__label-wrapper';
    host.appendChild(wrapper);
  }

  let rounderA = wrapper.querySelector('.notch__rounder--a');
  let rounderB = wrapper.querySelector('.notch__rounder--b');
  let label = wrapper.querySelector('.notch__label');

  if (!(rounderA instanceof HTMLElement)) {
    rounderA = createNotchRounder('a');
  } else {
    ensureRounderInner(rounderA);
  }

  if (!(rounderB instanceof HTMLElement)) {
    rounderB = createNotchRounder('b');
  } else {
    ensureRounderInner(rounderB);
  }

  if (!(label instanceof HTMLElement)) {
    label = document.createElement('div');
    label.className = 'notch__label';

    const span = document.createElement('span');
    if (spanClassName) {
      span.className = spanClassName;
    }

    if (typeof labelContent === 'string') {
      span.textContent = labelContent;
    } else if (labelContent instanceof HTMLElement) {
      span.appendChild(labelContent);
    }

    label.appendChild(span);
  } else {
    let span = label.querySelector('span');
    if (!(span instanceof HTMLElement)) {
      span = document.createElement('span');
      label.appendChild(span);
    }
    if (spanClassName) {
      span.className = spanClassName;
    }
    if (typeof labelContent === 'string' && labelContent.length > 0) {
      span.textContent = labelContent;
    }
  }

  // Ordre réf. qt-rounder : rounders puis tab
  wrapper.appendChild(rounderA);
  wrapper.appendChild(rounderB);
  wrapper.appendChild(label);

  return label;
}

/**
 * Génère le HTML d'une pastille + 2 rounders (réf. createTabHTML).
 *
 * @param position - Position notch ou code court qt (tl, tr, …)
 * @param label - Texte de la pastille
 */
export function createNotchTabHTML(
  position: NotchTabPosition | QtTabPosition,
  label: string
): string {
  const notchPos: NotchTabPosition =
    position in QT_TO_NOTCH
      ? QT_TO_NOTCH[position as QtTabPosition]
      : (position as NotchTabPosition);

  const needsSpan =
    notchPos === 'left-center' || notchPos === 'right-center';
  const labelHTML = needsSpan ? `<span>${label}</span>` : `<span>${label}</span>`;
  const svg = `<svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="${NOTCH_ROUNDER_PATH}"></path></svg>`;

  return `
    <div class="notch__label-wrapper">
      <div class="notch__rounder notch__rounder--a">
        <div class="notch__rounder-inner">${svg}</div>
      </div>
      <div class="notch__rounder notch__rounder--b">
        <div class="notch__rounder-inner">${svg}</div>
      </div>
      <div class="notch__label">${labelHTML}</div>
    </div>`;
}
