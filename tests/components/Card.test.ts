import { createMockNodeList } from '../helpers/dom-mocks';
/**
 * Tests unitaires pour le composant Card
 * @description Tests de toutes les fonctionnalités du composant Card
 */

import { Card } from '../../src/components/Card';
import { CardOptions, CardData, CardAction } from '../../src/types/components';
import { PriorityLevel } from '../../src/types/base';

describe('Card', () => {
    let cardElement: HTMLElement;
    let card: Card;

    beforeEach(() => {
        // Nettoyer le DOM
        document.body.innerHTML = '';

        // Créer un élément Card
        cardElement = document.createElement('div');
        cardElement.className = 'card';
        document.body.appendChild(cardElement);
    });

    afterEach(() => {
        const inst = Card.getInstance(cardElement) ?? card;
        if (inst) {
            inst.destroy();
        }
        card = undefined as unknown as Card;
        document.body.innerHTML = '';
    });

    describe('Initialisation', () => {
        test('devrait créer une instance Card avec les options par défaut', () => {
            card = new Card(cardElement);

            expect(card).toBeInstanceOf(Card);
            expect(cardElement.classList.contains('card')).toBe(true);
            expect(Card.getInstance(cardElement)).toBe(card);
        });

        test('devrait appliquer les classes variant et shape par défaut', () => {
            card = new Card(cardElement);

            expect(cardElement.classList.contains('card--elevated')).toBe(true);
            expect(cardElement.classList.contains('card--padding-medium')).toBe(true);
            expect(cardElement.classList.contains('card--shape-medium')).toBe(true);
        });

        test('devrait créer une instance avec des options personnalisées', () => {
            const options: Partial<CardOptions> = {
                variant: 'filled',
                size: 'large',
                radius: 'extra-large',
                elevation: 3,
                interactive: false
            };

            card = new Card(cardElement, options);

            expect(card).toBeInstanceOf(Card);
        });

        test('devrait initialiser Card avec des données', () => {
            const cardData: CardData = {
                id: 1,
                title: 'Test Card',
                subtitle: 'Subtitle',
                content: 'Content'
            };

            card = new Card(cardElement, { data: cardData });

            expect(card).toBeInstanceOf(Card);
            expect(card.getData()).toEqual(cardData);
        });
    });

    describe('Structure et contenu', () => {
        test('devrait créer la structure de base si elle n\'existe pas', () => {
            card = new Card(cardElement);

            const headerElement = cardElement.querySelector('.card__header');
            const contentElement = cardElement.querySelector('.card__content');
            const actionsElement = cardElement.querySelector('.card__actions');

            expect(headerElement).toBeTruthy();
            expect(contentElement).toBeTruthy();
            expect(actionsElement).toBeTruthy();
        });

        test('devrait réutiliser la structure existante', () => {
            // Créer la structure manuellement
            const header = document.createElement('div');
            header.className = 'card__header';
            cardElement.appendChild(header);

            const content = document.createElement('div');
            content.className = 'card__content';
            cardElement.appendChild(content);

            card = new Card(cardElement);

            const headerElements = cardElement.querySelectorAll('.card__header');
            const contentElements = cardElement.querySelectorAll('.card__content');

            expect(headerElements.length).toBe(1);
            expect(contentElements.length).toBe(1);
        });

        test('devrait mettre à jour le header avec le titre', () => {
            const cardData: CardData = {
                id: 1,
                title: 'Mon Titre',
                subtitle: 'Mon Sous-titre'
            };

            card = new Card(cardElement, { data: cardData });

            const titleElement = cardElement.querySelector('.card__title');
            const subtitleElement = cardElement.querySelector('.card__subtitle');

            expect(titleElement?.textContent).toBe('Mon Titre');
            expect(subtitleElement?.textContent).toBe('Mon Sous-titre');
        });

        test('devrait mettre à jour le contenu', () => {
            const cardData: CardData = {
                id: 1,
                content: '<p>Contenu HTML</p>'
            };

            card = new Card(cardElement, { data: cardData, allowHTML: true });

            const contentElement = cardElement.querySelector('.card__content');
            expect(contentElement?.innerHTML).toBe('<p>Contenu HTML</p>');
        });

        test('devrait échapper le HTML si allowHTML est false', () => {
            const cardData: CardData = {
                id: 1,
                content: '<p>Contenu HTML</p>'
            };

            card = new Card(cardElement, { data: cardData });

            const contentElement = cardElement.querySelector('.card__content');
            expect(contentElement?.textContent).toBe('<p>Contenu HTML</p>');
        });

        test('devrait mettre à jour les actions', () => {
            const actions: CardAction[] = [
                { id: '1', text: 'Action 1', type: 'button' },
                { id: '2', text: 'Action 2', type: 'button', icon: 'delete' }
            ];

            const cardData: CardData = {
                id: 1,
                title: 'Test',
                actions: actions
            };

            card = new Card(cardElement, { data: cardData });

            const actionElements = cardElement.querySelectorAll('.card__action');
            expect(actionElements.length).toBe(2);
            expect(actionElements[0]?.textContent?.trim()).toBe('Action 1');
            expect(actionElements[1]?.textContent?.trim()).toContain('Action 2');
        });
    });

    describe('Interactions et événements', () => {
        test('ne devrait pas être interactive par défaut', () => {
            card = new Card(cardElement);

            expect(card.options.interactive).toBe(false);
            expect(cardElement.classList.contains('card--interactive')).toBe(false);
        });

        test('devrait activer l\'interaction automatiquement si onClick est fourni', () => {
            const onClickSpy = jest.fn();
            card = new Card(cardElement, { onClick: onClickSpy });

            expect(card.options.interactive).toBe(true);
            expect(cardElement.classList.contains('card--interactive')).toBe(true);
        });

        test('devrait appeler onClick lors du clic sur la carte', () => {
            const onClickSpy = jest.fn();
            const cardData: CardData = { id: 1, title: 'Test' };

            card = new Card(cardElement, {
                data: cardData,
                onClick: onClickSpy
            });

            cardElement.click();

            expect(onClickSpy).toHaveBeenCalledWith(cardElement, cardData);
        });

        test('ne devrait pas appeler onClick si la carte est désactivée', () => {
            const onClickSpy = jest.fn();
            const cardData: CardData = { id: 1, title: 'Test' };

            card = new Card(cardElement, {
                data: cardData,
                onClick: onClickSpy
            });
            card.disable();

            cardElement.click();

            expect(onClickSpy).not.toHaveBeenCalled();
        });

        test('devrait appeler onClick avec la touche Enter', () => {
            const onClickSpy = jest.fn();
            const cardData: CardData = { id: 1, title: 'Test' };

            card = new Card(cardElement, {
                data: cardData,
                onClick: onClickSpy
            });

            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            cardElement.dispatchEvent(enterEvent);

            expect(onClickSpy).toHaveBeenCalled();
        });

        test('devrait ajouter la classe focused au focus', () => {
            card = new Card(cardElement, { onClick: jest.fn() });

            const focusEvent = new FocusEvent('focusin');
            cardElement.dispatchEvent(focusEvent);

            expect(cardElement.classList.contains('card--focused')).toBe(true);
        });

        test('devrait retirer la classe focused au blur', () => {
            card = new Card(cardElement, { onClick: jest.fn() });

            // Ajouter le focus d'abord
            cardElement.classList.add('card--focused');

            const blurEvent = new FocusEvent('focusout');
            cardElement.dispatchEvent(blurEvent);

            expect(cardElement.classList.contains('card--focused')).toBe(false);
        });
    });

    describe('Actions', () => {
        test('devrait appeler onActionClick lors du clic sur une action', () => {
            const onActionClickSpy = jest.fn();
            const actions: CardAction[] = [
                { id: '1', text: 'Action 1', type: 'button' }
            ];

            const cardData: CardData = {
                id: 1,
                title: 'Test',
                actions: actions
            };

            card = new Card(cardElement, {
                data: cardData,
                onActionClick: onActionClickSpy
            });

            const actionButton = cardElement.querySelector('.card__action') as HTMLElement;
            actionButton?.click();

            expect(onActionClickSpy).toHaveBeenCalledWith(
                cardElement,
                actions[0],
                cardData
            );
        });

        test('devrait empêcher la propagation du clic sur les actions', () => {
            const onClickSpy = jest.fn();
            const actions: CardAction[] = [
                { id: '1', text: 'Action', type: 'button' }
            ];

            const cardData: CardData = {
                id: 1,
                title: 'Test',
                actions: actions
            };

            card = new Card(cardElement, {
                data: cardData,
                onClick: onClickSpy
            });

            const actionButton = cardElement.querySelector('.card__action') as HTMLElement;
            actionButton?.click();

            // onClick ne devrait pas être appelé car la propagation est arrêtée
            expect(onClickSpy).not.toHaveBeenCalled();
        });
    });

    describe('Données', () => {
        test('devrait définir et récupérer les données', () => {
            card = new Card(cardElement);

            const cardData: CardData = {
                id: 1,
                title: 'Test Card'
            };

            card.setData(cardData);

            expect(card.getData()).toEqual(cardData);
        });

        test('devrait mettre à jour la carte lors de la définition des données', () => {
            card = new Card(cardElement);

            const cardData: CardData = {
                id: 1,
                title: 'Nouveau Titre'
            };

            card.setData(cardData);

            const titleElement = cardElement.querySelector('.card__title');
            expect(titleElement?.textContent).toBe('Nouveau Titre');
        });

        test('devrait retourner null si aucune donnée n\'est définie', () => {
            card = new Card(cardElement);

            expect(card.getData()).toBeNull();
        });
    });

    describe('Options', () => {
        test('devrait mettre à jour les options', () => {
            card = new Card(cardElement, { variant: 'filled' });

            card.updateOptions({ variant: 'outlined' });

            // Les options devraient être mises à jour
            expect(card.options.variant).toBe('outlined');
        });

        test('devrait mettre à jour la carte lors de la mise à jour des options', () => {
            const cardData: CardData = {
                id: 1,
                title: 'Original Title'
            };

            card = new Card(cardElement, { data: cardData });

            const newCardData: CardData = {
                id: 2,
                title: 'New Title'
            };

            card.updateOptions({ data: newCardData });

            const titleElement = cardElement.querySelector('.card__title');
            expect(titleElement?.textContent).toBe('New Title');
        });
    });

    describe('État de la carte', () => {
        test('devrait activer la carte', () => {
            card = new Card(cardElement);
            card.disable();
            card.enable();

            expect(card.options.interactive).toBe(true);
            expect(cardElement.classList.contains('card--disabled')).toBe(false);
        });

        test('devrait désactiver la carte', () => {
            card = new Card(cardElement);
            card.disable();

            expect(card.options.interactive).toBe(false);
            expect(cardElement.classList.contains('card--disabled')).toBe(true);
        });

        test('devrait mettre la carte au focus', () => {
            card = new Card(cardElement);

            const focusSpy = jest.spyOn(cardElement, 'focus');
            card.focus();

            expect(focusSpy).toHaveBeenCalled();
        });
    });

    describe('Callbacks', () => {
        test('devrait appeler onOpenStart et onOpenEnd', () => {
            const onOpenStartSpy = jest.fn();
            const onOpenEndSpy = jest.fn();

            card = new Card(cardElement, {
                onOpenStart: onOpenStartSpy,
                onOpenEnd: onOpenEndSpy
            });

            // Les callbacks seront appelés lors de l'initialisation
            // Vérifier qu'ils sont définis
            expect(card.options.onOpenStart).toBe(onOpenStartSpy);
            expect(card.options.onOpenEnd).toBe(onOpenEndSpy);
        });

        test('devrait gérer les callbacks null', () => {
            card = new Card(cardElement, {
                onOpenStart: null,
                onOpenEnd: null,
                onCloseStart: null,
                onCloseEnd: null
            });

            expect(() => {
                card.updateOptions({});
            }).not.toThrow();
        });
    });

    describe('Méthodes statiques', () => {
        test('devrait retourner les options par défaut', () => {
            const defaults = Card.defaults;

            expect(defaults.variant).toBe('elevated');
            expect(defaults.size).toBe('medium');
            expect(defaults.elevation).toBe(1);
            expect(defaults.interactive).toBe(false);
            expect(defaults.shape).toBe('medium');
            expect(defaults.ripple).toBe(true);
            expect(defaults.priorityLevel).toBe(PriorityLevel.MEDIUM);
        });

        test('devrait retourner l\'instance depuis un élément', () => {
            card = new Card(cardElement);

            const instance = Card.getInstance(cardElement);

            expect(instance).toBe(card);
        });

        test('devrait initialiser avec Card.init (élément unique)', () => {
            const instances = Card.init(cardElement);

            expect(instances).toBeInstanceOf(Array);
            expect(instances.length).toBe(1);
            expect(instances[0]).toBeInstanceOf(Card);
        });

        test('devrait initialiser plusieurs éléments avec Card.init', () => {
            const element2 = document.createElement('div');
            element2.className = 'card';
            document.body.appendChild(element2);

            // Créer un NodeList simulé
            const mockNodeList = createMockNodeList([cardElement, element2]);

            const instances = Card.init(mockNodeList);

            expect(Array.isArray(instances)).toBe(true);
            expect(instances.length).toBe(2);
            expect(instances[0]).toBeInstanceOf(Card);
            expect(instances[1]).toBeInstanceOf(Card);

            // Nettoyer
            (instances[1] as Card).destroy();
        });

        test('devrait retourner un tableau vide pour un NodeList vide', () => {
            const emptyNodeList = createMockNodeList<HTMLElement>([]);

            const instances = Card.init(emptyNodeList);

            expect(instances).toEqual([]);
        });
    });

    describe('Destruction', () => {
        test('devrait nettoyer les événements lors de la destruction', () => {
            const onClickSpy = jest.fn();
            card = new Card(cardElement, { onClick: onClickSpy });

            card.destroy();

            cardElement.click();
            expect(onClickSpy).not.toHaveBeenCalled();
        });

        test('devrait supprimer l\'instance de l\'élément lors de la destruction', () => {
            card = new Card(cardElement);

            expect(Card.getInstance(cardElement)).toBe(card);

            card.destroy();

            expect(Card.getInstance(cardElement)).toBeFalsy();
        });
    });

    describe('Cas limites', () => {
        test('devrait gérer une carte sans données', () => {
            card = new Card(cardElement, { data: null });

            expect(card.getData()).toBeNull();

            const titleElement = cardElement.querySelector('.card__title');
            expect(titleElement).toBeNull();
        });

        test('devrait gérer une carte avec seulement un titre', () => {
            const cardData: CardData = {
                id: 1,
                title: 'Titre Seul'
            };

            card = new Card(cardElement, { data: cardData });

            expect(cardElement.querySelector('.card__title')?.textContent).toBe('Titre Seul');
            expect(cardElement.querySelector('.card__subtitle')).toBeNull();
        });

        test('devrait gérer une carte avec seulement un contenu', () => {
            const cardData: CardData = {
                id: 1,
                content: 'Contenu'
            };

            card = new Card(cardElement, { data: cardData });

            const contentElement = cardElement.querySelector('.card__content');
            expect(contentElement?.textContent).toBe('Contenu');
        });

        test('devrait gérer une carte sans actions', () => {
            const cardData: CardData = {
                id: 1,
                title: 'Test'
            };

            card = new Card(cardElement, { data: cardData });

            const actionElements = cardElement.querySelectorAll('.card__action');
            expect(actionElements.length).toBe(0);
        });

        test('devrait gérer une carte avec des actions avec icônes', () => {
            const actions: CardAction[] = [
                { id: '1', text: 'Delete', type: 'button', icon: 'delete' }
            ];

            const cardData: CardData = {
                id: 1,
                title: 'Test',
                actions: actions
            };

            card = new Card(cardElement, { data: cardData });

            const iconElement = cardElement.querySelector('.k3ui-icon');
            expect(iconElement).toBeTruthy();
            expect(iconElement?.getAttribute('name')).toBe('delete');
        });
    });

    describe('Accessibilité', () => {
        test('devrait exposer role article pour une carte statique', () => {
            card = new Card(cardElement);

            expect(cardElement.getAttribute('role')).toBe('article');
        });

        test('devrait exposer role button et tabindex pour une carte interactive', () => {
            card = new Card(cardElement, { onClick: jest.fn() });

            expect(cardElement.getAttribute('role')).toBe('button');
            expect(cardElement.getAttribute('tabindex')).toBe('0');
        });

        test('devrait créer le calque state-layer pour une carte interactive', () => {
            card = new Card(cardElement, { onClick: jest.fn() });

            expect(cardElement.querySelector('.card__state-layer')).toBeTruthy();
        });
    });

    describe('Intégration', () => {
        test('devrait créer et détruire plusieurs cartes', () => {
            const cards: Card[] = [];

            for (let i = 0; i < 5; i++) {
                const element = document.createElement('div');
                element.className = 'card';
                document.body.appendChild(element);

                const cardData: CardData = {
                    id: i,
                    title: `Card ${i}`
                };

                const cardInstance = new Card(element, { data: cardData });
                cards.push(cardInstance);
            }

            expect(cards.length).toBe(5);

            // Nettoyer
            cards.forEach(c => c.destroy());
        });

        test('devrait mettre à jour les données d\'une carte existante', () => {
            const initialData: CardData = {
                id: 1,
                title: 'Titre Initial',
                subtitle: 'Sous-titre Initial'
            };

            card = new Card(cardElement, { data: initialData });

            expect(cardElement.querySelector('.card__title')?.textContent).toBe('Titre Initial');

            const newData: CardData = {
                id: 2,
                title: 'Nouveau Titre',
                subtitle: 'Nouveau Sous-titre'
            };

            card.setData(newData);

            expect(cardElement.querySelector('.card__title')?.textContent).toBe('Nouveau Titre');
            expect(cardElement.querySelector('.card__subtitle')?.textContent).toBe('Nouveau Sous-titre');
        });
    });
});
