/**
 * @fileoverview Formatage de tailles en octets
 * @description Helper partagé pour Upload, DropZone, etc.
 * @author K3UI Team
 */

/**
 * Formate une taille en octets en chaîne lisible (B, KB, MB, …).
 * @param bytes - Taille en octets
 * @returns Taille formatée
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);

    return `${Math.round(value * 100) / 100} ${sizes[i]}`;
}
