/**
 * K3UI Fieldset Component
 * Regroupement de champs Material Design 3 avec entaille, validation et repliable
 *
 * @summary Groupe de champs Material Design 3
 * @element k3ui-fieldset
 *
 * @slot icon - Icône dans le titre
 * @slot default - Champs du groupe
 *
 * @event k3ui-fieldset-toggle - Bascule ouvert/fermé (detail.open)
 */

import { Component } from '../core/base/Component';
import { attributeNameToCamelCase, defineK3UIElement } from '../core/base/K3UIElement';
import { toComponentClassDef } from '../types/components/component-base';
import { FieldsetOptions } from '../types/components';
import { PriorityLevel, KElement, InitElements } from '../types/base';
import { IconManager, LoggerManager } from '../core/managers';
import { setAriaAttribute } from '../utils/dom/aria';
import { generateShortId } from '../utils/helpers/guid';
import { FieldsetStrings, getFieldsetDefaults } from '../specs/components/fieldset.specs';
import { Field } from './Field';

const _defaults: FieldsetOptions = getFieldsetDefaults();

let groupUid = 0;

/**
 * Composant Fieldset — fieldset M3 avec grille, validation et repliable
 */
export class Fieldset extends Component<FieldsetOptions> {
    declare el: HTMLElement;

    readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

    private fieldsetElement: HTMLFieldSetElement | null = null;
    private legendElement: HTMLLegendElement | null = null;
    private headlineElement: HTMLSpanElement | null = null;
    private iconElement: HTMLSpanElement | null = null;
    private headElement: HTMLDivElement | null = null;
    private supportElement: HTMLParagraphElement | null = null;
    private toggleElement: HTMLButtonElement | null = null;
    private contentElement: HTMLDivElement | null = null;
    private fieldsElement: HTMLDivElement | null = null;
    private errorElement: HTMLParagraphElement | null = null;
    private openAnimation: Animation | null = null;

    private ids = {
        headline: '',
        support: '',
        error: '',
        content: '',
    };

    constructor(el: HTMLElement, options: Partial<FieldsetOptions> = {}) {
        const htmlOptions = Fieldset.readAttributes(el);
        super(el, { ...options, ...htmlOptions }, toComponentClassDef(Fieldset));
        this.init();
    }

    static getInstance(el: HTMLElement): Fieldset | undefined {
        return Component.getInstance(el) as Fieldset | undefined;
    }

    static get defaults(): FieldsetOptions {
        return _defaults;
    }

    static init(el: HTMLElement, options?: Partial<FieldsetOptions>): Fieldset;
    static init(els: InitElements<KElement>, options?: Partial<FieldsetOptions>): Fieldset[];
    static init(
        els: HTMLElement | InitElements<KElement>,
        options?: Partial<FieldsetOptions>,
    ): Fieldset | Fieldset[] {
        if (els instanceof Element) {
            const existing = Fieldset.getInstance(els as HTMLElement);
            if (existing) {
                existing.init();
                return existing;
            }
            return new Fieldset(els as HTMLElement, options);
        }
        if (!!els && els.length) {
            const instances: Fieldset[] = [];
            for (let i = 0; i < els.length; i++) {
                const el = els[i] as HTMLElement;
                const existing = Fieldset.getInstance(el);
                if (existing) {
                    existing.init();
                    instances.push(existing);
                } else {
                    instances.push(new Fieldset(el, options));
                }
            }
            return instances;
        }
        return [];
    }

    private static readAttributes(el: HTMLElement): Partial<FieldsetOptions> {
        const options: Partial<FieldsetOptions> = {};

        if (el.hasAttribute('headline')) {
            options.headline = el.getAttribute('headline') ?? '';
        }
        if (el.hasAttribute('supporting-text')) {
            options.supportingText = el.getAttribute('supporting-text') ?? '';
        }
        if (el.hasAttribute('density')) {
            options.density = (el.getAttribute('density') ?? 'default') as FieldsetOptions['density'];
        }
        if (el.hasAttribute('columns')) {
            options.columns = Number(el.getAttribute('columns')) || 1;
        }
        options.collapsible = el.hasAttribute('collapsible');
        options.open = !options.collapsible || el.hasAttribute('open');
        options.disabled = el.hasAttribute('disabled');
        if (el.hasAttribute('error')) {
            options.error = el.getAttribute('error');
        }

        return options;
    }

    /** Message d'erreur de groupe */
    get error(): string | null {
        return this.el.getAttribute('error');
    }

    set error(value: string | null) {
        this.options.error = value;
        if (!this.el) return;
        if (value) {
            this.el.setAttribute('error', value);
        } else {
            this.el.removeAttribute('error');
        }
        this.syncError();
    }

    /** Contrôles du groupe dans l'ordre du document */
    get controls(): HTMLElement[] {
        if (!this.fieldsElement) return [];

        const fields = this.fieldsElement;
        const form = this.fieldsetElement?.form;
        const candidates = form
            ? Array.from(form.elements).filter((element) => fields.contains(element as Element)) as HTMLElement[]
            : Array.from(
                fields.querySelectorAll('k3ui-field, input, select, textarea, [checkvalidity]'),
            ) as HTMLElement[];

        const resolved: HTMLElement[] = [];

        for (const element of candidates) {
            const control = this.resolveControl(element);
            if (control) {
                resolved.push(control);
            }
        }

        return resolved;
    }

    init(): void {
        LoggerManager.global.info('Fieldset component initialized');

        if (!this.fieldsetElement) {
            this.buildStructure();
        }

        this.syncAll();
    }

    /**
     * Valide tous les contrôles et affiche le premier échec comme erreur de groupe
     */
    reportGroupValidity(): boolean {
        const invalid = this.controls.filter(
            (control) => (control as HTMLInputElement).checkValidity?.() === false,
        );

        for (const control of this.controls) {
            const failing = invalid.includes(control);
            if (failing) {
                setAriaAttribute(control, 'invalid', true);
            } else {
                setAriaAttribute(control, 'invalid', false);
            }
        }

        if (!invalid.length) {
            this.error = null;
            return true;
        }

        const label = this.labelOf(invalid[0]);
        const message =
            invalid.length > 1
                ? FieldsetStrings.manyInvalid(invalid.length, this.options.headline ?? '')
                : label
                    ? FieldsetStrings.oneInvalid(label)
                    : (invalid[0] as HTMLInputElement).validationMessage || FieldsetStrings.invalidFallback;

        this.error = message;
        return false;
    }

    /**
     * Ouvre le groupe et focus le premier champ invalide ou le premier champ
     */
    focusFirstField(): void {
        this.options.open = true;
        this.el.setAttribute('open', '');
        this.applyOpen(true, { animate: false });

        const controls = this.controls;
        const target =
            controls.find((control) => (control as HTMLInputElement).checkValidity?.() === false) ??
            controls[0];

        if (!target) return;

        const fieldHost = target.closest('k3ui-field') as HTMLElement | null;
        if (fieldHost) {
            Field.getInstance(fieldHost)?.focus();
            fieldHost.scrollIntoView({
                block: 'center',
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            });
            return;
        }

        target.focus();
        target.scrollIntoView({
            block: 'center',
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
    }

    destroy(): void {
        this.openAnimation?.cancel();
        LoggerManager.global.info('Fieldset component destroyed');
        super.destroy();
    }

    private buildStructure(): void {
        const id = ++groupUid;
        this.ids = {
            headline: generateShortId(`k3ui-fieldset-${id}-headline`),
            support: generateShortId(`k3ui-fieldset-${id}-support`),
            error: generateShortId(`k3ui-fieldset-${id}-error`),
            content: generateShortId(`k3ui-fieldset-${id}-content`),
        };

        const authored = Array.from(this.el.childNodes);
        const iconNodes = authored.filter(
            (node) => node instanceof Element && node.getAttribute('slot') === 'icon',
        );
        const fieldNodes = authored.filter((node) => !iconNodes.includes(node as Element));

        const fieldset = document.createElement('fieldset');
        fieldset.className = 'fieldset__container';

        this.legendElement = document.createElement('legend');
        this.legendElement.className = 'fieldset__legend';

        this.iconElement = document.createElement('span');
        this.iconElement.className = 'fieldset__icon';
        setAriaAttribute(this.iconElement, 'hidden', true);
        this.iconElement.append(...iconNodes);
        this.iconElement.hidden = iconNodes.length === 0;

        this.headlineElement = document.createElement('span');
        this.headlineElement.className = 'fieldset__headline';
        this.headlineElement.id = this.ids.headline;

        this.legendElement.append(this.iconElement, this.headlineElement);

        this.headElement = document.createElement('div');
        this.headElement.className = 'fieldset__head';

        this.supportElement = document.createElement('p');
        this.supportElement.className = 'fieldset__support';
        this.supportElement.id = this.ids.support;

        this.toggleElement = document.createElement('button');
        this.toggleElement.type = 'button';
        this.toggleElement.className = 'fieldset__toggle';

        const chevron = document.createElement('i');
        chevron.className = 'k3ui-icon fieldset__chevron';
        chevron.setAttribute('name', this.options.chevronIcon);
        this.toggleElement.append(chevron);

        this.headElement.append(this.supportElement, this.toggleElement);

        this.contentElement = document.createElement('div');
        this.contentElement.className = 'fieldset__content';
        this.contentElement.id = this.ids.content;

        this.fieldsElement = document.createElement('div');
        this.fieldsElement.className = 'fieldset__fields';
        this.fieldsElement.append(...fieldNodes);

        this.contentElement.append(this.fieldsElement);

        this.errorElement = document.createElement('p');
        this.errorElement.className = 'fieldset__error';
        this.errorElement.id = this.ids.error;
        setAriaAttribute(this.errorElement, 'role', 'alert');

        fieldset.append(this.legendElement, this.headElement, this.contentElement, this.errorElement);
        setAriaAttribute(fieldset, 'labelledby', this.ids.headline);

        this.el.replaceChildren(fieldset);
        this.fieldsetElement = fieldset;

        this.registerEvent(this.toggleElement, 'click', this.handleToggleClick);
        this.registerEvent(this.contentElement, 'beforematch', this.handleBeforeMatch);

        if (fieldset.form) {
            this.registerEvent(fieldset.form, 'reset', this.handleFormReset);
        }

        const observer = new MutationObserver(() => this.indexFields());
        observer.observe(this.fieldsElement, { childList: true });

        setTimeout(() => IconManager.forceDisplayIcons(), 0);
    }

    private handleToggleClick = (): void => {
        if (this.options.disabled) return;

        const nextOpen = !this.isOpen();
        this.options.open = nextOpen;
        this.el.toggleAttribute('open', nextOpen);
        this.applyOpen(nextOpen, { animate: true });

        if (nextOpen) {
            this.options.onOpenStart?.(this.el);
            this.options.onOpenEnd?.(this.el);
        } else {
            this.options.onCloseStart?.(this.el);
            this.options.onCloseEnd?.(this.el);
        }
    };

    private handleBeforeMatch = (): void => {
        this.options.open = true;
        this.el.setAttribute('open', '');
        this.applyOpen(true, { animate: false });
    };

    private handleFormReset = (): void => {
        queueMicrotask(() => {
            this.error = null;
            for (const control of this.controls) {
                setAriaAttribute(control, 'invalid', false);
            }
        });
    };

    private isOpen(): boolean {
        return !this.options.collapsible || this.el.hasAttribute('open');
    }

    private syncAll(): void {
        this.el.style.setProperty('--k3ui-fieldset-columns', String(this.options.columns));

        if (this.options.density && this.options.density !== 'default') {
            this.el.setAttribute('density', this.options.density);
        } else {
            this.el.removeAttribute('density');
        }

        this.el.toggleAttribute('collapsible', this.options.collapsible);
        this.el.toggleAttribute('open', this.isOpen());
        this.syncHeadline();
        this.syncHead();
        this.syncError();
        this.syncDisabled();
        this.applyOpen(this.isOpen(), { animate: false });
        this.indexFields();
        this.propagateDensity();
    }

    /** Propage la densité aux champs k3ui-field descendants */
    private propagateDensity(): void {
        const density = this.options.density;
        if (!density || density === 'default') {
            this.fieldsElement?.querySelectorAll('k3ui-field').forEach((field) => {
                field.removeAttribute('density');
                delete field.dataset.density;
            });
            return;
        }

        this.fieldsElement?.querySelectorAll('k3ui-field').forEach((field) => {
            field.setAttribute('density', density);
            field.dataset.density = density;
        });
    }

    private syncHeadline(): void {
        if (!this.headlineElement || !this.legendElement) return;
        this.headlineElement.textContent = this.options.headline ?? '';
        this.legendElement.hidden = !this.options.headline;
    }

    private syncHead(): void {
        if (!this.headElement || !this.supportElement || !this.toggleElement || !this.fieldsetElement) {
            return;
        }

        this.supportElement.textContent = this.options.supportingText ?? '';
        this.toggleElement.hidden = !this.options.collapsible;
        this.headElement.hidden = !this.options.supportingText && !this.options.collapsible;

        setAriaAttribute(this.toggleElement, 'controls', this.ids.content);
        setAriaAttribute(this.toggleElement, 'expanded', this.isOpen());

        const headline = this.options.headline ?? '';
        setAriaAttribute(
            this.toggleElement,
            'label',
            this.isOpen() ? FieldsetStrings.collapse(headline) : FieldsetStrings.expand(headline),
        );

        const described = [
            this.options.supportingText ? this.ids.support : '',
            this.error ? this.ids.error : '',
        ].filter(Boolean);

        if (described.length) {
            setAriaAttribute(this.fieldsetElement, 'describedby', described.join(' '));
        } else {
            setAriaAttribute(this.fieldsetElement, 'describedby', false);
        }
    }

    private syncError(): void {
        if (!this.errorElement) return;

        const message = this.error;
        this.errorElement.replaceChildren();

        if (message) {
            const jump = document.createElement('button');
            jump.type = 'button';
            jump.className = 'fieldset__error-link';
            jump.textContent = message;
            jump.addEventListener('click', () => this.focusFirstField());

            const errorIcon = document.createElement('i');
            errorIcon.className = 'k3ui-icon';
            errorIcon.setAttribute('name', this.options.errorIcon);
            setAriaAttribute(errorIcon, 'hidden', true);

            this.errorElement.append(errorIcon, jump);
            setTimeout(() => IconManager.forceDisplayIcons(), 0);
        }

        this.el.toggleAttribute('data-error', Boolean(message));
        this.syncHead();
    }

    private syncDisabled(): void {
        if (!this.fieldsetElement || !this.toggleElement) return;
        this.fieldsetElement.disabled = this.options.disabled;
        this.toggleElement.disabled = this.options.disabled;
        this.el.toggleAttribute('disabled', this.options.disabled);

        this.fieldsElement?.querySelectorAll('k3ui-field').forEach((field) => {
            if (this.options.disabled) {
                field.setAttribute('disabled', '');
            } else {
                field.removeAttribute('disabled');
            }
        });
    }

    private applyOpen(open: boolean, { animate }: { animate: boolean }): void {
        if (!this.contentElement) return;

        this.syncHead();

        if (!this.options.collapsible) {
            this.contentElement.removeAttribute('hidden');
            this.contentElement.style.removeProperty('height');
            return;
        }

        this.openAnimation?.cancel();

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const duration = reducedMotion ? 0 : 220;

        if (open) {
            this.contentElement.removeAttribute('hidden');
            if (!animate || duration === 0) {
                this.settleOpen(open);
                return;
            }

            this.el.dataset.animating = 'open';
            const height = this.contentElement.scrollHeight;
            this.openAnimation = this.contentElement.animate(
                [
                    { height: '0px', opacity: 0 },
                    { height: `${height}px`, opacity: 1 },
                ],
                { duration, easing: 'ease-out', fill: 'backwards' },
            );
        } else {
            if (!animate || duration === 0) {
                this.settleOpen(open);
                return;
            }

            this.el.dataset.animating = 'close';
            const height = this.contentElement.scrollHeight;
            this.openAnimation = this.contentElement.animate(
                [
                    { height: `${height}px`, opacity: 1 },
                    { height: '0px', opacity: 0 },
                ],
                { duration, easing: 'ease-in', fill: 'forwards' },
            );
        }

        this.openAnimation.addEventListener('finish', () => this.settleOpen(open), { once: true });

        this.el.dispatchEvent(
            new CustomEvent('k3ui-fieldset-toggle', {
                detail: { open },
                bubbles: true,
            }),
        );
    }

    private settleOpen(open: boolean): void {
        if (!this.contentElement) return;
        delete this.el.dataset.animating;
        this.contentElement.style.removeProperty('height');
        if (open) {
            this.contentElement.removeAttribute('hidden');
        } else {
            this.contentElement.setAttribute('hidden', 'until-found');
        }
    }

    private indexFields(): void {
        if (!this.fieldsElement) return;
        Array.from(this.fieldsElement.children).forEach((child, index) => {
            (child as HTMLElement).style.setProperty('--k3ui-fieldset-index', String(index));
        });
    }

    private labelOf(control: HTMLElement): string {
        const fieldHost = control.closest('k3ui-field');
        if (fieldHost) {
            return fieldHost.getAttribute('label')?.trim() ?? '';
        }

        const input = control as HTMLInputElement;
        return input.labels?.[0]?.textContent?.trim()
            || control.getAttribute('aria-label')?.trim()
            || control.getAttribute('name')?.trim()
            || '';
    }

    /**
     * Résout un hôte k3ui-field vers son contrôle natif
     * @private
     */
    private resolveControl(element: HTMLElement): HTMLElement | null {
        if (element.hasAttribute('data-affix')) return null;

        if (element.tagName === 'K3UI-FIELD') {
            const input = element.querySelector('input, textarea, select') as HTMLElement | null;
            if (!input) return null;
            const type = (input as HTMLInputElement).type;
            if (type && ['button', 'submit', 'reset', 'image'].includes(type)) return null;
            return input;
        }

        const valueElements = new Set(['INPUT', 'SELECT', 'TEXTAREA']);
        const nonValueTypes = new Set(['button', 'submit', 'reset', 'image']);

        if (valueElements.has(element.tagName)) {
            const input = element as HTMLInputElement;
            return nonValueTypes.has(input.type) ? null : element;
        }

        return null;
    }
}

const FIELDSET_OBSERVED_ATTRIBUTES = [
    'headline', 'supporting-text', 'density', 'columns', 'collapsible', 'open', 'disabled', 'error',
] as const;

defineK3UIElement('k3ui-fieldset', Fieldset, {
    observedAttributes: [...FIELDSET_OBSERVED_ATTRIBUTES],
    onAttributeChanged(_el, name, oldValue, newValue, instance) {
        const camelCaseName = attributeNameToCamelCase(name) as keyof FieldsetOptions;
        if (camelCaseName === 'supportingText' || camelCaseName in instance.options) {
            instance.updateOptions(
                { [camelCaseName]: newValue } as Partial<FieldsetOptions>,
                { attribute: name, oldValue, newValue, keys: [camelCaseName as string] },
            );
            instance.init();
        }
    },
});
