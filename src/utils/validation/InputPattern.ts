
/** Registre dynamique des patterns (lecture/écriture sans `any`) */
type InputPatternRegistry = Record<string, RegExp | unknown>;

function getInputPatternRegistry(): InputPatternRegistry {
    return InputPattern as unknown as InputPatternRegistry;
}

/**
 * Gestionnaire des patterns de validation pour les composants K3UI
 * Centralise tous les patterns de validation et leurs messages d'erreur
 */
export class InputPattern {
    /**
     * Pattern pour validation des emails
     */
    static readonly EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /**
     * Pattern pour validation des numéros de téléphone
     */
    static readonly PHONE = /^[0-9+\-\s()]+$/;

    /**
     * Pattern pour validation des URLs
     */
    static readonly URL = /^https?:\/\/.+/;

    /**
     * Pattern pour validation des lettres uniquement
     */
    static readonly LETTERS = /^[a-zA-Z\s]+$/;

    /**
     * Pattern pour validation des chiffres uniquement
     */
    static readonly NUMBERS = /^[0-9]+$/;

    /**
     * Pattern pour validation des mots de passe forts
     */
    static readonly PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    /**
     * Pattern pour validation des codes postaux français
     */
    static readonly POSTAL_CODE_FR = /^[0-9]{5}$/;

    /**
     * Pattern pour validation des codes postaux internationaux
     */
    static readonly POSTAL_CODE_INTL = /^[A-Za-z0-9\s\-]{3,10}$/;

    /**
     * Pattern pour validation des noms d'utilisateur
     */
    static readonly USERNAME = /^[a-zA-Z0-9_\-]{3,20}$/;

    /**
     * Pattern pour validation des montants monétaires
     */
    static readonly CURRENCY = /^[0-9]+(\.[0-9]{1,2})?$/;

    /**
     * Pattern pour validation des numéros de téléphone français (format international)
     */
    static readonly PHONE_FR = /^(?:\+33|0)[1-9](?:[0-9]{8})$/;

    /**
     * Pattern pour validation des numéros de téléphone internationaux
     */
    static readonly PHONE_INTL = /^\+\d{1,4}[\d\s\-()]{8,15}$/;

    /**
     * Pattern pour validation des numéros de téléphone internationaux (format compact)
     */
    static readonly PHONE_INTL_COMPACT = /^\+\d{8,19}$/;

    /**
     * Pattern pour validation des adresses IPv4
     */
    static readonly IPV4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    /**
     * Pattern pour validation des adresses IPv6
     */
    static readonly IPV6 = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    /**
     * Pattern pour validation des codes couleur hexadécimaux
     */
    static readonly HEX_COLOR = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    /**
     * Pattern pour validation des codes couleur RGB
     */
    static readonly RGB_COLOR = /^rgb\(\s*(0|[1-9]\d?|1\d\d?|2[0-4]\d|25[0-5])\s*,\s*(0|[1-9]\d?|1\d\d?|2[0-4]\d|25[0-5])\s*,\s*(0|[1-9]\d?|1\d\d?|2[0-4]\d|25[0-5])\s*\)$/;

    /**
     * Pattern pour validation des codes couleur RGBA
     */
    static readonly RGBA_COLOR = /^rgba\(\s*(0|[1-9]\d?|1\d\d?|2[0-4]\d|25[0-5])\s*,\s*(0|[1-9]\d?|1\d\d?|2[0-4]\d|25[0-5])\s*,\s*(0|[1-9]\d?|1\d\d?|2[0-4]\d|25[0-5])\s*,\s*(0|1|0?\.\d+)\s*\)$/;

    /**
     * Pattern pour validation des codes couleur CMYK
     */
    static readonly CMYK_COLOR = /^cmyk\(\s*(0|100|[1-9]?\d(?:\.\d+)?)\s*%?\s*,\s*(0|100|[1-9]?\d(?:\.\d+)?)\s*%?\s*,\s*(0|100|[1-9]?\d(?:\.\d+)?)\s*%?\s*,\s*(0|100|[1-9]?\d(?:\.\d+)?)\s*%?\s*\)$/;

    /**
     * Pattern pour validation des codes couleur HSL
     */
    static readonly HSL_COLOR = /^hsl\(\s*(0|360|([1-9]?\d|1[0-9]{2}|2[0-9]{2}|3[0-5]\d))\s*,\s*(0|100|[1-9]?\d)%\s*,\s*(0|100|[1-9]?\d)%\s*\)$/;

    /**
     * Pattern pour validation des codes PIN
     */
    static readonly PIN = /^\d{1,9}$/;

    /**
     * Pattern pour validation des dates (format DD/MM/YYYY)
     */
    static readonly DATE_FR = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

    /**
     * Pattern pour validation des dates (format YYYY-MM-DD)
     */
    static readonly DATE_ISO = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

    /**
     * Pattern pour validation des heures (format HH:MM)
     */
    static readonly TIME = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    /**
     * Pattern pour validation des numéros de sécurité sociale français
     * @privacy Donnée sensible (RGPD, art. 9 assimilé) : ce pattern sert uniquement à la validation
     * de format côté UX (feedback immédiat sur un champ de saisie). Ne jamais persister (localStorage,
     * cookies) ni journaliser (LoggerManager, console) la valeur saisie qui matche ce pattern.
     * La responsabilité de la transmission/stockage sécurisé de cette donnée appartient à l'application hôte.
     */
    static readonly SSN_FR = /^[12]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{2}\d{3}\d{2}$/;

    /**
     * Pattern pour validation des numéros de carte bancaire (format générique)
     * @privacy Donnée sensible (PCI-DSS) : ce pattern sert uniquement à la validation de format côté
     * UX (feedback immédiat sur un champ de saisie). Ne jamais persister (localStorage, cookies) ni
     * journaliser (LoggerManager, console) la valeur saisie qui matche ce pattern.
     * La responsabilité de la transmission/stockage sécurisé de cette donnée appartient à l'application hôte.
     */
    static readonly CREDIT_CARD = /^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/;

    /**
     * Pattern pour validation des numéros de TVA intracommunautaire
     */
    static readonly VAT_EU = /^[A-Z]{2}[A-Z0-9]{2,12}$/;

    /**
     * Pattern pour validation des SIREN (France)
     */
    static readonly SIREN = /^\d{9}$/;

    /**
     * Pattern pour validation des SIRET (France)
     */
    static readonly SIRET = /^\d{14}$/;

    /**
     * Pattern pour validation des slugs (URL-friendly)
     */
    static readonly SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    /**
     * Pattern pour validation des hashtags
     */
    static readonly HASHTAG = /^#[a-zA-Z0-9_]+$/;

    /**
     * Pattern pour validation des mentions Twitter
     */
    static readonly MENTION = /^@[a-zA-Z0-9_]+$/;

    /**
     * Messages d'erreur par défaut pour chaque pattern
     */
    private static readonly DEFAULT_MESSAGES = new Map<string, string>([
        ['email', 'Format email invalide'],
        ['phone', 'Format téléphone invalide'],
        ['url', 'Format URL invalide'],
        ['letters', 'Seules les lettres sont autorisées'],
        ['numbers', 'Seuls les chiffres sont autorisés'],
        ['password', 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'],
        ['postal_code_fr', 'Code postal français invalide (5 chiffres)'],
        ['postal_code_intl', 'Code postal invalide'],
        ['username', 'Nom d\'utilisateur invalide (3-20 caractères, lettres, chiffres, tirets et underscores)'],
        ['currency', 'Format monétaire invalide'],
        ['phone_fr', 'Numéro de téléphone français invalide (format: 0X XX XX XX XX ou +33X XX XX XX XX)'],
        ['phone_intl', 'Numéro de téléphone international invalide'],
        ['ipv4', 'Adresse IPv4 invalide'],
        ['ipv6', 'Adresse IPv6 invalide'],
        ['hex_color', 'Code couleur hexadécimal invalide (format: #RRGGBB ou #RGB)'],
        ['rgb_color', 'Code couleur RGB invalide (format: rgb(r, g, b))'],
        ['rgba_color', 'Code couleur RGBA invalide (format: rgba(r, g, b, a))'],
        ['cmyk_color', 'Code couleur CMYK invalide (format: cmyk(c%, m%, y%, k%))'],
        ['hsl_color', 'Code couleur HSL invalide (format: hsl(h, s%, l%))'],
        ['pin', 'Code PIN invalide (1-9 chiffres)'],
        ['date_fr', 'Date invalide (format: DD/MM/YYYY)'],
        ['date_iso', 'Date invalide (format: YYYY-MM-DD)'],
        ['time', 'Heure invalide (format: HH:MM)'],
        ['ssn_fr', 'Numéro de sécurité sociale français invalide'],
        ['credit_card', 'Numéro de carte bancaire invalide'],
        ['vat_eu', 'Numéro de TVA intracommunautaire invalide'],
        ['siren', 'Numéro SIREN invalide (9 chiffres)'],
        ['siret', 'Numéro SIRET invalide (14 chiffres)'],
        ['slug', 'Slug invalide (lettres minuscules, chiffres et tirets uniquement)'],
        ['hashtag', 'Hashtag invalide (format: #mot)'],
        ['mention', 'Mention invalide (format: @utilisateur)']
    ]);

    /**
     * Valide une valeur selon un pattern
     * @param value - La valeur à valider
     * @param pattern - Le pattern de validation (RegExp ou nom de pattern)
     * @returns true si la valeur est valide, false sinon
     */
    static validate(value: string, pattern: RegExp | string): boolean {
        if (!value) return true; // Valeur vide considérée comme valide

        let regex: RegExp;

        if (pattern instanceof RegExp) {
            regex = pattern;
        } else {
            // Recherche le pattern par nom
            const patternKey = pattern.toUpperCase();
            const candidate = getInputPatternRegistry()[patternKey];

            if (!(candidate instanceof RegExp)) {
                console.warn(`[InputPattern] Pattern "${pattern}" non trouvé dans InputPattern`);
                return true; // Pattern non trouvé = validation réussie par défaut
            }
            regex = candidate;
        }

        return regex.test(value);
    }

    /**
     * Obtient le message d'erreur pour un pattern
     * @param patternName - Le nom du pattern
     * @param customMessage - Message personnalisé (optionnel)
     * @returns Le message d'erreur
     */
    static getErrorMessage(patternName: string, customMessage?: string): string {
        if (customMessage) {
            return customMessage;
        }

        return InputPattern.DEFAULT_MESSAGES.get(patternName.toLowerCase()) ||
            `Format "${patternName}" invalide`;
    }

    /**
     * Obtient tous les patterns disponibles
     * @returns Map des patterns avec leurs noms
     */
    static getAllPatterns(): Map<string, RegExp> {
        const patterns = new Map<string, RegExp>();

        const registry = getInputPatternRegistry();
        Object.keys(InputPattern).forEach((key) => {
            const pattern = registry[key];
            if (pattern instanceof RegExp) {
                patterns.set(key.toLowerCase(), pattern);
            }
        });

        return patterns;
    }

    /**
     * Ajoute un pattern personnalisé
     * @param name - Nom du pattern
     * @param pattern - Expression régulière
     * @param message - Message d'erreur (optionnel)
     */
    static addCustomPattern(name: string, pattern: RegExp, message?: string): void {
        getInputPatternRegistry()[name.toUpperCase()] = pattern;
        if (message) {
            InputPattern.DEFAULT_MESSAGES.set(name.toLowerCase(), message);
        }
    }

    /**
     * Supprime un pattern personnalisé
     * @param name - Nom du pattern à supprimer
     */
    static removeCustomPattern(name: string): void {
        delete getInputPatternRegistry()[name.toUpperCase()];
        InputPattern.DEFAULT_MESSAGES.delete(name.toLowerCase());
    }

    /**
     * Formate un numéro de téléphone international avec des espaces pour l'affichage
     * @param phoneNumber - Le numéro de téléphone (avec ou sans espaces)
     * @returns Le numéro formaté avec des espaces
     */
    static formatInternationalPhone(phoneNumber: string): string {
        // Supprimer tous les espaces et caractères non numériques sauf le +
        let cleaned = phoneNumber.replace(/[^\d+]/g, '');

        // Vérifier que c'est un numéro international valide
        if (!cleaned.startsWith('+') || cleaned.length < 9) {
            return phoneNumber; // Retourner tel quel si invalide
        }

        // Supprimer le 0 initial pour les numéros français (+33)
        if (cleaned.startsWith('+33') && cleaned.length > 3 && cleaned.charAt(3) === '0') {
            cleaned = cleaned.substring(0, 3) + cleaned.substring(4);
        }

        // Séparer le code pays du reste
        const countryCode = cleaned.substring(0, 3); // +XX
        const number = cleaned.substring(3);

        // Formatage spécifique pour les numéros français (+33)
        if (countryCode === '+33' && number.length === 9) {
            // Format français : +33 X XX XX XX XX
            return `${countryCode} ${number.substring(0, 1)} ${number.substring(1, 3)} ${number.substring(3, 5)} ${number.substring(5, 7)} ${number.substring(7, 9)}`;
        }

        // Formater selon la longueur pour les autres pays
        if (number.length <= 8) {
            // Format court : +XX XXXX XXXX
            return `${countryCode} ${number.substring(0, 4)} ${number.substring(4)}`;
        } else if (number.length <= 10) {
            // Format moyen : +XX XX XX XX XX
            const groups = [];
            for (let i = 0; i < number.length; i += 2) {
                groups.push(number.substring(i, i + 2));
            }
            return `${countryCode} ${groups.join(' ')}`;
        } else {
            // Format long : +XX X XX XX XX XX
            const groups = [number.substring(0, 1)];
            for (let i = 1; i < number.length; i += 2) {
                groups.push(number.substring(i, i + 2));
            }
            return `${countryCode} ${groups.join(' ')}`;
        }
    }

    /**
     * Nettoie un numéro de téléphone international (supprime les espaces)
     * @param phoneNumber - Le numéro de téléphone formaté
     * @returns Le numéro nettoyé sans espaces
     */
    static cleanInternationalPhone(phoneNumber: string): string {
        return phoneNumber.replace(/[^\d+]/g, '');
    }

    /**
     * Formate un numéro de téléphone français avec des espaces pour l'affichage
     * @param phoneNumber - Le numéro de téléphone (avec ou sans espaces)
     * @returns Le numéro formaté avec des espaces
     */
    static formatFrenchPhone(phoneNumber: string): string {
        // Supprimer tous les espaces et caractères non numériques
        const cleaned = phoneNumber.replace(/[^\d]/g, '');

        // Vérifier que c'est un numéro français valide
        if (!cleaned.startsWith('0') || cleaned.length !== 10) {
            return phoneNumber; // Retourner tel quel si invalide
        }

        // Formater : 0X XX XX XX XX
        return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
    }

    /**
     * Nettoie un numéro de téléphone français (supprime les espaces)
     * @param phoneNumber - Le numéro de téléphone formaté
     * @returns Le numéro nettoyé sans espaces
     */
    static cleanFrenchPhone(phoneNumber: string): string {
        return phoneNumber.replace(/[^\d]/g, '');
    }

    /**
     * Convertit un numéro français en format international et supprime le 0 initial
     * @param phoneNumber - Le numéro français (avec ou sans espaces)
     * @returns Le numéro au format international sans le 0
     */
    static convertFrenchToInternational(phoneNumber: string): string {
        const cleaned = phoneNumber.replace(/[^\d]/g, '');

        if (cleaned.startsWith('0') && cleaned.length === 10) {
            return `+33${cleaned.substring(1)}`;
        }

        return phoneNumber;
    }

    /**
     * Formate une valeur RGB avec des virgules automatiques
     * @param value - La valeur RGB (avec ou sans virgules)
     * @returns La valeur formatée avec virgules
     */
    static formatRGB(value: string): string {
        // Supprimer tous les caractères non numériques sauf les virgules
        const cleaned = value.replace(/[^\d,]/g, '');

        // Séparer par virgules et nettoyer
        const parts = cleaned.split(',').map(part => part.trim()).filter(part => part);

        // Limiter à 3 valeurs et formater
        const formatted = parts.slice(0, 3).map(part => {
            const num = parseInt(part, 10);
            if (isNaN(num)) return '';

            // Normaliser entre 0 et 255
            const normalized = Math.min(255, Math.max(0, num));
            return normalized.toString();
        }).filter(part => part);

        return formatted.join(', ');
    }

    /**
     * Nettoie une valeur RGB (supprime les virgules)
     * @param value - La valeur RGB formatée
     * @returns La valeur nettoyée
     */
    static cleanRGB(value: string): string {
        return value.replace(/[^\d]/g, '');
    }

    /**
     * Formate une valeur RGBA avec des virgules automatiques
     * @param value - La valeur RGBA (avec ou sans virgules)
     * @returns La valeur formatée avec virgules
     */
    static formatRGBA(value: string): string {
        // Supprimer tous les caractères non numériques sauf les virgules et points
        const cleaned = value.replace(/[^\d,.]/g, '');

        // Séparer par virgules et nettoyer
        const parts = cleaned.split(',').map(part => part.trim()).filter(part => part);

        // Limiter à 4 valeurs et formater
        const formatted = parts.slice(0, 4).map((part, index) => {
            if (index < 3) {
                // RGB: 0-255
                const num = parseInt(part, 10);
                if (isNaN(num)) return '';

                // Normaliser entre 0 et 255
                const normalized = Math.min(255, Math.max(0, num));
                return normalized.toString();
            } else {
                // Alpha: 0-1
                const num = parseFloat(part);
                if (isNaN(num)) return '';

                // Normaliser entre 0 et 1
                const normalized = Math.min(1, Math.max(0, num));
                return normalized.toString();
            }
        }).filter(part => part);

        return formatted.join(', ');
    }

    /**
     * Nettoie une valeur RGBA (supprime les virgules et points)
     * @param value - La valeur RGBA formatée
     * @returns La valeur nettoyée
     */
    static cleanRGBA(value: string): string {
        return value.replace(/[^\d.]/g, '');
    }

    /**
     * Formate une valeur CMYK avec des virgules et % automatiques
     * @param value - La valeur CMYK (avec ou sans virgules et %)
     * @returns La valeur formatée avec virgules et %
     */
    static formatCMYK(value: string): string {
        // Supprimer tous les caractères non numériques sauf les virgules et points
        const cleaned = value.replace(/[^\d,.]/g, '');

        // Séparer par virgules et nettoyer
        const parts = cleaned.split(',').map(part => part.trim()).filter(part => part);

        // Vérifier si on a exactement 4 valeurs (format complet)
        if (parts.length === 4) {
            // Formater avec % pour toutes les valeurs
            const formatted = parts.map(part => {
                const num = parseFloat(part);
                if (isNaN(num)) return '';

                // Normaliser entre 0 et 100
                const normalized = Math.min(100, Math.max(0, num));
                return `${normalized}%`;
            }).filter(part => part);

            return formatted.join(', ');
        } else {
            // Formater sans % si pas complet
            const formatted = parts.map(part => {
                const num = parseFloat(part);
                if (isNaN(num)) return '';

                // Normaliser entre 0 et 100
                const normalized = Math.min(100, Math.max(0, num));
                return normalized.toString();
            }).filter(part => part);

            return formatted.join(', ');
        }
    }

    /**
     * Nettoie une valeur CMYK (supprime les virgules et %)
     * @param value - La valeur CMYK formatée
     * @returns La valeur nettoyée
     */
    static cleanCMYK(value: string): string {
        return value.replace(/[^\d.]/g, '');
    }
}
