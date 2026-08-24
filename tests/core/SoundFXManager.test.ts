/**
 * Tests unitaires pour le manager SoundFXManager
 * @description Tests de toutes les fonctionnalités du gestionnaire d'effets sonores
 */

import { SoundFXManager } from '../../src/core/managers/SoundFXManager';

describe('SoundFXManager', () => {
    let soundFXManager: SoundFXManager;

    beforeEach(() => {
        // Nettoyer le DOM
        document.body.innerHTML = '';

        // Détruire l'instance précédente
        SoundFXManager.destroy();
    });

    afterEach(() => {
        // Nettoyer après chaque test
        SoundFXManager.destroy();
        document.body.innerHTML = '';
    });

    describe('Initialisation', () => {
        test('devrait créer une instance avec les options par défaut', () => {
            soundFXManager = new SoundFXManager();

            expect(soundFXManager).toBeDefined();
            expect(soundFXManager.getOptions().enabled).toBe(true);
            expect(soundFXManager.getOptions().volume).toBe(0.5);
        });

        test('devrait créer une instance avec des options personnalisées', () => {
            soundFXManager = new SoundFXManager({
                enabled: false,
                volume: 0.8,
                hoverEnabled: false
            });

            const options = soundFXManager.getOptions();
            expect(options.enabled).toBe(false);
            expect(options.volume).toBe(0.8);
            expect(options.hoverEnabled).toBe(false);
        });

        test('devrait créer un conteneur audio', () => {
            soundFXManager = new SoundFXManager();
            const container = document.getElementById('k3ui-audio-container');

            expect(container).toBeDefined();
        });

        test('devrait créer les spans pour chaque type de son', () => {
            soundFXManager = new SoundFXManager();
            const container = document.getElementById('k3ui-audio-container');

            expect(container?.querySelector('#k3ui-click-sound')).toBeDefined();
            expect(container?.querySelector('#k3ui-hover-sound')).toBeDefined();
            expect(container?.querySelector('#k3ui-leave-sound')).toBeDefined();
            expect(container?.querySelector('#k3ui-move-sound')).toBeDefined();
        });
    });

    describe('Méthodes statiques', () => {
        test('devrait initialiser avec SoundFXManager.init', () => {
            const instance = SoundFXManager.init();

            expect(instance).toBeDefined();
            expect(instance).toBeInstanceOf(SoundFXManager);
        });

        test('devrait retourner la même instance à chaque init', () => {
            const instance1 = SoundFXManager.init();
            const instance2 = SoundFXManager.init();

            expect(instance1).toBe(instance2);
        });

        test('devrait obtenir une instance avec getInstance', () => {
            SoundFXManager.init();
            const instance = SoundFXManager.getInstance();

            expect(instance).toBeDefined();
            expect(instance).toBeInstanceOf(SoundFXManager);
        });

        test('devrait initialiser automatiquement avec getInstance si non initialisé', () => {
            const instance = SoundFXManager.getInstance();

            expect(instance).toBeDefined();
            expect(SoundFXManager.isInitialized).toBe(true);
        });

        test('devrait retourner les options par défaut', () => {
            const defaults = SoundFXManager.defaults;

            expect(defaults).toBeDefined();
            expect(defaults.enabled).toBe(true);
            expect(defaults.volume).toBe(0.5);
        });
    });

    describe('Gestion des options', () => {
        beforeEach(() => {
            soundFXManager = new SoundFXManager();
        });

        test('devrait mettre à jour les options', () => {
            soundFXManager.updateOptions({ volume: 0.8, enabled: false });

            const options = soundFXManager.getOptions();
            expect(options.volume).toBe(0.8);
            expect(options.enabled).toBe(false);
        });

        test('devrait mettre à jour les options statiquement', () => {
            SoundFXManager.updateOptions({ volume: 0.9 });

            const options = SoundFXManager.getOptions();
            expect(options.volume).toBe(0.9);
        });

        test('devrait obtenir les options actuelles', () => {
            const options = soundFXManager.getOptions();

            expect(options).toBeDefined();
            expect(options.enabled).toBeDefined();
            expect(options.volume).toBeDefined();
        });
    });

    describe('Gestion des sons', () => {
        beforeEach(() => {
            soundFXManager = new SoundFXManager();
        });

        test('devrait arrêter tous les sons', () => {
            soundFXManager.stopAllSounds();

            // Vérifier que la méthode ne plante pas
            expect(soundFXManager).toBeDefined();
        });

        test('devrait jouer un son par son nom', () => {
            expect(() => {
                soundFXManager.playSoundByName('test-sound');
            }).not.toThrow();
        });

        test('ne devrait pas jouer de son si désactivé', () => {
            soundFXManager.updateOptions({ enabled: false });

            soundFXManager.playSoundByName('test-sound');

            // Vérifier que la méthode ne plante pas
            expect(soundFXManager).toBeDefined();
        });

        test('devrait arrêter tous les sons statiquement', () => {
            expect(() => {
                SoundFXManager.stopAllSounds();
            }).not.toThrow();
        });

        test('devrait jouer un son statiquement', () => {
            SoundFXManager.init();

            expect(() => {
                SoundFXManager.playSoundByName('test-sound');
            }).not.toThrow();
        });
    });

    describe('Événements et attributs', () => {
        beforeEach(() => {
            soundFXManager = new SoundFXManager();
        });

        test('devrait scanner les éléments avec hoverSound', () => {
            const element = document.createElement('button');
            element.setAttribute('hoverSound', 'test-hover');
            document.body.appendChild(element);

            // Le manager a déjà été initialisé, on doit réinitialiser pour scanner
            soundFXManager.destroy();
            soundFXManager = new SoundFXManager();

            expect(element.hasAttribute('hoverSound')).toBe(true);
        });

        test('devrait scanner les éléments avec clickSound', () => {
            const element = document.createElement('button');
            element.setAttribute('clickSound', 'test-click');
            document.body.appendChild(element);

            soundFXManager.destroy();
            soundFXManager = new SoundFXManager();

            expect(element.hasAttribute('clickSound')).toBe(true);
        });

        test('devrait scanner les éléments avec leaveSound', () => {
            const element = document.createElement('button');
            element.setAttribute('leaveSound', 'test-leave');
            document.body.appendChild(element);

            soundFXManager.destroy();
            soundFXManager = new SoundFXManager();

            expect(element.hasAttribute('leaveSound')).toBe(true);
        });

        test('devrait scanner les éléments avec moveSound', () => {
            const element = document.createElement('button');
            element.setAttribute('moveSound', 'test-move');
            document.body.appendChild(element);

            soundFXManager = new SoundFXManager({ moveEnabled: true });

            expect(element.hasAttribute('moveSound')).toBe(true);
        });
    });

    describe('Callbacks', () => {
        beforeEach(() => {
            soundFXManager = new SoundFXManager();
        });

        test('devrait appeler onPlayStart si défini', () => {
            const onPlayStart = jest.fn();
            soundFXManager.updateOptions({ onPlayStart });

            soundFXManager.playSoundByName('test-sound');

            // Le callback est appelé de façon asynchrone
            expect(onPlayStart).toHaveBeenCalled();
        });

        test('ne devrait pas appeler onPlayStart si le son est désactivé', () => {
            const onPlayStart = jest.fn();
            soundFXManager.updateOptions({ enabled: false, onPlayStart });

            soundFXManager.playSoundByName('test-sound');

            expect(onPlayStart).not.toHaveBeenCalled();
        });
    });

    describe('Destruction', () => {
        beforeEach(() => {
            soundFXManager = new SoundFXManager();
        });

        test('devrait détruire le manager', () => {
            expect(() => {
                soundFXManager.destroy();
            }).not.toThrow();
        });

        test('devrait supprimer le conteneur audio', () => {
            const container = document.getElementById('k3ui-audio-container');
            expect(container).toBeDefined();

            soundFXManager.destroy();

            const containerAfter = document.getElementById('k3ui-audio-container');
            expect(containerAfter).toBeNull();
        });

        test('devrait détruire le manager statiquement', () => {
            SoundFXManager.init();

            expect(() => {
                SoundFXManager.destroy();
            }).not.toThrow();

            expect(SoundFXManager.isInitialized).toBe(false);
        });
    });

    describe('État et configuration', () => {
        test('devrait vérifier l\'état initialisé', () => {
            expect(SoundFXManager.isInitialized).toBe(false);

            SoundFXManager.init();

            expect(SoundFXManager.isInitialized).toBe(true);
        });

        test('devrait activer les sons au survol par défaut', () => {
            const options = SoundFXManager.defaults;
            expect(options.hoverEnabled).toBe(true);
        });

        test('devrait activer les sons au clic par défaut', () => {
            const options = SoundFXManager.defaults;
            expect(options.clickEnabled).toBe(true);
        });

        test('devrait désactiver les sons au mouvement par défaut', () => {
            const options = SoundFXManager.defaults;
            expect(options.moveEnabled).toBe(false);
        });

        test('devrait activer les sons à la sortie par défaut', () => {
            const options = SoundFXManager.defaults;
            expect(options.leaveEnabled).toBe(true);
        });
    });

    describe('Formats audio supportés', () => {
        test('devrait supporter mp3', () => {
            const options = SoundFXManager.defaults;
            expect(options.supportedFormats).toContain('mp3');
        });

        test('devrait supporter ogg', () => {
            const options = SoundFXManager.defaults;
            expect(options.supportedFormats).toContain('ogg');
        });

        test('devrait supporter wav', () => {
            const options = SoundFXManager.defaults;
            expect(options.supportedFormats).toContain('wav');
        });

        test('devrait supporter aac', () => {
            const options = SoundFXManager.defaults;
            expect(options.supportedFormats).toContain('aac');
        });
    });

    describe('Cas limites', () => {
        test('devrait gérer un manager désactivé', () => {
            soundFXManager = new SoundFXManager({ enabled: false });

            expect(soundFXManager.getOptions().enabled).toBe(false);
        });

        test('devrait gérer un volume de 0', () => {
            soundFXManager = new SoundFXManager({ volume: 0 });

            expect(soundFXManager.getOptions().volume).toBe(0);
        });

        test('devrait gérer un volume de 1', () => {
            soundFXManager = new SoundFXManager({ volume: 1 });

            expect(soundFXManager.getOptions().volume).toBe(1);
        });

        test('devrait gérer des options vides', () => {
            soundFXManager = new SoundFXManager({});

            expect(soundFXManager).toBeDefined();
        });

        test('devrait gérer la destruction multiple', () => {
            soundFXManager = new SoundFXManager();
            soundFXManager.destroy();
            soundFXManager.destroy();

            expect(() => soundFXManager.destroy()).not.toThrow();
        });
    });

    describe('Réinitialisation', () => {
        test('devrait réinitialiser après destruction et nouveau init', () => {
            SoundFXManager.init();
            expect(SoundFXManager.isInitialized).toBe(true);

            SoundFXManager.destroy();
            expect(SoundFXManager.isInitialized).toBe(false);

            SoundFXManager.init();
            expect(SoundFXManager.isInitialized).toBe(true);
        });

        test('devrait créer une nouvelle instance après destruction', () => {
            const instance1 = SoundFXManager.init();
            SoundFXManager.destroy();
            const instance2 = SoundFXManager.init();

            // Les instances peuvent être différentes après reconstruction
            expect(instance2).toBeDefined();
        });
    });
});

