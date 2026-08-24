/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Datepicker
 */

import { Datepicker } from '../../src/components/Datepicker';

describe('Datepicker', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="datepicker" class="datepicker" placeholder="Sélectionner une date"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et expose getInstance', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, { locale: 'fr-FR' });

        expect(instance).toBeDefined();
        expect(Datepicker.getInstance(el)).toBe(instance);
        expect(el.querySelector('k3ui-field')).toBeTruthy();
    });

    test('affiche la date sélectionnée par défaut', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const today = new Date();
        const instance = new Datepicker(el, { selectedDate: today });

        expect(instance.selectedDate).toBeTruthy();
        expect(instance.getDate()).toBeTruthy();
    });

    test('ouvre et ferme le datepicker', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, {});

        expect(instance.isOpen).toBe(false);
        instance.open();
        expect(instance.isOpen).toBe(true);
        expect(document.querySelector('.datepicker__backdrop')).toBeTruthy();
        expect(document.querySelector('.datepicker__modal')).toBeTruthy();

        instance.close();
        expect(instance.isOpen).toBe(false);
    });

    test('sélectionne une date', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, {});
        const testDate = new Date('2024-12-25');

        instance.selectDate(testDate);
        expect(instance.selectedDate).toBeTruthy();
        if (instance.selectedDate) {
            expect(instance.selectedDate.getFullYear()).toBe(2024);
            expect(instance.selectedDate.getMonth()).toBe(11); // Décembre = 11
            expect(instance.selectedDate.getDate()).toBe(25);
        }
    });

    test('efface la date sélectionnée', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, { selectedDate: new Date() });

        expect(instance.selectedDate).toBeTruthy();
        instance.clearDate();
        expect(instance.selectedDate).toBeNull();
    });

    test('définit et récupère la date', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, {});
        const testDate = new Date('2024-06-15');

        instance.setDate(testDate);
        const retrievedDate = instance.getDate();

        expect(retrievedDate).toBeTruthy();
        if (retrievedDate) {
            expect(retrievedDate.getFullYear()).toBe(2024);
            expect(retrievedDate.getMonth()).toBe(5); // Juin = 5
            expect(retrievedDate.getDate()).toBe(15);
        }
    });

    test('navigue entre les mois', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, { selectedDate: new Date(2024, 5, 15) }); // Juin 2024

        const initialMonth = instance.currentMonth;
        instance.navigateMonth('next');
        expect(instance.currentMonth).toBe((initialMonth + 1) % 12);

        instance.navigateMonth('prev');
        expect(instance.currentMonth).toBe(initialMonth);
    });

    test('définit l\'année', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, { selectedDate: new Date(2024, 5, 15) });

        instance.setYear(2025);
        expect(instance.currentYear).toBe(2025);
        expect(instance.currentViewMode).toBe('month');
    });

    test('change le mode d\'affichage', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, {});

        expect(instance.currentViewMode).toBe('calendar');
        instance.setViewMode('year');
        expect(instance.currentViewMode).toBe('year');
        instance.setViewMode('input');
        expect(instance.currentViewMode).toBe('input');
    });

    test('désactive les dates selon minDate', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const minDate = new Date('2024-01-01');
        const instance = new Datepicker(el, { minDate });

        const beforeMinDate = new Date('2023-12-31');
        const afterMinDate = new Date('2024-01-02');

        // Vérifier que la méthode isDateDisabled fonctionne (via selectDate)
        instance.selectDate(afterMinDate);
        expect(instance.selectedDate).toBeTruthy();

        // Une date avant minDate ne devrait pas être sélectionnable
        const initialDate = instance.selectedDate;
        instance.selectDate(beforeMinDate);
        // La date ne devrait pas changer si elle est désactivée
        expect(instance.selectedDate).toEqual(initialDate);
    });

    test('désactive les dates selon maxDate', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const maxDate = new Date('2024-12-31');
        const instance = new Datepicker(el, { maxDate });

        const beforeMaxDate = new Date('2024-12-30');
        const afterMaxDate = new Date('2025-01-01');

        instance.selectDate(beforeMaxDate);
        expect(instance.selectedDate).toBeTruthy();

        const initialDate = instance.selectedDate;
        instance.selectDate(afterMaxDate);
        // La date ne devrait pas changer si elle est désactivée
        expect(instance.selectedDate).toEqual(initialDate);
    });

    test('formate une date selon le format', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, { dateFormat: 'DD/MM/YYYY' });
        const testDate = new Date(2024, 5, 15); // 15 juin 2024

        const formatted = instance.formatDate(testDate, 'DD/MM/YYYY');
        expect(formatted).toBe('15/06/2024');

        const formattedUS = instance.formatDate(testDate, 'MM/DD/YYYY');
        expect(formattedUS).toBe('06/15/2024');
    });

    test('parse une date depuis une chaîne', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, { dateFormat: 'DD/MM/YYYY' });

        const parsed = instance.parseDate('15/06/2024');
        expect(parsed).toBeTruthy();
        if (parsed) {
            expect(parsed.getFullYear()).toBe(2024);
            expect(parsed.getMonth()).toBe(5); // Juin = 5
            expect(parsed.getDate()).toBe(15);
        }
    });

    test('appelle le callback onSelect lors de la sélection', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const testDate = new Date('2024-12-25');
        const onSelect = jest.fn();
        const instance = new Datepicker(el, { onSelect });

        instance.selectDate(testDate);

        expect(onSelect).toHaveBeenCalledWith(testDate, instance);
    });

    test('appelle le callback onChange lors du changement', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const testDate = new Date('2024-12-25');
        const onChange = jest.fn();
        const instance = new Datepicker(el, { onChange });

        instance.selectDate(testDate);

        expect(onChange).toHaveBeenCalledWith(testDate, instance);
    });

    test('appelle les callbacks onOpen et onClose', (done) => {
        const el = document.getElementById('datepicker') as HTMLElement;
        let openCalled = false;
        let closeCalled = false;

        const instance = new Datepicker(el, {
            onOpen: () => {
                openCalled = true;
            },
            onClose: () => {
                closeCalled = true;
                expect(openCalled).toBe(true);
                expect(closeCalled).toBe(true);
                done();
            }
        });

        instance.open();
        setTimeout(() => {
            instance.close();
        }, 100);
    });

    test('lit les attributs HTML', () => {
        const el = document.createElement('div');
        el.className = 'datepicker';
        el.setAttribute('locale', 'en-US');
        el.setAttribute('date-format', 'MM/DD/YYYY');
        el.setAttribute('variant', 'outlined');
        el.setAttribute('disabled', '');
        el.setAttribute('min-date', '2024-01-01');
        el.setAttribute('max-date', '2024-12-31');
        document.body.appendChild(el);

        const instance = new Datepicker(el);

        expect(instance.options.locale).toBe('en-US');
        expect(instance.options.dateFormat).toBe('MM/DD/YYYY');
        expect(instance.options.variant).toBe('outlined');
        expect(instance.options.disabled).toBe(true);
        expect(instance.options.minDate).toBeTruthy();
        expect(instance.options.maxDate).toBeTruthy();
    });

    test('détruit le composant proprement', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, {});

        instance.open();
        expect(instance.isOpen).toBe(true);

        instance.destroy();
        expect(instance.isOpen).toBe(false);
        expect(Datepicker.getInstance(el)).toBeFalsy();
    });

    test('gère le premier jour de la semaine', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instanceMonday = new Datepicker(el, { firstDayOfWeek: 1 });
        expect(instanceMonday.options.firstDayOfWeek).toBe(1);

        const el2 = document.createElement('div');
        el2.className = 'datepicker';
        const instanceSunday = new Datepicker(el2, { firstDayOfWeek: 0 });
        expect(instanceSunday.options.firstDayOfWeek).toBe(0);
    });

    test('obtient les noms des jours de la semaine', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, { locale: 'fr-FR', firstDayOfWeek: 1 });

        const weekDays = instance['getWeekDayNames']();
        expect(weekDays.length).toBe(7);
        expect(weekDays[0]).toBeTruthy();
    });

    test('obtient le nom du mois', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, { locale: 'fr-FR' });

        const monthName = instance['getMonthName'](5); // Juin
        expect(monthName).toBeTruthy();
        expect(typeof monthName).toBe('string');
    });

    test('génère les jours du calendrier', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, { selectedDate: new Date(2024, 5, 15) });

        const days = instance['getCalendarDays']();
        expect(days.length).toBe(42); // 6 semaines * 7 jours
        expect(days[0]).toHaveProperty('day');
        expect(days[0]).toHaveProperty('month');
        expect(days[0]).toHaveProperty('year');
        expect(days[0]).toHaveProperty('isCurrentMonth');
        expect(days[0]).toHaveProperty('isToday');
        expect(days[0]).toHaveProperty('isSelected');
        expect(days[0]).toHaveProperty('isDisabled');
    });

    test('vérifie si deux dates sont le même jour', () => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const instance = new Datepicker(el, {});

        const date1 = new Date(2024, 5, 15, 10, 30);
        const date2 = new Date(2024, 5, 15, 14, 45);
        const date3 = new Date(2024, 5, 16);

        expect(instance['isSameDay'](date1, date2)).toBe(true);
        expect(instance['isSameDay'](date1, date3)).toBe(false);
    });

    test('confirme la sélection et ferme', (done) => {
        const el = document.getElementById('datepicker') as HTMLElement;
        const testDate = new Date('2024-12-25');
        let selectCalled = false;

        const instance = new Datepicker(el, {
            selectedDate: testDate,
            onSelect: () => {
                selectCalled = true;
            },
            onClose: () => {
                expect(selectCalled).toBe(true);
                done();
            }
        });

        instance.open();
        setTimeout(() => {
            instance.confirmSelection();
        }, 50);
    });
});









