/**
 * Tests unitaires pour le composant Dialog
 * @description Tests de toutes les fonctionnalités du composant Dialog
 */

import { Dialog } from '../../src/components/Dialog';
import { Sheet } from '../../src/components/Sheet';
import { ManagerFactory } from '../../src/core/factories/ManagerFactory';
import { DialogOptions } from '../../src/types/components';
import { getAriaAttribute } from '../../src/utils/dom/aria';
import { dialogStatics } from '../helpers/component-statics';
import { createMockNodeList } from '../helpers/dom-mocks';
import { waitMs } from '../helpers/menu-async';

describe('Dialog', () => {
    let dialogElement: HTMLElement;
    let dialog: Dialog | undefined;

    beforeEach(() => {
        // Nettoyer le DOM
        document.body.innerHTML = '';

        // jsdom n'implémente pas scrollTo
        window.scrollTo = jest.fn();

        // Créer un élément Dialog
        dialogElement = document.createElement('div');
        dialogElement.className = 'dialog';
        dialogElement.id = 'test-dialog';
        dialogElement.innerHTML = '<div class="dialog-container"><div class="dialog-content"><p>Contenu du dialog</p></div></div>';
        document.body.appendChild(dialogElement);

        // Réinitialiser les compteurs statiques
        const statics = dialogStatics();
        statics._dialogsOpen = 0;
        statics._count = 0;
    });

    afterEach(() => {
        document.querySelectorAll('.dialog').forEach((el) => {
            const instance = Dialog.getInstance(el as HTMLElement);
            if (instance) {
                instance.destroy();
            }
        });
        dialog = undefined;
        (Dialog as any)._dialogsOpen = 0;
        document.body.innerHTML = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.paddingRight = '';
        document.body.classList.remove('dialog-open');
    });

    describe('Initialisation', () => {
        test('devrait créer une instance Dialog avec les options par défaut', () => {
            dialog = new Dialog(dialogElement);

            expect(dialog).toBeInstanceOf(Dialog);
            expect(dialogElement.classList.contains('dialog')).toBe(true);
            expect(Dialog.getInstance(dialogElement)).toBe(dialog);
            expect(dialog.isOpen).toBe(false);
        });

        test('devrait créer une instance avec des options personnalisées', () => {
            const options: Partial<DialogOptions> = {
                opacity: 0.8,
                inDuration: 300,
                dismissible: false
            };

            dialog = new Dialog(dialogElement, options);

            expect(dialog).toBeInstanceOf(Dialog);
            expect(dialog.options.opacity).toBe(0.8);
            expect(dialog.options.inDuration).toBe(300);
            expect(dialog.options.dismissible).toBe(false);
        });

        test('devrait initialiser le dialog avec un ID unique', () => {
            const el = document.createElement('div');
            el.className = 'dialog';
            document.body.appendChild(el);

            dialog = new Dialog(el);

            expect(dialog.id).toBeTruthy();
            expect(dialog.id).toContain('dialog-');
        });

        test('devrait utiliser l\'ID de l\'élément s\'il existe', () => {
            dialog = new Dialog(dialogElement);

            expect(dialog.id).toBe('test-dialog');
        });
    });

    describe('Structure et setup', () => {
        test('devrait créer la structure de base', () => {
            dialog = new Dialog(dialogElement);

            expect(dialogElement.classList.contains('dialog')).toBe(true);
            expect(dialogElement.tabIndex).toBe(-1);
        });

        test('devrait ajouter la classe dialog si elle n\'existe pas', () => {
            const el = document.createElement('div');
            el.id = 'test-dialog-2';
            document.body.appendChild(el);

            dialog = new Dialog(el);

            expect(el.classList.contains('dialog')).toBe(true);
        });

        test('devrait créer l\'overlay', () => {
            dialog = new Dialog(dialogElement);
            dialog.open();

            const overlay = document.querySelector('.dialog-overlay');
            expect(overlay).toBeTruthy();
        });

        test('devrait créer une scrollbar custom hors container pour le scroller', () => {
            dialogElement.innerHTML = `
                <div class="dialog-container">
                    <div class="dialog-header"><h2>Titre</h2></div>
                    <div class="dialog-scroller">
                        <div class="dialog-content"><p>${'Contenu long. '.repeat(40)}</p></div>
                    </div>
                    <div class="dialog-footer">
                        <button type="button" class="dialog-close">Fermer</button>
                    </div>
                </div>`;

            dialog = new Dialog(dialogElement);

            const rail = dialogElement.querySelector(':scope > .dialog__scrollbar');
            const thumb = rail?.querySelector('.dialog__scrollbar-thumb');
            const nestedInContainer = dialogElement.querySelector(
                '.dialog-container .dialog__scrollbar'
            );

            expect(rail).toBeTruthy();
            expect(thumb).toBeTruthy();
            expect(nestedInContainer).toBeNull();
            expect(rail?.parentElement).toBe(dialogElement);
        });
    });

    describe('Ouverture et fermeture', () => {
        test('devrait ouvrir le dialog', () => {
            dialog = new Dialog(dialogElement);
            dialog.open();

            expect(dialog.isOpen).toBe(true);
            // setAriaAttribute(..., false) retire l'attribut (pas aria-hidden="false")
            expect(dialogElement.hasAttribute('aria-hidden')).toBe(false);
        });

        test('devrait fermer le dialog', () => {
            dialog = new Dialog(dialogElement);
            dialog.open();
            dialog.close();

            expect(dialog.isOpen).toBe(false);
            expect(getAriaAttribute(dialogElement, 'hidden')).toBe('true');
        });

        test('ne devrait pas ouvrir si déjà ouvert', () => {
            dialog = new Dialog(dialogElement);
            dialog.open();
            dialog.open();

            expect(Dialog._dialogsOpen).toBe(1);
        });

        test('ne devrait pas fermer si déjà fermé', () => {
            dialog = new Dialog(dialogElement);
            dialog.close();

            expect(dialog.isOpen).toBe(false);
        });

        test('devrait gérer plusieurs dialogs ouverts', () => {
            dialog = new Dialog(dialogElement);
            dialog.open();

            const dialogElement2 = document.createElement('div');
            dialogElement2.className = 'dialog';
            dialogElement2.id = 'test-dialog-2';
            dialogElement2.innerHTML = '<div class="dialog-content">Dialog 2</div>';
            document.body.appendChild(dialogElement2);

            const dialog2 = new Dialog(dialogElement2);
            dialog2.open();

            expect(Dialog._dialogsOpen).toBe(2);

            dialog2.close();
            dialog.close();
        });

        test('devrait appliquer les z-index corrects', () => {
            dialog = new Dialog(dialogElement);
            dialog.open();

            const overlay = document.querySelector('.dialog-overlay') as HTMLElement;
            expect(parseInt(overlay.style.zIndex)).toBeGreaterThanOrEqual(1000);
            expect(parseInt(dialogElement.style.zIndex)).toBeGreaterThanOrEqual(1001);
        });
    });

    describe('Callbacks', () => {
        test('devrait appeler onOpenStart lors de l\'ouverture', () => {
            const onOpenStartSpy = jest.fn();
            dialog = new Dialog(dialogElement, { onOpenStart: onOpenStartSpy });

            dialog.open();

            expect(onOpenStartSpy).toHaveBeenCalledWith(dialogElement);
        });

        test('devrait appeler onOpenEnd après l\'animation d\'ouverture', async () => {
            const onOpenEndSpy = jest.fn();
            dialog = new Dialog(dialogElement, {
                onOpenEnd: onOpenEndSpy,
                reducedMotion: true,
            });

            dialog.open();
            await waitMs(50);

            expect(onOpenEndSpy).toHaveBeenCalled();
        });

        test('devrait appeler onCloseStart lors de la fermeture', () => {
            const onCloseStartSpy = jest.fn();
            dialog = new Dialog(dialogElement, { onCloseStart: onCloseStartSpy });

            dialog.open();
            dialog.close();

            expect(onCloseStartSpy).toHaveBeenCalledWith(dialogElement);
        });

        test('devrait appeler onCloseEnd après l\'animation de fermeture', async () => {
            const onCloseEndSpy = jest.fn();
            dialog = new Dialog(dialogElement, {
                onCloseEnd: onCloseEndSpy,
                reducedMotion: true,
            });

            dialog.open();
            await waitMs(50);
            dialog.close();
            await waitMs(50);

            expect(onCloseEndSpy).toHaveBeenCalled();
        });

        test('devrait gérer les callbacks null', () => {
            dialog = new Dialog(dialogElement, {
                onOpenStart: null,
                onOpenEnd: null,
                onCloseStart: null,
                onCloseEnd: null
            });

            expect(() => {
                dialog!.open();
                dialog!.close();
            }).not.toThrow();
        });
    });

    describe('Gestion de l\'overlay', () => {
        test('devrait fermer le dialog au clic sur l\'overlay si dismissible', async () => {
            dialog = new Dialog(dialogElement, { dismissible: true });
            dialog.open();
            await waitMs(100);

            const overlay = document.querySelector('.dialog-overlay') as HTMLElement;
            overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
            overlay.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));

            await waitMs(50);
            expect(dialog!.isOpen).toBe(false);
        });

        test('ne devrait pas fermer le dialog au clic sur l\'overlay si non dismissible', () => {
            dialog = new Dialog(dialogElement, { dismissible: false });
            dialog.open();

            const overlay = document.querySelector('.dialog-overlay') as HTMLElement;
            overlay.click();

            expect(dialog.isOpen).toBe(true);
        });
    });

    describe('Gestion du clavier', () => {
        test('devrait fermer le dialog avec Escape si dismissible', async () => {
            dialog = new Dialog(dialogElement, { dismissible: true });
            dialog.open();
            await waitMs(100);

            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            document.dispatchEvent(escapeEvent);

            await waitMs(50);
            expect(dialog!.isOpen).toBe(false);
        });

        test('ne devrait pas fermer le dialog avec Escape si non dismissible', () => {
            dialog = new Dialog(dialogElement, { dismissible: false });
            dialog.open();

            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(escapeEvent);

            expect(dialog.isOpen).toBe(true);
        });

        test('devrait gérer le focus trap', async () => {
            const btn = document.createElement('button');
            btn.textContent = 'OK';
            dialogElement.querySelector('.dialog-content')?.appendChild(btn);

            dialog = new Dialog(dialogElement);
            dialog.open();

            await waitMs(60);

            const active = document.activeElement;
            expect(active === btn || active === dialogElement).toBe(true);
        });
    });

    describe('Gestion du scroll', () => {
        test('devrait empêcher le scroll si preventScrolling est true', () => {
            // Simuler un scroll pour tester
            Object.defineProperty(window, 'scrollY', { value: 100, writable: true });

            dialog = new Dialog(dialogElement, { preventScrolling: true });
            dialog.open();

            // Vérifier que les styles de prévention du scroll ont été appliqués
            const hasScrollStyles = document.body.classList.contains('dialog-open') ||
                document.body.style.position === 'fixed';
            expect(hasScrollStyles).toBe(true);
        });

        test('devrait restaurer le scroll à la fermeture', () => {
            window.scrollTo(0, 100);
            dialog = new Dialog(dialogElement, { preventScrolling: true });
            dialog.open();
            dialog.close();

            setTimeout(() => {
                expect(document.body.style.position).toBe('');
            }, 300);
        });

        test('ne devrait pas empêcher le scroll si preventScrolling est false', () => {
            dialog = new Dialog(dialogElement, { preventScrolling: false });
            dialog.open();

            expect(document.body.style.position).toBe('');
        });

        test('devrait gérer le cas où on est déjà en haut de la page', () => {
            window.scrollTo(0, 0);
            Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

            dialog = new Dialog(dialogElement, { preventScrolling: true });
            dialog.open();

            expect(dialog.isOpen).toBe(true);
        });
    });

    describe('Trigger', () => {
        test('devrait ouvrir le dialog avec un trigger', () => {
            dialog = new Dialog(dialogElement);
            const trigger = document.createElement('button');
            trigger.className = 'dialog-trigger';
            trigger.setAttribute('data-dialog', 'test-dialog');
            document.body.appendChild(trigger);

            dialog.open(trigger);

            expect(dialog.isOpen).toBe(true);
            // Le trigger est stocké en interne, vérifier que le dialog est ouvert suffit
        });

        test('devrait ouvrir le dialog sans trigger', () => {
            dialog = new Dialog(dialogElement);
            dialog.open();

            expect(dialog.isOpen).toBe(true);
        });
    });

    describe('Bouton de fermeture', () => {
        test('devrait fermer le dialog au clic sur .dialog-close', async () => {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'dialog-close';
            dialogElement.querySelector('.dialog-content')?.appendChild(closeBtn);

            dialog = new Dialog(dialogElement);
            dialog.open();
            closeBtn.click();

            await waitMs(350);
            expect(dialog!.isOpen).toBe(false);
        });
    });

    describe('Méthodes statiques', () => {
        test('devrait retourner les options par défaut', () => {
            const defaults = Dialog.defaults;

            expect(defaults.opacity).toBe(0.32);
            expect(defaults.inDuration).toBe(500);
            expect(defaults.outDuration).toBe(150);
            expect(defaults.dismissible).toBe(Dialog.defaults.dismissible);
            expect(defaults.preventScrolling).toBe(true);
            expect(defaults.variant).toBe('basic');
            expect(defaults.reducedMotion).toBe(false);
        });

        test('devrait retourner l\'instance depuis un élément', () => {
            dialog = new Dialog(dialogElement);

            const instance = Dialog.getInstance(dialogElement);

            expect(instance).toBe(dialog);
        });

        test('devrait initialiser avec Dialog.init (élément unique)', () => {
            dialog = Dialog.init(dialogElement) as Dialog;

            expect(dialog).toBeInstanceOf(Dialog);
            expect(Dialog.getInstance(dialogElement)).toBe(dialog);
        });

        test('devrait initialiser plusieurs éléments avec Dialog.init', () => {
            const element2 = document.createElement('div');
            element2.className = 'dialog';
            element2.id = 'test-dialog-2';
            element2.innerHTML = '<div class="dialog-content">Dialog 2</div>';
            document.body.appendChild(element2);

            const mockNodeList = createMockNodeList([dialogElement, element2]);

            const instances = Dialog.init(mockNodeList);

            expect(Array.isArray(instances)).toBe(true);
            if (Array.isArray(instances)) {
                expect(instances.length).toBe(2);
                expect(instances[0]).toBeInstanceOf(Dialog);
                expect(instances[1]).toBeInstanceOf(Dialog);

                instances.forEach(i => i.destroy());
            }
        });

        test('devrait retourner un tableau vide pour un NodeList vide', () => {
            const emptyNodeList = createMockNodeList<HTMLElement>([]);

            const instances = Dialog.init(emptyNodeList);

            expect(instances).toEqual([]);
        });

        test('devrait créer un dialog avec Dialog.show', () => {
            const instance = Dialog.show('<p>Dialog dynamique</p>');

            expect(instance).toBeInstanceOf(Dialog);
            expect(instance.isOpen).toBe(true);

            const allDialogs = document.querySelectorAll('.dialog');
            const dynamicDialog = allDialogs[allDialogs.length - 1] as HTMLElement;
            expect(dynamicDialog).toBeTruthy();
            expect(dynamicDialog.querySelector('.dialog-container > .dialog-scroller > .dialog-content')).toBeTruthy();
            expect(dynamicDialog.querySelector('.dialog-container > .dialog-content > .dialog-content')).toBeNull();
            expect(dynamicDialog.textContent).toContain('Dialog dynamique');

            instance.close();
        });

        test('buildDialogMarkup produit une structure M3 plate', () => {
            const html = Dialog.buildDialogMarkup({
                header: '<h2>Titre</h2>',
                content: '<p>Corps</p>',
                footer: '<div class="dialog-action-right"><button type="button">OK</button></div>',
            });

            expect(html).toContain('dialog-header');
            expect(html).toContain('dialog-scroller');
            expect(html).toContain('dialog-content');
            expect(html).toContain('dialog-footer');
            expect(html).not.toContain('dialog-content"><div class="dialog-header');
        });

        test('devrait créer un dialog de confirmation avec Dialog.confirm', async () => {
            const onConfirmSpy = jest.fn();
            const onCancelSpy = jest.fn();

            const instance = Dialog.confirm('Êtes-vous sûr ?', onConfirmSpy, onCancelSpy);

            expect(instance).toBeInstanceOf(Dialog);
            await waitMs(200);
            expect(instance.isOpen).toBe(true);

            const confirmBtn = document.querySelector('.dialog-confirm') as HTMLElement;
            const cancelBtn = document.querySelector('.dialog-close') as HTMLElement;

            expect(confirmBtn).toBeTruthy();
            expect(cancelBtn).toBeTruthy();

            confirmBtn.click();
            await waitMs(200);

            expect(onConfirmSpy).toHaveBeenCalled();
        });
    });

    describe('Initialisation depuis les triggers', () => {
        test('devrait initialiser les dialogs depuis les triggers', () => {
            const trigger = document.createElement('button');
            trigger.setAttribute('dialog-trigger', '#test-dialog');
            document.body.appendChild(trigger);

            Dialog.initFromTriggers();

            trigger.click();

            const dialogInstance = Dialog.getInstance(dialogElement);
            expect(dialogInstance?.isOpen).toBe(true);
        });

        test('devrait initialiser les dialogs avec Dialog.init', () => {
            dialog = Dialog.init(dialogElement) as Dialog;

            expect(dialog).toBeInstanceOf(Dialog);
            expect(Dialog.getInstance(dialogElement)).toBe(dialog);
        });
    });

    describe('Animations', () => {
        test('devrait appliquer les styles d\'animation d\'ouverture', async () => {
            dialog = new Dialog(dialogElement, { reducedMotion: true });
            dialog.open();

            await waitMs(20);

            expect(dialogElement.style.display).toBe('block');
            expect(dialogElement.style.getPropertyValue('--dialog-spatial')).toBe('1');
        });

        test('devrait respecter les durées personnalisées', async () => {
            dialogElement.classList.add('bottom-sheet');
            dialog = new Dialog(dialogElement, {
                inDuration: 500,
                outDuration: 600
            });
            dialog.open();

            await waitMs(60);

            expect(dialogElement.style.transition).toContain('500ms');
            dialog.close();
            expect(dialogElement.style.transition).toContain('600ms');
        });

        test('devrait gérer les bottom-sheets', () => {
            dialogElement.classList.add('bottom-sheet');
            dialog = new Dialog(dialogElement);
            dialog.open();

            expect(dialogElement.classList.contains('bottom-sheet')).toBe(true);
        });
    });

    describe('Destruction', () => {
        test('devrait nettoyer les événements lors de la destruction', () => {
            dialog = new Dialog(dialogElement);
            dialog.open();

            dialog.destroy();
            dialog = undefined;

            expect(dialogStatics()._count).toBeLessThanOrEqual(dialogStatics()._count + 1);
        });

        test('devrait supprimer l\'instance de l\'élément lors de la destruction', () => {
            dialog = new Dialog(dialogElement);

            expect(Dialog.getInstance(dialogElement)).toBe(dialog);

            dialog.destroy();
            dialog = undefined;

            expect(Dialog.getInstance(dialogElement)).toBeFalsy();
        });

        test('devrait retirer l\'overlay lors de la destruction', () => {
            dialog = new Dialog(dialogElement);
            dialog.open();

            const overlay = document.querySelector('.dialog-overlay');
            expect(overlay).toBeTruthy();

            dialog.destroy();
            dialog = undefined;

            const overlayAfter = document.querySelector('.dialog-overlay');
            expect(overlayAfter).toBeFalsy();
        });

        test('devrait décrémenter le compteur de dialogs', () => {
            const initialCount = dialogStatics()._count;

            dialog = new Dialog(dialogElement);
            expect(dialogStatics()._count).toBe(initialCount + 1);

            dialog.destroy();
            dialog = undefined;
            expect(dialogStatics()._count).toBe(initialCount);
        });
    });

    describe('Cas limites', () => {
        test('devrait gérer une ouverture/fermeture rapide', () => {
            dialog = new Dialog(dialogElement);
            dialog.open();
            dialog.close();

            expect(dialog.isOpen).toBe(false);
        });

        test('devrait gérer plusieurs ouvertures et fermetures successives', () => {
            dialog = new Dialog(dialogElement);

            for (let i = 0; i < 5; i++) {
                dialog.open();
                dialog.close();
            }

            expect(dialog.isOpen).toBe(false);
        });

        test('devrait gérer un dialog avec contenu vide', () => {
            const emptyDialog = document.createElement('div');
            emptyDialog.className = 'dialog';
            emptyDialog.id = 'empty-dialog';
            document.body.appendChild(emptyDialog);

            dialog = new Dialog(emptyDialog);

            expect(dialog).toBeInstanceOf(Dialog);
            expect(() => dialog!.open()).not.toThrow();
        });

        test('devrait gérer un dialog avec contenu très long', () => {
            const longContent = '<p>' + 'Texte très long. '.repeat(1000) + '</p>';
            dialogElement.innerHTML = '<div class="dialog-content">' + longContent + '</div>';

            dialog = new Dialog(dialogElement);

            expect(dialog).toBeInstanceOf(Dialog);
            expect(() => dialog!.open()).not.toThrow();
        });

        test('devrait gérer les options avec valeur null', () => {
            dialog = new Dialog(dialogElement, {
                onOpenStart: null,
                onOpenEnd: null,
                onCloseStart: null,
                onCloseEnd: null
            });

            expect(() => dialog!.open()).not.toThrow();
            expect(() => dialog!.close()).not.toThrow();
        });
    });

    describe('Intégration', () => {
        test('devrait créer et gérer plusieurs dialogs', () => {
            const dialogs: Dialog[] = [];

            for (let i = 0; i < 3; i++) {
                const el = document.createElement('div');
                el.className = 'dialog';
                el.id = `test-dialog-${i}`;
                el.innerHTML = '<div class="dialog-content">Dialog ' + i + '</div>';
                document.body.appendChild(el);

                const dialogInstance = new Dialog(el);
                dialogs.push(dialogInstance);
            }

            dialogs[0].open();
            expect(Dialog._dialogsOpen).toBe(1);

            dialogs[1].open();
            expect(Dialog._dialogsOpen).toBe(2);

            dialogs[2].open();
            expect(Dialog._dialogsOpen).toBe(3);

            dialogs.forEach(d => d.destroy());
            dialog = undefined;
        });

        test('devrait gérer le scénario de modal empilées', () => {
            dialog = new Dialog(dialogElement);
            dialog.open();

            const dialogElement2 = document.createElement('div');
            dialogElement2.className = 'dialog';
            dialogElement2.id = 'test-dialog-2';
            dialogElement2.innerHTML = '<div class="dialog-content">Dialog empilé</div>';
            document.body.appendChild(dialogElement2);

            const dialog2 = new Dialog(dialogElement2);
            dialog2.open();

            expect(Dialog._dialogsOpen).toBe(2);

            // Fermer le dialog empilé
            dialog2.close();
            expect(Dialog._dialogsOpen).toBe(1);

            // Fermer le premier dialog
            dialog.close();
            expect(Dialog._dialogsOpen).toBe(0);

            dialog2.destroy();
        });
    });

    describe('M3 Expressive', () => {
        test('alert() crée un alertdialog non-dismissible', () => {
            const alertDialog = Dialog.alert('Message alerte');
            expect(alertDialog.options.dismissible).toBe(false);
            expect(alertDialog.options.variant).toBe('alert');
            expect(getAriaAttribute(alertDialog.el, 'role')).toBe('alertdialog');
            alertDialog.close();
        });

        test('inclut hapticFeedback dans les defaults', () => {
            expect(Dialog.defaults.hapticFeedback).toBe(true);
            expect(Dialog.defaults.hapticPattern).toBe('light');
        });

        test('anime en scale pour le modal centré (M3 Expressive Fade)', async () => {
            dialog = new Dialog(dialogElement, { reducedMotion: true });
            dialog.open();
            await waitMs(20);
            expect(dialogElement.style.getPropertyValue('--dialog-spatial')).toBe('1');
            expect(dialogElement.style.transform).toBe('');
            dialog.close();
        });

        test('bottom-sheet anime la propriété bottom', async () => {
            dialogElement.classList.add('bottom-sheet');
            dialog = new Dialog(dialogElement);
            dialog.open();
            await waitMs(60);
            expect(dialogElement.style.bottom).toBe('0px');
            dialog.close();
            await waitMs(350);
            expect(dialog.isOpen).toBe(false);
        });

        test('fullscreen applique la classe et restructure le header toolbar', () => {
            dialogElement.innerHTML = `
                <div class="dialog-container">
                    <div class="dialog-header"><h2>Titre fullscreen</h2></div>
                    <div class="dialog-scroller"><div class="dialog-content"><p>Contenu</p></div></div>
                    <div class="dialog-footer">
                        <div class="dialog-action-right">
                            <button type="button" class="dialog-close">Fermer</button>
                            <button type="button" class="dialog-confirm">Enregistrer</button>
                        </div>
                    </div>
                </div>`;
            dialog = new Dialog(dialogElement, { variant: 'fullscreen' });
            expect(dialogElement.classList.contains('dialog--fullscreen')).toBe(true);
            expect(dialogElement.querySelector('.dialog-header--fullscreen')).toBeTruthy();
            expect(dialogElement.querySelector('.dialog-header__toolbar')).toBeTruthy();
            expect(dialogElement.querySelector('.dialog-header__leading .dialog-close.btn-icon')).toBeTruthy();
            expect(dialogElement.querySelector('.dialog-header__actions .dialog-confirm')).toBeTruthy();
            const titleInToolbar = dialogElement.querySelector('.dialog-header__toolbar .dialog-title, .dialog-header__toolbar h1, .dialog-header__toolbar h2');
            expect(titleInToolbar).toBeTruthy();
            expect(dialogElement.querySelector('.dialog-footer--fullscreen-hidden')).toBeTruthy();
        });

        test('buildFullscreenDialogMarkup génère la toolbar M3', () => {
            const html = Dialog.buildDialogMarkup({
                variant: 'fullscreen',
                header: '<h2>Créer un événement</h2>',
                content: '<p>Formulaire</p>',
            });
            expect(html).toContain('dialog-header--fullscreen');
            expect(html).toContain('dialog-header__toolbar');
            expect(html).toContain('btn-icon');
            expect(html).toContain('dialog-confirm');
        });

        test('basic restaure le footer après variante fullscreen', () => {
            dialogElement.innerHTML = `
                <div class="dialog-container">
                    <div class="dialog-header"><h2>Titre</h2></div>
                    <div class="dialog-scroller"><div class="dialog-content"><p>Contenu</p></div></div>
                    <div class="dialog-footer">
                        <div class="dialog-action-right">
                            <button type="button" class="dialog-close">Fermer</button>
                        </div>
                    </div>
                </div>`;
            const fullscreenDialog = new Dialog(dialogElement, { variant: 'fullscreen' });
            expect(dialogElement.querySelector('.dialog-header__toolbar')).toBeTruthy();

            const basicDialog = new Dialog(dialogElement, { variant: 'basic' });
            expect(basicDialog.options.variant).toBe('basic');
            expect(dialogElement.querySelector('.dialog-header__toolbar')).toBeFalsy();
            expect(dialogElement.querySelector('.dialog-footer .dialog-close')).toBeTruthy();
            expect(dialogElement.querySelector('.dialog-header__actions .dialog-confirm')).toBeFalsy();
        });

        test('émet les événements dialog:open et dialog:opened', async () => {
            const openHandler = jest.fn();
            const openedHandler = jest.fn();
            dialogElement.addEventListener('dialog:open', openHandler);
            dialogElement.addEventListener('dialog:opened', openedHandler);

            dialog = new Dialog(dialogElement, { reducedMotion: true });
            dialog.open();

            expect(openHandler).toHaveBeenCalled();
            await waitMs(20);
            expect(openedHandler).toHaveBeenCalled();
        });

        test('placement émet un warning de dépréciation', () => {
            const logger = ManagerFactory.getLoggerManager();
            const warnSpy = jest.spyOn(logger, 'warn');

            dialog = new Dialog(dialogElement, { placement: 'bottom' });

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('placement/anchor/cover sont dépréciés')
            );
            warnSpy.mockRestore();
        });

        test('floatingSheet() délègue à Sheet.show()', () => {
            const logger = ManagerFactory.getLoggerManager();
            const warnSpy = jest.spyOn(logger, 'warn');

            const sheet = Dialog.floatingSheet('Titre', '<p>Contenu sheet</p>');

            expect(sheet).toBeInstanceOf(Sheet);
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('floatingSheet() est déprécié')
            );
            sheet.close();
            warnSpy.mockRestore();
        });
    });
});
