/**
 * @fileoverview Helpers pour la gestion du presse-papier
 * @description Fonctions utilitaires pour copier du contenu dans le presse-papier
 * @author K3UI Team
 * @version 1.0.0
 */

/**
 * Copie du texte dans le presse-papier
 * @param text - Texte à copier
 * @returns Promise qui se résout si la copie réussit
 * @example
 * ```typescript
 * copyToClipboard('Hello World')
 *   .then(() => console.log('Copié!'))
 *   .catch(err => console.error('Erreur:', err));
 * ```
 */
export async function copyToClipboard(text: string): Promise<void> {
    try {
        // Utiliser l'API moderne si disponible
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }

        // Fallback pour les anciens navigateurs
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        return new Promise((resolve, reject) => {
            if (document.execCommand('copy')) {
                resolve();
            } else {
                reject(new Error('Impossible de copier le texte'));
            }
            document.body.removeChild(textArea);
        });
    } catch (error) {
        throw new Error(`Erreur lors de la copie: ${error}`);
    }
}

/**
 * Lit le contenu du presse-papier
 * @returns Promise qui se résout avec le texte du presse-papier
 * @example
 * ```typescript
 * readFromClipboard()
 *   .then(text => console.log('Contenu:', text))
 *   .catch(err => console.error('Erreur:', err));
 * ```
 */
export async function readFromClipboard(): Promise<string> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            return await navigator.clipboard.readText();
        }
        throw new Error('API Clipboard non disponible');
    } catch (error) {
        throw new Error(`Erreur lors de la lecture: ${error}`);
    }
}

/**
 * Vérifie si l'API Clipboard est disponible
 * @returns true si l'API est disponible
 * @example
 * ```typescript
 * if (isClipboardSupported()) {
 *   copyToClipboard('Hello');
 * }
 * ```
 */
export function isClipboardSupported(): boolean {
    return !!(navigator.clipboard && window.isSecureContext);
}

