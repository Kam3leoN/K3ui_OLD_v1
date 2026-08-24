/**
 * Tests unitaires pour le composant Hero
 * @description Tests de toutes les fonctionnalités du composant Hero
 */

import { Hero } from '../../src/components/Hero';
import { HeroOptions } from '../../src/components/Hero';
import { PriorityLevel } from '../../src/types/base';

describe('Hero', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Création et initialisation', () => {
        test('devrait créer un Hero avec les options par défaut', () => {
            const heroElement = document.createElement('k3ui-hero');
            document.body.appendChild(heroElement);

            const hero = new Hero(heroElement);

            expect(hero).toBeDefined();
            expect(hero.options.title).toBe('');
            expect(hero.options.subtitle).toBe('');
            expect(hero.options.color).toBe('primary');
            expect(hero.options.titleClass).toBe('');
            expect(hero.options.subtitleClass).toBe('');
            expect(hero.priority).toBe(PriorityLevel.MEDIUM);
        });

        test('devrait lire les attributs HTML lors de l\'initialisation', () => {
            const heroElement = document.createElement('k3ui-hero');
            heroElement.setAttribute('title', 'Titre Test');
            heroElement.setAttribute('subtitle', 'Sous-titre Test');
            heroElement.setAttribute('color', 'red');
            document.body.appendChild(heroElement);

            const hero = new Hero(heroElement);

            expect(hero.options.title).toBe('Titre Test');
            expect(hero.options.subtitle).toBe('Sous-titre Test');
            expect(hero.options.color).toBe('red');
        });

        test('devrait initialiser avec des options personnalisées', () => {
            const heroElement = document.createElement('k3ui-hero');
            document.body.appendChild(heroElement);

            const customOptions: Partial<HeroOptions> = {
                title: 'Titre Personnalisé',
                subtitle: 'Sous-titre Personnalisé',
                color: 'blue',
                titleClass: 'display-medium',
                subtitleClass: 'title-medium'
            };

            const hero = new Hero(heroElement, customOptions);

            expect(hero.options.title).toBe('Titre Personnalisé');
            expect(hero.options.subtitle).toBe('Sous-titre Personnalisé');
            expect(hero.options.color).toBe('blue');
            expect(hero.options.titleClass).toBe('display-medium');
            expect(hero.options.subtitleClass).toBe('title-medium');
        });
    });

    describe('Méthodes statiques', () => {
        test('devrait retourner les options par défaut', () => {
            const defaults = Hero.defaults;

            expect(defaults).toBeDefined();
            expect(defaults.title).toBe('');
            expect(defaults.subtitle).toBe('');
            expect(defaults.color).toBe('primary');
            expect(defaults.titleClass).toBe('');
            expect(defaults.subtitleClass).toBe('');
        });

        test('devrait initialiser via la méthode statique init', () => {
            const heroElement = document.createElement('k3ui-hero');
            document.body.appendChild(heroElement);

            const result = Hero.init(heroElement, {
                title: 'Test Init',
                subtitle: 'Test d\'initialisation'
            });

            // La méthode init peut retourner soit un tableau soit un objet selon l'implémentation
            const instances = Array.isArray(result) ? result : [result];

            expect(instances).toHaveLength(1);
            expect(instances[0]).toBeInstanceOf(Hero);
            expect(instances[0].options.title).toBe('Test Init');
            expect(instances[0].options.subtitle).toBe('Test d\'initialisation');
        });

        test('devrait récupérer une instance existante', () => {
            const heroElement = document.createElement('k3ui-hero');
            document.body.appendChild(heroElement);

            const hero = new Hero(heroElement);
            const retrievedHero = Hero.getInstance(heroElement);

            expect(retrievedHero).toBe(hero);
        });
    });

    describe('Rendu HTML', () => {
        test('devrait créer la structure HTML correcte', () => {
            const heroElement = document.createElement('k3ui-hero');
            heroElement.setAttribute('title', 'Titre Test');
            heroElement.setAttribute('subtitle', 'Sous-titre Test');
            document.body.appendChild(heroElement);

            new Hero(heroElement);

            // Vérifier la structure
            const container = heroElement.querySelector('.container');
            const row = heroElement.querySelector('.row');
            const col = heroElement.querySelector('.col.s12');
            const title = heroElement.querySelector('h1');
            const subtitle = heroElement.querySelector('h2');

            expect(container).toBeTruthy();
            expect(row).toBeTruthy();
            expect(col).toBeTruthy();
            expect(title).toBeTruthy();
            expect(subtitle).toBeTruthy();

            // Vérifier le contenu
            expect(title?.textContent).toBe('Titre Test');
            expect(subtitle?.textContent).toBe('Sous-titre Test');
        });

        test('devrait appliquer les classes CSS personnalisées', () => {
            const heroElement = document.createElement('k3ui-hero');
            heroElement.setAttribute('title', 'Titre Test');
            heroElement.setAttribute('subtitle', 'Sous-titre Test');
            document.body.appendChild(heroElement);

            new Hero(heroElement, {
                titleClass: 'display-medium',
                subtitleClass: 'title-medium'
            });

            const title = heroElement.querySelector('h1');
            const subtitle = heroElement.querySelector('h2');

            expect(title?.classList.contains('display-medium')).toBe(true);
            expect(subtitle?.classList.contains('title-medium')).toBe(true);
        });

        test('ne devrait pas créer de titre si vide', () => {
            const heroElement = document.createElement('k3ui-hero');
            heroElement.setAttribute('subtitle', 'Sous-titre Test');
            document.body.appendChild(heroElement);

            new Hero(heroElement);

            const title = heroElement.querySelector('h1');
            const subtitle = heroElement.querySelector('h2');

            expect(title).toBeFalsy();
            expect(subtitle).toBeTruthy();
        });

        test('ne devrait pas créer de sous-titre si vide', () => {
            const heroElement = document.createElement('k3ui-hero');
            heroElement.setAttribute('title', 'Titre Test');
            document.body.appendChild(heroElement);

            new Hero(heroElement);

            const title = heroElement.querySelector('h1');
            const subtitle = heroElement.querySelector('h2');

            expect(title).toBeTruthy();
            expect(subtitle).toBeFalsy();
        });
    });

    describe('Gestion des couleurs', () => {
        test('devrait appliquer la couleur par défaut (primary)', () => {
            const heroElement = document.createElement('k3ui-hero');
            heroElement.setAttribute('title', 'Test');
            document.body.appendChild(heroElement);

            new Hero(heroElement);

            // Avec la couleur par défaut, les styles inline ne devraient pas être définis
            expect(heroElement.style.backgroundColor).toBe('');
            expect(heroElement.style.color).toBe('');
        });

        test('devrait appliquer une couleur personnalisée (nom)', () => {
            const heroElement = document.createElement('k3ui-hero');
            heroElement.setAttribute('title', 'Test');
            heroElement.setAttribute('color', 'red');
            document.body.appendChild(heroElement);

            new Hero(heroElement);

            expect(heroElement.style.backgroundColor).toBe('rgb(255, 0, 0)');
            expect(heroElement.style.color).toBe('rgb(255, 255, 255)');
        });

        test('devrait appliquer une couleur personnalisée (code hex)', () => {
            const heroElement = document.createElement('k3ui-hero');
            heroElement.setAttribute('title', 'Test');
            heroElement.setAttribute('color', '#00ff00');
            document.body.appendChild(heroElement);

            new Hero(heroElement);

            expect(heroElement.style.backgroundColor).toBe('rgb(0, 255, 0)');
            expect(heroElement.style.color).toBe('rgb(0, 0, 0)');
        });

        test('devrait appliquer une couleur personnalisée (code hex sans #)', () => {
            const heroElement = document.createElement('k3ui-hero');
            heroElement.setAttribute('title', 'Test');
            heroElement.setAttribute('color', 'ff0000');
            document.body.appendChild(heroElement);

            new Hero(heroElement);

            expect(heroElement.style.backgroundColor).toBe('rgb(255, 0, 0)');
            expect(heroElement.style.color).toBe('rgb(255, 255, 255)');
        });
    });

    describe('Méthodes publiques', () => {
        let heroElement: HTMLElement;
        let hero: Hero;

        beforeEach(() => {
            heroElement = document.createElement('k3ui-hero');
            heroElement.setAttribute('title', 'Titre Initial');
            heroElement.setAttribute('subtitle', 'Sous-titre Initial');
            document.body.appendChild(heroElement);

            hero = new Hero(heroElement);
        });

        test('devrait mettre à jour le titre', () => {
            hero.updateTitle('Nouveau Titre');

            expect(hero.options.title).toBe('Nouveau Titre');
        });

        test('devrait mettre à jour le sous-titre', () => {
            hero.updateSubtitle('Nouveau Sous-titre');

            expect(hero.options.subtitle).toBe('Nouveau Sous-titre');
        });

        test('devrait changer la couleur', () => {
            hero.setColor('blue');

            expect(hero.options.color).toBe('blue');
            expect(heroElement.style.backgroundColor).toBe('rgb(0, 0, 255)');
            expect(heroElement.style.color).toBe('rgb(255, 255, 255)');
        });

        test('devrait détruire le composant', () => {
            // Vérifier que l'instance existe
            const retrievedHero = Hero.getInstance(heroElement);
            expect(retrievedHero).toBe(hero);

            // Détruire le composant
            hero.destroy();

            // Vérifier que l'instance a été détruite (peut être undefined)
            const destroyedHero = Hero.getInstance(heroElement);
            expect(destroyedHero).toBeFalsy();
        });
    });

    describe('Parsing des couleurs', () => {
        test('devrait parser correctement les noms de couleurs', () => {
            const heroElement = document.createElement('k3ui-hero');
            document.body.appendChild(heroElement);

            const hero = new Hero(heroElement);

            // Test avec différentes couleurs
            const colorTests = [
                { input: 'red', expected: 'rgb(255, 0, 0)' },
                { input: 'green', expected: 'rgb(0, 128, 0)' },
                { input: 'blue', expected: 'rgb(0, 0, 255)' },
                { input: 'yellow', expected: 'rgb(255, 255, 0)' },
                { input: 'black', expected: 'rgb(0, 0, 0)' },
                { input: 'white', expected: 'rgb(255, 255, 255)' }
            ];

            colorTests.forEach(({ input, expected }) => {
                hero.setColor(input);
                expect(heroElement.style.backgroundColor).toBe(expected);
            });
        });

        test('devrait calculer correctement le contraste', () => {
            const heroElement = document.createElement('k3ui-hero');
            document.body.appendChild(heroElement);

            const hero = new Hero(heroElement);

            // Test avec des couleurs claires (devrait donner du texte noir)
            hero.setColor('yellow');
            expect(heroElement.style.color).toBe('rgb(0, 0, 0)');

            // Test avec des couleurs sombres (devrait donner du texte blanc)
            hero.setColor('red');
            expect(heroElement.style.color).toBe('rgb(255, 255, 255)');
        });
    });

    describe('Callbacks', () => {
        test('devrait appeler le callback onInit', () => {
            const heroElement = document.createElement('k3ui-hero');
            document.body.appendChild(heroElement);

            const onInitCallback = jest.fn();

            new Hero(heroElement, { onInit: onInitCallback });

            expect(onInitCallback).toHaveBeenCalledWith(heroElement);
        });
    });
});
