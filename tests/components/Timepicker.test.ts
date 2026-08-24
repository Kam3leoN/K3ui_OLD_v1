/// <reference types="@types/jest" />
/**
 * Tests unitaires pour le composant Timepicker
 */

import { Timepicker } from '../../src/components/Timepicker';

describe('Timepicker', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="timepicker" class="timepicker" placeholder="Sélectionner une heure"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('initialise et expose getInstance', () => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, { locale: 'fr-FR' });

        expect(instance).toBeDefined();
        expect(Timepicker.getInstance(el)).toBe(instance);
    });

    test('affiche l\'heure sélectionnée par défaut', () => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, { selectedTime: { hours: 14, minutes: 30 } });

        expect(instance.selectedTime).toBeTruthy();
        expect(instance.getTime()).toBeTruthy();
        if (instance.selectedTime) {
            expect(instance.selectedTime.hours).toBe(14);
            expect(instance.selectedTime.minutes).toBe(30);
        }
    });

    test('ouvre et ferme le timepicker', () => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, {});

        expect(instance.isOpen).toBe(false);
        instance.open();
        expect(instance.isOpen).toBe(true);
        expect(document.querySelector('.timepicker__backdrop')).toBeTruthy();
        expect(document.querySelector('.timepicker__modal')).toBeTruthy();

        instance.close();
        expect(instance.isOpen).toBe(false);
    });

    test('sélectionne une heure', () => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, {});

        instance.selectTime(15, 45);
        expect(instance.selectedTime).toBeTruthy();
        if (instance.selectedTime) {
            expect(instance.selectedTime.hours).toBe(15);
            expect(instance.selectedTime.minutes).toBe(45);
        }
    });

    test('efface l\'heure sélectionnée', () => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, { selectedTime: { hours: 14, minutes: 30 } });

        expect(instance.selectedTime).toBeTruthy();
        instance.clearTime();
        expect(instance.selectedTime).toBeNull();
    });

    test('définit et récupère l\'heure', () => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, {});

        instance.setTime({ hours: 16, minutes: 20 });
        const retrievedTime = instance.getTime();

        expect(retrievedTime).toBeTruthy();
        if (retrievedTime) {
            expect(retrievedTime.hours).toBe(16);
            expect(retrievedTime.minutes).toBe(20);
        }
    });

    test('définit l\'heure individuellement', () => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, {});

        instance.setHour(14);
        expect(instance.currentHours).toBe(14);

        instance.setMinute(30);
        expect(instance.currentMinutes).toBe(30);
    });

    test('formate une heure selon le format', () => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, { timeFormat: 'HH:mm', format: '24h' });

        const formatted = instance.formatTime(14, 30);
        expect(formatted).toBe('14:30');

        const instance12h = new Timepicker(el, { timeFormat: 'hh:mm A', format: '12h' });
        const formatted12h = instance12h.formatTime(14, 30);
        expect(formatted12h).toContain('02:30');
        expect(formatted12h).toContain('PM');
    });

    test('parse une heure depuis une chaîne', () => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, { timeFormat: 'HH:mm', format: '24h' });

        const parsed = instance.parseTime('14:30');
        expect(parsed).toBeTruthy();
        if (parsed) {
            expect(parsed.hours).toBe(14);
            expect(parsed.minutes).toBe(30);
        }
    });

    test('désactive les heures selon minTime', () => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, { minTime: { hours: 9, minutes: 0 } });

        const isDisabled = instance['isTimeDisabled'](8, 0);
        expect(isDisabled).toBe(true);

        const isEnabled = instance['isTimeDisabled'](10, 0);
        expect(isEnabled).toBe(false);
    });

    test('désactive les heures selon maxTime', () => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, { maxTime: { hours: 18, minutes: 0 } });

        const isDisabled = instance['isTimeDisabled'](19, 0);
        expect(isDisabled).toBe(true);

        const isEnabled = instance['isTimeDisabled'](17, 0);
        expect(isEnabled).toBe(false);
    });

    test('appelle le callback onSelect lors de la sélection', (done) => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, {
            onSelect: (time, instance) => {
                expect(time).toBeTruthy();
                expect(instance.el).toBe(el);
                if (time) {
                    expect(time.hours).toBe(15);
                    expect(time.minutes).toBe(45);
                }
                done();
            }
        });

        instance.selectTime(15, 45);
        instance.confirmSelection();
    });

    test('appelle le callback onChange lors du changement', (done) => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, {
            onChange: (time, instance) => {
                expect(time).toBeTruthy();
                expect(instance.el).toBe(el);
                if (time) {
                    expect(time.hours).toBe(16);
                    expect(time.minutes).toBe(20);
                }
                done();
            }
        });

        instance.selectTime(16, 20);
    });

    test('appelle les callbacks onOpen et onClose', (done) => {
        const el = document.getElementById('timepicker') as HTMLElement;
        let openCalled = false;
        let closeCalled = false;

        const instance = new Timepicker(el, {
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
        el.className = 'timepicker';
        el.setAttribute('locale', 'en-US');
        el.setAttribute('time-format', 'hh:mm A');
        el.setAttribute('format', '12h');
        el.setAttribute('variant', 'outlined');
        el.setAttribute('disabled', '');
        el.setAttribute('min-time', '09:00');
        el.setAttribute('max-time', '18:00');
        el.setAttribute('minute-step', '5');
        el.setAttribute('hour-step', '2');
        el.setAttribute('value', '14:30');
        document.body.appendChild(el);

        const instance = new Timepicker(el);

        expect(instance.options.locale).toBe('en-US');
        expect(instance.options.timeFormat).toBe('hh:mm A');
        expect(instance.options.format).toBe('12h');
        expect(instance.options.variant).toBe('outlined');
        expect(instance.options.disabled).toBe(true);
        expect(instance.options.minTime).toBeTruthy();
        expect(instance.options.maxTime).toBeTruthy();
        expect(instance.options.minuteStep).toBe(5);
        expect(instance.options.hourStep).toBe(2);
        expect(instance.selectedTime).toBeTruthy();
        if (instance.selectedTime) {
            expect(instance.selectedTime.hours).toBe(14);
            expect(instance.selectedTime.minutes).toBe(30);
        }
    });

    test('détruit le composant proprement', () => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, {});

        instance.open();
        expect(instance.isOpen).toBe(true);

        instance.destroy();
        expect(instance.isOpen).toBe(false);
        expect(Timepicker.getInstance(el)).toBeFalsy();
    });

    test('confirme la sélection et ferme', (done) => {
        const el = document.getElementById('timepicker') as HTMLElement;
        let selectCalled = false;

        const instance = new Timepicker(el, {
            selectedTime: { hours: 14, minutes: 30 },
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

    test('gère les intervalles de minutes', () => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, { minuteStep: 5 });

        expect(instance.options.minuteStep).toBe(5);
    });

    test('gère les intervalles d\'heures', () => {
        const el = document.getElementById('timepicker') as HTMLElement;
        const instance = new Timepicker(el, { hourStep: 2 });

        expect(instance.options.hourStep).toBe(2);
    });
});









