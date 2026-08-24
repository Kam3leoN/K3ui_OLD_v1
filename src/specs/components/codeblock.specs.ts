/**
 * @fileoverview Spécifications du composant CodeBlock K3UI
 * @description Bloc de code avec PrismJS, carte et toolbar Material Design 3
 * @author K3UI Team
 * @version 1.0.0
 */

import type { CodeBlockOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant CodeBlock
 */
export const CodeBlockSpecs = {
    behaviors: {
        showToolbar: true,
        showCopy: true,
        showToastOnCopy: true,
        showDownload: true,
        label: '',
        collapsible: false,
        collapsedHeight: 150,
        collapsibleMinLines: 5,
    },
    accessibility: {
        role: 'region',
        autoDisableForReducedMotion: false,
    },
};

/**
 * Extrait les valeurs par défaut pour CodeBlock
 * @returns Options par défaut
 */
export function getCodeBlockDefaults(): CodeBlockOptions {
    return {
        showToolbar: true,
        showCopy: true,
        showToastOnCopy: true,
        showDownload: true,
        label: '',
        collapsible: false,
        collapsedHeight: 150,
        collapsibleMinLines: 5,
        priorityLevel: PriorityLevel.MEDIUM,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
    };
}
