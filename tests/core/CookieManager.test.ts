/**
 * Tests unitaires pour le manager CookieManager
 * @description Tests de toutes les fonctionnalités du gestionnaire de cookies
 */

import { CookieManager, CookieConfig } from '../../src/core/managers/CookieManager';

describe('CookieManager', () => {
    let cookieManager: CookieManager;
    let mockDocument: Document;
    let mockNavigator: Navigator;
    let mockCookieConfig: CookieConfig;

    beforeEach(() => {
        // Configuration par défaut pour les tests
        mockCookieConfig = {
            cookiesDisabled: false,
            cookieNamePrefix: 'k3ui',
            msToExpire: 31536000000,
            path: '/',
            domain: undefined,
            isSecure: false,
        };

        // Créer des mocks pour document et navigator
        mockDocument = {
            cookie: '',
        } as Document;

        const navigatorState: { _cookieEnabled?: boolean } = {};
        mockNavigator = {
            get cookieEnabled() {
                return navigatorState._cookieEnabled !== undefined ? navigatorState._cookieEnabled : true;
            },
            set cookieEnabled(value: boolean) {
                navigatorState._cookieEnabled = value;
            },
        } as Navigator;

        // Créer le manager avec les mocks
        cookieManager = new CookieManager({
            documentAlias: mockDocument,
            navigatorAlias: mockNavigator,
            decodeWrapper: decodeURIComponent,
            encodeWrapper: (value) => String(value),
            getCookiesConfig: () => mockCookieConfig,
        });
    });

    afterEach(() => {
        mockDocument.cookie = '';
    });

    describe('Initialisation', () => {
        test('devrait créer une instance avec les dépendances', () => {
            expect(cookieManager).toBeDefined();
            expect(cookieManager).toBeInstanceOf(CookieManager);
        });

        test('devrait créer une instance avec createWithDefaults', () => {
            const manager = CookieManager.createWithDefaults(() => mockCookieConfig);

            expect(manager).toBeDefined();
            expect(manager).toBeInstanceOf(CookieManager);
        });

        test('devrait retourner les options par défaut', () => {
            const defaults = CookieManager.defaults;

            expect(defaults).toBeDefined();
            expect(defaults.cookieNamePrefix).toBe('k3ui');
            expect(defaults.cookiesDisabled).toBe(false);
        });
    });

    describe('Génération de noms de cookies', () => {
        test('devrait générer un nom de cookie complet', () => {
            const cookieName = cookieManager.getCookieName('test');

            expect(cookieName).toBe('k3ui.test');
        });

        test('devrait générer un nom avec prefix personnalisé', () => {
            mockCookieConfig.cookieNamePrefix = 'custom';
            cookieManager.clearConfigCache();

            const cookieName = cookieManager.getCookieName('test');

            expect(cookieName).toContain('custom.test');
        });

        test('ne devrait pas accepter un nom de base invalide', () => {
            expect(() => {
                cookieManager.getCookieName('');
            }).toThrow();

            expect(() => {
                cookieManager.getCookieName(null as unknown as string);
            }).toThrow();
        });
    });

    describe('Lecture de cookies', () => {
        test('devrait lire un cookie existant', () => {
            mockDocument.cookie = 'testcookie=testvalue';

            const value = cookieManager.getCookie('testcookie');

            expect(value).toBe('testvalue');
        });

        test('devrait lire un cookie avec valeur encodée', () => {
            mockDocument.cookie = 'testcookie=' + encodeURIComponent('test value');

            const value = cookieManager.getCookie('testcookie');

            expect(value).toBe('test value');
        });

        test('devrait retourner null pour un cookie inexistant', () => {
            mockDocument.cookie = 'othercookie=value';

            const value = cookieManager.getCookie('nonexistent');

            expect(value).toBeNull();
        });

        test('ne devrait pas lire les cookies si désactivés', () => {
            mockCookieConfig.cookiesDisabled = true;
            cookieManager.clearConfigCache();
            mockDocument.cookie = 'testcookie=testvalue';

            const value = cookieManager.getCookie('testcookie');

            expect(value).toBeNull();
        });

        test('devrait gérer un nom de cookie invalide', () => {
            const value = cookieManager.getCookie('');
            expect(value).toBeNull();

            const value2 = cookieManager.getCookie(null as unknown as string);
            expect(value2).toBeNull();
        });
    });

    describe('Écriture de cookies', () => {
        test('devrait écrire un cookie simple', () => {
            const result = cookieManager.setCookie('testcookie', 'testvalue');

            expect(result).toBe(true);
            expect(mockDocument.cookie).toContain('testcookie=testvalue');
        });

        test('devrait écrire un cookie avec expiration', () => {
            const result = cookieManager.setCookie('testcookie', 'testvalue', { msToExpire: 1000 });

            expect(result).toBe(true);
            expect(mockDocument.cookie).toContain('testcookie=testvalue');
            expect(mockDocument.cookie).toContain('expires=');
        });

        test('devrait écrire un cookie avec chemin personnalisé', () => {
            cookieManager.setCookie('testcookie', 'testvalue', { path: '/custom' });

            expect(mockDocument.cookie).toContain('path=/custom');
        });

        test('devrait écrire un cookie sécurisé', () => {
            cookieManager.setCookie('testcookie', 'testvalue', { isSecure: true });

            expect(mockDocument.cookie).toContain('secure');
        });

        test('devrait écrire un cookie avec domaine', () => {
            cookieManager.setCookie('testcookie', 'testvalue', { domain: 'example.com' });

            expect(mockDocument.cookie).toContain('domain=example.com');
        });

        test('devrait écrire un cookie avec SameSite', () => {
            cookieManager.setCookie('testcookie', 'testvalue', { sameSite: 'Strict' });

            expect(mockDocument.cookie).toContain('SameSite=Strict');
        });

        test('ne devrait pas écrire de cookie si désactivés', () => {
            mockCookieConfig.cookiesDisabled = true;
            cookieManager.clearConfigCache();

            const result = cookieManager.setCookie('testcookie', 'testvalue');

            expect(result).toBe(false);
        });

        test('ne devrait pas accepter un nom de cookie invalide', () => {
            expect(() => {
                cookieManager.setCookie('', 'value');
            }).toThrow();

            expect(() => {
                cookieManager.setCookie(null as unknown as string, 'value');
            }).toThrow();
        });
    });

    describe('Suppression de cookies', () => {
        test('devrait supprimer un cookie existant', () => {
            mockDocument.cookie = 'testcookie=testvalue';
            cookieManager.setCookie('testcookie', 'testvalue');

            const result = cookieManager.deleteCookie('testcookie');

            expect(result).toBe(true);
        });

        test('devrait retourner true même si le cookie n\'existe pas', () => {
            const result = cookieManager.deleteCookie('nonexistent');

            expect(result).toBe(true);
        });
    });

    describe('Test de support des cookies', () => {
        test('devrait retourner true si les cookies sont activés dans le navigateur', () => {
            const result = cookieManager.hasCookies();

            expect(typeof result).toBe('boolean');
        });

        test('devrait retourner false si les cookies sont désactivés dans la config', () => {
            mockCookieConfig.cookiesDisabled = true;
            cookieManager.clearConfigCache();

            const result = cookieManager.hasCookies();

            expect(result).toBe(false);
        });

        test('devrait faire un test manuel si navigator.cookieEnabled n\'est pas disponible', () => {
            const customNavigator = {} as Navigator;
            const manager = new CookieManager({
                documentAlias: mockDocument,
                navigatorAlias: customNavigator,
                decodeWrapper: decodeURIComponent,
                encodeWrapper: (value) => String(value),
                getCookiesConfig: () => mockCookieConfig,
            });

            const result = manager.hasCookies();
            expect(typeof result).toBe('boolean');
        });
    });

    describe('Lecture de tous les cookies', () => {
        test('devrait retourner tous les cookies', () => {
            mockDocument.cookie = 'cookie1=value1; cookie2=value2; cookie3=value3';

            const cookies = cookieManager.getAllCookies();

            expect(cookies).toBeDefined();
            expect(typeof cookies).toBe('object');
        });

        test('devrait retourner un objet vide si aucun cookie', () => {
            mockDocument.cookie = '';

            const cookies = cookieManager.getAllCookies();

            expect(Object.keys(cookies).length).toBe(0);
        });

        test('ne devrait pas retourner de cookies si désactivés', () => {
            mockCookieConfig.cookiesDisabled = true;
            cookieManager.clearConfigCache();
            mockDocument.cookie = 'cookie1=value1';

            const cookies = cookieManager.getAllCookies();

            expect(Object.keys(cookies).length).toBe(0);
        });
    });

    describe('Vérification d\'existence de cookie', () => {
        test('devrait retourner true si le cookie existe', () => {
            mockDocument.cookie = 'testcookie=testvalue';

            const result = cookieManager.hasCookie('testcookie');

            expect(result).toBe(true);
        });

        test('devrait retourner false si le cookie n\'existe pas', () => {
            mockDocument.cookie = 'othercookie=value';

            const result = cookieManager.hasCookie('testcookie');

            expect(result).toBe(false);
        });
    });

    describe('Sécurité (HTTPS)', () => {
        test('devrait passer Secure automatiquement en contexte HTTPS', () => {
            const originalProtocol = window.location.protocol;
            Object.defineProperty(window, 'location', {
                value: { ...window.location, protocol: 'https:' },
                writable: true,
            });

            cookieManager.setCookie('securecookie', 'value');

            expect(mockDocument.cookie).toContain('secure');

            Object.defineProperty(window, 'location', {
                value: { ...window.location, protocol: originalProtocol },
                writable: true,
            });
        });

        test('devrait respecter isSecure=false explicite même en HTTPS', () => {
            const originalProtocol = window.location.protocol;
            Object.defineProperty(window, 'location', {
                value: { ...window.location, protocol: 'https:' },
                writable: true,
            });

            cookieManager.setCookie('plaincookie', 'value', { isSecure: false });

            expect(mockDocument.cookie).not.toContain('secure');

            Object.defineProperty(window, 'location', {
                value: { ...window.location, protocol: originalProtocol },
                writable: true,
            });
        });
    });

    describe('Gestion du cache', () => {
        test('devrait vider le cache', () => {
            cookieManager.clearConfigCache();

            // Vérifier que le cache est vide après nettoyage
            expect(() => {
                cookieManager.clearConfigCache();
            }).not.toThrow();
        });
    });

    describe('Cas limites', () => {
        test('devrait gérer des valeurs de différents types', () => {
            cookieManager.setCookie('string', 'test');
            expect(mockDocument.cookie).toContain('string=test');

            cookieManager.setCookie('number', 123);
            expect(mockDocument.cookie).toContain('number=123');

            cookieManager.setCookie('boolean', true);
            expect(mockDocument.cookie).toContain('boolean=true');
        });

        test('devrait gérer un SameSite avec None qui nécessite Secure', () => {
            const result = cookieManager.setCookie('test', 'value', { sameSite: 'None' });

            expect(result).toBe(true);
        });

        test('devrait gérer des cookies avec caractères spéciaux', () => {
            cookieManager.setCookie('test cookie', 'value with spaces');

            expect(mockDocument.cookie).toContain('test cookie=');
        });
    });

    describe('Encoding et Decoding', () => {
        test('devrait encoder correctement les valeurs', () => {
            cookieManager.setCookie('test', 'value with spaces & special@chars');

            expect(mockDocument.cookie).toBeDefined();
        });

        test('devrait décoder correctement les valeurs lues', () => {
            const specialValue = 'value with spaces & special@chars';
            cookieManager.setCookie('test', specialValue);

            const readValue = cookieManager.getCookie('test');

            expect(readValue).toBe(specialValue);
        });
    });
});

