/**
 * @fileoverview Spécifications du composant Forms K3UI selon Material Design 3
 * @description Spécifications et comportements pour les formulaires
 * @see https://m3.material.io/components/text-fields/overview
 * @author K3UI Team
 * @version 1.0.0
 */

import type { AnimationConfig } from '../../types/components/animations';
import { FieldOptions, TextareaOptions, PinOptions } from '../../types/components';
import { PriorityLevel } from '../../types/base';

/**
 * Spécifications du composant Forms selon Material Design 3
 */
export const FormsSpecs = {
    // ============================================================================
    // COMPORTEMENTS PAR DÉFAUT SELON MATERIAL DESIGN 3
    // ============================================================================

    behaviors: {
        /** Si le formulaire est activé par défaut */
        enabled: true,
        /** Si le formulaire est en mode lecture seule */
        readonly: false,
        /** Si le formulaire est en mode désactivé */
        disabled: false,
        /** Si le formulaire valide en temps réel */
        realTimeValidation: true,
        /** Délai de debounce pour la validation (ms) */
        debounceDelay: 300,
        /** Si le formulaire valide à la soumission */
        validateOnSubmit: true,
        /** Si le formulaire valide au blur */
        validateOnBlur: true,
        /** Si le formulaire valide au change */
        validateOnChange: false,
        /** Auto-resize des textareas */
        autoResizeTextareas: true,
        /** Focus automatique sur les champs invalides */
        autoFocusInvalid: true,
        /** Navigation au clavier entre les champs */
        keyboardNavigation: true,
        /** Désactive l'autocomplétion du navigateur */
        disableAutocomplete: false,
        /** Longueur du PIN (nombre de cases) */
        pinLength: 0,
        /** Type de PIN */
        pinType: 'numeric',
        /** Contrôle des effets de focus */
        autoFocus: true,
        /** Si le formulaire est en mode multiple */
        multiple: false,
    },

    // ============================================================================
    // ANIMATIONS SELON MATERIAL DESIGN 3
    // ============================================================================

    animations: {
        /** Animation des labels flottants */
        labelFloat: {
            type: 'scale' as const,
            duration: 200,
            easing: 'ease-out' as const,
            direction: 'in' as const,
        } as AnimationConfig,

        /** Animation de validation */
        validation: {
            type: 'fade' as const,
            duration: 150,
            easing: 'ease-out' as const,
            direction: 'in' as const,
        } as AnimationConfig,

        /** Animation de focus */
        focus: {
            type: 'fade' as const,
            duration: 200,
            easing: 'ease-out' as const,
            direction: 'in' as const,
        } as AnimationConfig,

        error: {
            type: 'shake' as const,
            duration: 500,
            easing: 'ease-out' as const,
            direction: 'left' as const,
        } as AnimationConfig,

        success: {
            type: 'scale' as const,
            duration: 200,
            easing: 'ease-out' as const,
            direction: 'center' as const,
        } as AnimationConfig,
    },

    // ============================================================================
    // TYPES DE CHAMPS
    // ============================================================================

    fieldTypes: {
        available: [
            'text',
            'email',
            'password',
            'number',
            'tel',
            'url',
            'search',
            'textarea',
            'select',
            'checkbox',
            'radio',
            'file',
            'date',
            'time',
            'datetime-local',
            'color',
            'range',
            'hidden'
        ] as const,

        default: 'text' as const,

        /** Configuration par type */
        config: {
            text: {
                inputMode: 'text',
                autocomplete: 'off',
                spellcheck: true,
            },
            email: {
                inputMode: 'email',
                autocomplete: 'email',
                spellcheck: false,
            },
            password: {
                inputMode: 'text',
                autocomplete: 'current-password',
                spellcheck: false,
            },
            number: {
                inputMode: 'numeric',
                autocomplete: 'off',
                spellcheck: false,
            },
            tel: {
                inputMode: 'tel',
                autocomplete: 'tel',
                spellcheck: false,
            },
            url: {
                inputMode: 'url',
                autocomplete: 'url',
                spellcheck: false,
            },
            search: {
                inputMode: 'search',
                autocomplete: 'off',
                spellcheck: false,
            },
            textarea: {
                inputMode: 'text',
                autocomplete: 'off',
                spellcheck: true,
                rows: 3,
            },
            select: {
                inputMode: 'none',
                autocomplete: 'off',
                spellcheck: false,
            },
            checkbox: {
                inputMode: 'none',
                autocomplete: 'off',
                spellcheck: false,
            },
            radio: {
                inputMode: 'none',
                autocomplete: 'off',
                spellcheck: false,
            },
            file: {
                inputMode: 'none',
                autocomplete: 'off',
                spellcheck: false,
            },
            date: {
                inputMode: 'none',
                autocomplete: 'off',
                spellcheck: false,
            },
            time: {
                inputMode: 'none',
                autocomplete: 'off',
                spellcheck: false,
            },
            'datetime-local': {
                inputMode: 'none',
                autocomplete: 'off',
                spellcheck: false,
            },
            color: {
                inputMode: 'none',
                autocomplete: 'off',
                spellcheck: false,
            },
            range: {
                inputMode: 'none',
                autocomplete: 'off',
                spellcheck: false,
            },
            hidden: {
                inputMode: 'none',
                autocomplete: 'off',
                spellcheck: false,
            },
        },
    },

    // ============================================================================
    // VALIDATION
    // ============================================================================

    validation: {
        /** Si la validation est activée */
        enabled: true,
        /** Types de validation disponibles */
        types: [
            'required',
            'email',
            'url',
            'tel',
            'number',
            'min',
            'max',
            'minLength',
            'maxLength',
            'pattern',
            'custom'
        ] as const,

        /** Messages d'erreur par défaut */
        errorMessages: {
            required: 'Ce champ est obligatoire',
            email: 'Veuillez saisir une adresse email valide',
            url: 'Veuillez saisir une URL valide',
            tel: 'Veuillez saisir un numéro de téléphone valide',
            number: 'Veuillez saisir un nombre valide',
            min: 'La valeur doit être supérieure ou égale à {min}',
            max: 'La valeur doit être inférieure ou égale à {max}',
            minLength: 'Le texte doit contenir au moins {minLength} caractères',
            maxLength: 'Le texte doit contenir au maximum {maxLength} caractères',
            pattern: 'Le format saisi n\'est pas valide',
            custom: 'La valeur saisie n\'est pas valide',
        },

        /** Patterns de validation par défaut */
        patterns: {
            email: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
            url: '^https?:\\/\\/.+',
            tel: '^[0-9+\\-\\s()]+$',
            letters: '^[a-zA-Z\\s]+$',
            numbers: '^[0-9]+$',
            alphanumeric: '^[a-zA-Z0-9]+$',
            password: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
        },
    },

    // ============================================================================
    // ACCESSIBILITÉ
    // ============================================================================

    accessibility: {
        /** Rôle ARIA */
        role: 'form' as const,
        /** Si le formulaire est focusable */
        focusable: true,
        /** Ordre de tabulation */
        tabIndex: 0,
        /** Labels ARIA par défaut */
        labels: {
            form: 'Formulaire',
            field: 'Champ',
            error: 'Erreur',
            success: 'Succès',
            required: 'Obligatoire',
            optional: 'Optionnel',
        },
        /** Si le formulaire respecte les préférences de mouvement réduit */
        respectReducedMotion: true,
        /** Si le formulaire annonce ses changements d'état */
        announceStateChanges: true,
        /** Si le formulaire utilise des labels associés */
        useAssociatedLabels: true,
    },

    // ============================================================================
    // INTERACTIONS
    // ============================================================================

    interactions: {
        /** Si le formulaire répond au clic */
        clickable: true,
        /** Si le formulaire répond au hover */
        hoverable: true,
        /** Si le formulaire répond au focus */
        focusable: true,
        /** Si le formulaire peut être activé au clavier */
        keyboardActivable: true,
        /** Si le formulaire peut être activé au touch */
        touchActivable: true,
        /** Si le formulaire peut être glissé */
        draggable: false,
        /** Si le formulaire peut être redimensionné */
        resizable: false,
        /** Configuration de l'autocomplétion */
        autocomplete: {
            /** Si l'autocomplétion est activée par défaut */
            enabled: true,
            /** Si l'autocomplétion peut être désactivée */
            disableable: true,
            /** Attributs appliqués quand l'autocomplétion est désactivée */
            disableAttributes: {
                autocomplete: 'off',
                autocapitalize: 'off',
                autocorrect: 'off',
                spellcheck: 'false'
            },
            /** Valeur spéciale pour les champs de mot de passe */
            passwordValue: 'new-password'
        },
        /** Configuration des champs PIN */
        pin: {
            /** Si les champs PIN sont supportés */
            supported: true,
            /** Longueurs supportées */
            supportedLengths: [3, 4, 5, 6, 8],
            /** Types supportés */
            supportedTypes: ['numeric', 'alphanumeric'],
            /** Navigation automatique entre les champs */
            autoNavigation: true,
            /** Gestion du collage de code complet */
            pasteSupport: true,
            /** Gestion des flèches directionnelles */
            arrowNavigation: true,
            /** Styles par longueur */
            stylesByLength: {
                3: { size: '52px', fontSize: '26px' },
                4: { size: '52px', fontSize: '26px' },
                5: { size: '48px', fontSize: '24px' },
                6: { size: '44px', fontSize: '22px' },
                8: { size: '44px', fontSize: '22px' }
            }
        },
    },

    // ============================================================================
    // RESPONSIVE
    // ============================================================================

    responsive: {
        /** Si le formulaire s'adapte aux petits écrans */
        adaptive: true,
        /** Largeur maximale sur mobile */
        maxWidthMobile: '100%',
        /** Largeur maximale sur desktop */
        maxWidthDesktop: '600px',
        /** Si le formulaire utilise une largeur fluide */
        fluidWidth: true,
        /** Si le formulaire s'empile sur mobile */
        stackOnMobile: true,
        /** Si le formulaire utilise des colonnes sur desktop */
        useColumnsOnDesktop: false,
    },

    // ============================================================================
    // PERFORMANCE
    // ============================================================================

    performance: {
        /** Si l'animation est désactivée sur mobile */
        disableAnimationOnMobile: false,
        /** Si le rendu est différé */
        deferredRendering: false,
        /** Si le formulaire est mis en cache */
        cached: true,
        /** Taille maximale du cache */
        maxCacheSize: 50,
        /** Si le formulaire utilise la virtualisation */
        virtualized: false,
        /** Si la validation est throttlée */
        throttledValidation: true,
        /** Délai de throttling pour la validation */
        validationThrottleDelay: 300,
    },

    // ============================================================================
    // THÈMES ET STYLES
    // ============================================================================

    theming: {
        /** Si le formulaire suit le thème système */
        followSystemTheme: true,
        /** Styles par défaut */
        styles: {
            backgroundColor: 'transparent',
            color: 'var(--k3ui-on-surface)',
            border: 'none',
            borderRadius: '0',
            elevation: 0,
        },

        /** Styles par état */
        states: {
            default: {
                backgroundColor: 'transparent',
                color: 'var(--k3ui-on-surface)',
            },
            hover: {
                backgroundColor: 'transparent',
                color: 'var(--k3ui-on-surface)',
            },
            focus: {
                backgroundColor: 'transparent',
                color: 'var(--k3ui-on-surface)',
                outline: '2px solid var(--k3ui-primary)',
            },
            error: {
                backgroundColor: 'transparent',
                color: 'var(--k3ui-error)',
                border: '1px solid var(--k3ui-error)',
            },
            success: {
                backgroundColor: 'transparent',
                color: 'var(--k3ui-success)',
                border: '1px solid var(--k3ui-success)',
            },
            disabled: {
                backgroundColor: 'transparent',
                color: 'var(--k3ui-on-surface-disabled)',
                opacity: 0.38,
            },
        },
    },

    // ============================================================================
    // SONS ET FEEDBACK
    // ============================================================================

    audio: {
        /** Si les sons sont activés */
        enabled: true,
        /** Sons par action */
        sounds: {
            submit: 'click.mp3',
            error: 'fail.mp3',
            success: 'notification.mp3',
            focus: 'beep.mp3',
        },
        /** Volume par défaut */
        volume: 0.5,
    },

    // ============================================================================
    // INTERNATIONALISATION
    // ============================================================================

    i18n: {
        /** Langues supportées */
        supportedLanguages: ['fr', 'en', 'es', 'de'],
        /** Langue par défaut */
        defaultLanguage: 'fr',
        /** Textes par défaut */
        defaultTexts: {
            fr: {
                submit: 'Envoyer',
                reset: 'Réinitialiser',
                cancel: 'Annuler',
                save: 'Enregistrer',
                loading: 'Chargement...',
                success: 'Succès',
                error: 'Erreur',
            },
            en: {
                submit: 'Submit',
                reset: 'Reset',
                cancel: 'Cancel',
                save: 'Save',
                loading: 'Loading...',
                success: 'Success',
                error: 'Error',
            },
        },
    },

    // ============================================================================
    // GESTION DES DONNÉES
    // ============================================================================

    data: {
        /** Si le formulaire peut contenir des données personnalisées */
        allowCustomData: true,
        /** Si le formulaire peut avoir des IDs uniques */
        allowUniqueIds: true,
        /** Si le formulaire peut être groupé */
        allowGrouping: true,
        /** Si le formulaire peut être filtré */
        allowFiltering: true,
        /** Si le formulaire peut être trié */
        allowSorting: true,
        /** Si le formulaire peut être sauvegardé */
        allowSaving: true,
        /** Si le formulaire peut être restauré */
        allowRestoring: true,
    },
} as const;

/**
 * Extrait les valeurs par défaut pour Field depuis les specs
 * @returns Options par défaut pour Field
 */
export function getFieldDefaults(): FieldOptions {
    return {
        variant: 'filled', // TODO: Extraire depuis FormsSpecs.variants une fois disponible
        type: FormsSpecs.fieldTypes.default,
        value: '',
        defaultValue: '',
        label: undefined,
        placeholder: undefined,
        helper: undefined,
        helperOnFocus: false,
        clearable: false,
        clearIcon: 'cancel--outlined',
        endAligned: false,
        prefix: undefined,
        suffix: undefined,
        leadingIcon: undefined,
        trailingIcon: undefined,
        errorIcon: 'error',
        readonly: FormsSpecs.behaviors.readonly,
        disabled: FormsSpecs.behaviors.disabled,
        required: false,
        rows: null,
        autosize: FormsSpecs.behaviors.autoResizeTextareas,
        minRows: null,
        maxRows: null,
        minLength: null,
        maxLength: null,
        counter: false,
        minCounter: null,
        maxCounter: null,
        step: null,
        pattern: null,
        togglePassword: false,
        showPasswordIcon: 'eye',
        hidePasswordIcon: 'eye-slash',
        autocapitalize: null,
        autocorrect: null,
        autocomplete: null,
        enterkeyhint: null,
        spellcheck: false,
        inputmode: null,
        onFocus: null,
        onBlur: null,
        onChange: null,
        onInput: null,
        validationMessage: null,
        onInvalid: null,
        onClear: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onEvent: null,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}

/**
 * Extrait les valeurs par défaut pour Textarea depuis les specs
 * @returns Options par défaut pour Textarea
 */
export function getTextareaDefaults(): TextareaOptions {
    return {
        variant: 'filled', // TODO: Extraire depuis FormsSpecs.variants une fois disponible
        label: undefined,
        placeholder: undefined,
        rows: FormsSpecs.fieldTypes.config.textarea.rows || 3,
        maxLength: undefined,
        helperText: undefined,
        errorText: undefined,
        disabled: FormsSpecs.behaviors.disabled,
        required: false,
        readonly: FormsSpecs.behaviors.readonly,
        autosize: FormsSpecs.behaviors.autoResizeTextareas,
        showCounter: false,
        value: '',
        onFocus: null,
        onBlur: null,
        onChange: null,
        onInput: null,
        onInvalid: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onEvent: null,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}

/**
 * Extrait les valeurs par défaut pour Pin depuis les specs
 * @returns Options par défaut pour Pin
 */
export function getPinDefaults(): PinOptions {
    return {
        variant: 'filled', // TODO: Extraire depuis FormsSpecs.variants une fois disponible
        length: FormsSpecs.behaviors.pinLength || 6,
        type: 'password',
        inputType: FormsSpecs.behaviors.pinType === 'numeric' ? 'numbers' : 'mixed',
        caseSensitive: true,
        pinHelper: null,
        pinCounter: true,
        focusDelay: 0,
        allowBackspace: true,
        allowPaste: true,
        onComplete: null,
        onFocus: null,
        onBlur: null,
        onOpenStart: null,
        onOpenEnd: null,
        onCloseStart: null,
        onCloseEnd: null,
        onEvent: null,
        expectedCode: null,
        enableValidation: false,
        onValid: null,
        onInvalid: null,
        priorityLevel: PriorityLevel.MEDIUM,
    };
}
