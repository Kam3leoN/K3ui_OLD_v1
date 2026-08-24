/**
 * @fileoverview Export QR (téléchargement, rasterisation) + overlay yeux legacy
 * @description L'overlay `applyQrEyesOverlay` reste disponible pour vignettes docs ;
 * le rendu principal passe par `renderQrSvgString`.
 */

import {
    getQrBallPath,
    getQrFramePaths,
    type QrEyeBox,
} from './shapes';

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface QrEyesOverlayOptions {
    frameShape: string;
    ballShape: string;
    cornersSquareColor: string;
    cornersDotColor: string;
    backgroundColor: string;
}

function getEyeBox(rect: SVGRectElement): QrEyeBox {
    return {
        x: parseFloat(rect.getAttribute('x') ?? '0'),
        y: parseFloat(rect.getAttribute('y') ?? '0'),
        width: parseFloat(rect.getAttribute('width') ?? '0'),
        height: parseFloat(rect.getAttribute('height') ?? '0'),
    };
}

function addScaledPath(
    group: SVGGElement,
    pathData: string,
    fill: string,
    box: QrEyeBox,
    evenodd = false
): void {
    if (!pathData) {
        return;
    }
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', fill);
    if (evenodd) {
        path.setAttribute('fill-rule', 'evenodd');
    }
    path.setAttribute(
        'transform',
        `translate(${box.x},${box.y}) scale(${box.width / 100},${box.height / 100})`
    );
    group.appendChild(path);
}

function addDottedFrame(group: SVGGElement, box: QrEyeBox, color: string): void {
    const n = 8;
    const r = box.width / 24;
    const step = box.width / (n - 1);

    const dot = (px: number, py: number): void => {
        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', String(px));
        circle.setAttribute('cy', String(py));
        circle.setAttribute('r', String(r));
        circle.setAttribute('fill', color);
        group.appendChild(circle);
    };

    for (let i = 0; i < n; i++) {
        dot(box.x + i * step, box.y);
        dot(box.x + i * step, box.y + box.height);
        if (i > 0 && i < n - 1) {
            dot(box.x, box.y + i * step);
            dot(box.x + box.width, box.y + i * step);
        }
    }
}

/**
 * Applique l'overlay custom sur les yeux du QR code rendu
 * @param svg Élément SVG du QR
 * @param options Couleurs et formes des yeux
 */
export function applyQrEyesOverlay(svg: SVGElement, options: QrEyesOverlayOptions): void {
    const old = svg.querySelector('#eyes-overlay');
    if (old) {
        old.remove();
    }

    svg.querySelectorAll('[data-eye-hidden]').forEach((el) => {
        const node = el as SVGElement;
        node.style.display = '';
        node.removeAttribute('data-eye-hidden');
    });

    const squareRects: SVGRectElement[] = [];
    const dotRects: SVGRectElement[] = [];

    svg.querySelectorAll('rect[clip-path]').forEach((node) => {
        const rect = node as SVGRectElement;
        const clipPath = rect.getAttribute('clip-path') ?? '';
        if (clipPath.includes('corners-square-color')) {
            squareRects.push(rect);
        } else if (clipPath.includes('corners-dot-color')) {
            dotRects.push(rect);
        }
    });

    if (!squareRects.length) {
        return;
    }

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('id', 'eyes-overlay');

    squareRects.concat(dotRects).forEach((rect) => {
        rect.style.display = 'none';
        rect.setAttribute('data-eye-hidden', '1');
    });

    const framePaths = getQrFramePaths(options.frameShape);
    squareRects.forEach((rect) => {
        const box = getEyeBox(rect);
        if (framePaths.dotted) {
            addDottedFrame(group, box, options.cornersSquareColor);
        } else if (framePaths.single) {
            addScaledPath(group, framePaths.single, options.cornersSquareColor, box, true);
        }
    });

    const ballPath = getQrBallPath(options.ballShape);
    dotRects.forEach((rect) => {
        addScaledPath(group, ballPath, options.cornersDotColor, getEyeBox(rect));
    });

    svg.appendChild(group);
}

/**
 * Télécharge un blob via lien ou Web Share API
 * @param blob Blob à télécharger
 * @param filename Nom du fichier
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    if ('download' in anchor) {
        anchor.href = url;
        anchor.download = filename;
        anchor.rel = 'noopener';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        return;
    }

    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export interface RasterizeSvgOptions {
    backgroundColor: string;
    forceBackground?: string;
}

/**
 * Rasterise un SVG vers canvas
 * @param svgString SVG sérialisé
 * @param px Taille en pixels
 * @param options Options de fond
 */
export function rasterizeSvgToCanvas(
    svgString: string,
    px: number,
    options: RasterizeSvgOptions
): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const svgUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

        img.onload = (): void => {
            const canvas = document.createElement('canvas');
            canvas.width = px;
            canvas.height = px;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas 2D indisponible'));
                return;
            }

            const bg = options.backgroundColor;
            if (bg !== 'transparent') {
                ctx.fillStyle = bg;
                ctx.fillRect(0, 0, px, px);
            } else if (options.forceBackground) {
                ctx.fillStyle = options.forceBackground;
                ctx.fillRect(0, 0, px, px);
            }

            ctx.drawImage(img, 0, 0, px, px);
            resolve(canvas);
        };

        img.onerror = (): void => reject(new Error('Échec du rendu SVG'));
        img.src = svgUrl;
    });
}

/**
 * Génère un fichier EPS à partir d'un canvas
 * @param canvas Canvas rasterisé
 */
export function canvasToEpsBlob(canvas: HTMLCanvasElement): Blob {
    const w = canvas.width;
    const h = canvas.height;
    const data = canvas.getContext('2d')!.getImageData(0, 0, w, h).data;
    const lut: string[] = [];
    for (let i = 0; i < 256; i++) {
        lut[i] = (i < 16 ? '0' : '') + i.toString(16);
    }

    let hex = '';
    for (let p = 0; p < data.length; p += 4) {
        hex += lut[data[p]] + lut[data[p + 1]] + lut[data[p + 2]];
    }

    const hexLines = hex.replace(/(.{60})/g, '$1\n');
    let eps = '';
    eps += '%!PS-Adobe-3.0 EPSF-3.0\n';
    eps += '%%Creator: K3UI QrCode\n';
    eps += '%%Title: qrcode\n';
    eps += `%%BoundingBox: 0 0 ${w} ${h}\n`;
    eps += '%%EndComments\n';
    eps += 'gsave\n';
    eps += `${w} ${h} scale\n`;
    eps += `${w} ${h} 8 [ ${w} 0 0 -${h} 0 ${h} ]\n`;
    eps += `{ currentfile ${w * 3} string readhexstring pop } false 3 colorimage\n`;
    eps += `${hexLines}\n`;
    eps += 'grestore\n';
    eps += '%%EOF\n';

    return new Blob([eps], { type: 'application/postscript' });
}
