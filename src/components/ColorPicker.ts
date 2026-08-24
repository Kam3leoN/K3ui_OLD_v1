/**
 * @fileoverview Composant ColorPicker pour K3UI
 * @description Sélecteur de couleur Material Design 3 (hex, RGB, HSL, HSV, CMYK, HCT) avec copie et toast
 * @author K3UI Team
 * @version 1.0.0
 * @element k3ui-color-picker
 */

import { Component } from '../core/base/Component';
import { ComponentType, toComponentClassDef } from '../types/components/component-base';
import { ColorPickerOptions } from '../types/components';
import { PriorityLevel } from '../types/base';
import { LoggerManager, ManagerFactory } from '../core/managers';
import { LocaleManager } from '../core/managers';
import { setAriaAttribute } from '../utils/dom/aria';
import { getColorPickerDefaults } from '../specs/components/color-picker.specs';
import {
  hexToRgb,
  rgbToHex,
  hexToHsl,
  hexToHsv,
  hexToCmyk,
  hslToHex,
  hsvToRgb,
  cmykToRgb,
  normalizeHex
} from '../utils/color/convert';
import { Hct } from '../utils/color/hct';
import { bindPointerDown, getPointerCoords, startPointerDragSession } from '../utils/dom/pointer';
import { Snackbar } from './Snackbar';
import { Slider } from './Slider';
import { Field } from './Field';

const _defaults: ColorPickerOptions = getColorPickerDefaults();

interface KColorPickerHTMLElement extends HTMLElement {
  K_ColorPicker?: ColorPicker;
}

/** Formats de couleur éditables du picker */
type FormatKey = 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk' | 'hct';

/**
 * Classe ColorPicker pour K3UI
 */
export class ColorPicker extends Component<ColorPickerOptions> {
  declare el: HTMLElement;

  readonly priority: PriorityLevel = PriorityLevel.MEDIUM;

  private logger: LoggerManager;
  private container: HTMLDivElement | null = null;
  private previewEl: HTMLDivElement | null = null;
  private areaEl: HTMLDivElement | null = null;
  private handleEl: HTMLDivElement | null = null;
  private hueSliderEl: HTMLElement | null = null;
  private hueSliderInstance: Slider | null = null;
  private formatFieldEls: Partial<Record<FormatKey, HTMLElement>> = {};

  private state: { h: number; s: number; l: number } = { h: 263, s: 34, l: 48 };
  private dragging: 'area' | null = null;
  private _unbindAreaPointer: (() => void) | null = null;
  private _areaDragCleanup: (() => void) | null = null;
  private unsubFormatFields: (() => void) | null = null;
  /** Évite la boucle syncUIFromHex → setValue → onChange → applyState → syncUIFromHex */
  private _syncingHue = false;
  /** Évite les boucles lors de la mise à jour des champs de format */
  private _syncingFormats = false;
  /** Saisie hex en cours — évite d'écraser le champ pendant l'édition */
  private _hexFieldFocused = false;
  /** Drag du slider teinte — évite de réinitialiser le handle pendant le drag */
  private _hueDragging = false;
  /** Dernière couleur hex validée (restauration après saisie invalide) */
  private _lastCommittedHex = '';

  static get defaults(): ColorPickerOptions {
    return { ..._defaults };
  }

  static getInstance(el: HTMLElement): ColorPicker | undefined {
    return (el as KColorPickerHTMLElement).K_ColorPicker;
  }

  static init(
    els: HTMLElement | NodeListOf<HTMLElement> | string,
    options: Partial<ColorPickerOptions> = {}
  ): ColorPicker[] {
    return super.init(els, options, toComponentClassDef(ColorPicker)) as ColorPicker[];
  }

  static readAttributes(el: HTMLElement): Partial<ColorPickerOptions> {
    const o: Partial<ColorPickerOptions> = {};
    if (el.hasAttribute('value')) o.value = el.getAttribute('value') || _defaults.value;
    return o;
  }

  constructor(el: HTMLElement, options: Partial<ColorPickerOptions> = {}) {
    const htmlOptions = ColorPicker.readAttributes(el);
    super(el, { ...options, ...htmlOptions }, toComponentClassDef(ColorPicker));

    this.logger = ManagerFactory.getLoggerManager('[ColorPicker]');
    this.options = { ...ColorPicker.defaults, ...htmlOptions, ...options };
    (el as KColorPickerHTMLElement).K_ColorPicker = this;

    this.init();
  }

  private init(): void {
    this.el.classList.add('color-picker');
    const hex = normalizeHex(this.options.value) || _defaults.value;
    this._lastCommittedHex = hex;
    const hsl = hexToHsl(hex);
    if (hsl) this.state = hsl;

    this.buildDOM();
    this.initHueSlider();
    this.syncUIFromHex(hex);
    this.bindEvents();
    this.initFormatFields();
    this.logger.info('ColorPicker initialized');
  }

  private buildDOM(): void {
    const t = (key: string) => LocaleManager.t('colorPicker.' + key);

    this.container = document.createElement('div');
    this.container.className = 'color-picker__container';

    const title = document.createElement('h3');
    title.className = 'color-picker__title body-medium';
    title.textContent = t('title');
    this.container.appendChild(title);

    const main = document.createElement('div');
    main.className = 'color-picker__main';
    this.previewEl = document.createElement('div');
    this.previewEl.className = 'color-picker__preview';
    setAriaAttribute(this.previewEl, 'label', t('ariaPreview'));
    main.appendChild(this.previewEl);

    const areaWrap = document.createElement('div');
    areaWrap.className = 'color-picker__area-wrap';
    this.areaEl = document.createElement('div');
    this.areaEl.className = 'color-picker__area';
    this.areaEl.setAttribute('tabindex', '0');
    setAriaAttribute(this.areaEl, 'label', t('ariaSaturationLightness'));
    this.handleEl = document.createElement('div');
    this.handleEl.className = 'color-picker__handle';
    this.handleEl.setAttribute('aria-hidden', 'true');
    areaWrap.appendChild(this.areaEl);
    areaWrap.appendChild(this.handleEl);
    main.appendChild(areaWrap);
    this.container.appendChild(main);

    const hueWrap = document.createElement('div');
    hueWrap.className = 'color-picker__hue-wrap';
    this.hueSliderEl = document.createElement('k3ui-slider');
    this.hueSliderEl.className = 'color-picker__hue-slider no-autoinit';
    this.hueSliderEl.setAttribute('min', '0');
    this.hueSliderEl.setAttribute('max', '360');
    this.hueSliderEl.setAttribute('step', '1');
    this.hueSliderEl.setAttribute('value', String(this.state.h));
    this.hueSliderEl.setAttribute('size', 's');
    this.hueSliderEl.setAttribute('hide-value-label', '');
    setAriaAttribute(this.hueSliderEl, 'label', t('ariaHue'));
    hueWrap.appendChild(this.hueSliderEl);
    this.container.appendChild(hueWrap);

    const values = document.createElement('div');
    values.className = 'color-picker__values';

    const formatGrid = document.createElement('div');
    formatGrid.className = 'color-picker__formats-grid';

    const formats: Array<{
      key: FormatKey;
      label: string;
      copyKey: string;
      placeholder: string;
      pattern?: string;
    }> = [
      { key: 'hex', label: t('hexLabel'), copyKey: 'copyHex', placeholder: '#6750A4' },
      { key: 'rgb', label: 'RGB', copyKey: 'copyRgb', placeholder: '0, 153, 255' },
      { key: 'hsl', label: 'HSL', copyKey: 'copyHsl', placeholder: '204°, 100%, 50%' },
      { key: 'hsv', label: 'HSV', copyKey: 'copyHsv', placeholder: '204°, 100%, 100%' },
      { key: 'cmyk', label: 'CMYK', copyKey: 'copyCmyk', placeholder: '100%, 40%, 0%, 0%' },
      { key: 'hct', label: t('hctLabel'), copyKey: 'copyHct', placeholder: t('hctPlaceholder') }
    ];

    formats.forEach(({ key, label, copyKey, placeholder, pattern }) => {
      const fieldEl = document.createElement('k3ui-field') as HTMLElement;
      fieldEl.className = 'color-picker__format-field no-autoinit';
      fieldEl.setAttribute('variant', 'plain');
      fieldEl.setAttribute('label', label);
      fieldEl.setAttribute('placeholder', placeholder);
      fieldEl.setAttribute('trailing-icon', 'copy-content');
      fieldEl.setAttribute('data-format', key);
      if (pattern) {
        fieldEl.setAttribute('pattern', pattern);
      }
      if (key === 'hex') {
        fieldEl.setAttribute('value', this.options.value);
      }
      this.formatFieldEls[key] = fieldEl;
      formatGrid.appendChild(fieldEl);
    });

    values.appendChild(formatGrid);
    this.container.appendChild(values);

    this.el.appendChild(this.container);
  }

  private initHueSlider(): void {
    if (!this.hueSliderEl) return;

    const handleHueValue = (_el: HTMLElement, value: number | [number, number]): void => {
      if (this._syncingHue) return;
      const v = Array.isArray(value) ? value[0] : value;
      this.state.h = Math.round(v);
      this.applyState({ skipHue: true });
    };

    const instance = Slider.init(this.hueSliderEl, {
      min: 0,
      max: 360,
      step: 1,
      value: this.state.h,
      size: 's',
      showValueLabel: false,
      onDragStart: () => {
        this._hueDragging = true;
      },
      onDragEnd: () => {
        this._hueDragging = false;
      },
      onChange: handleHueValue,
      onDrag: handleHueValue
    });
    this.hueSliderInstance = Array.isArray(instance) ? instance[0] : instance;
  }

  private copyToClipboard(text: string, triggerEl: HTMLElement): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (this.options.showToastOnCopy) {
          Snackbar.show({
            text: LocaleManager.t('colorPicker.copied'),
            type: 'success',
            duration: 2000
          });
        }
      });
    }
  }

  private getFieldValue(fieldEl: HTMLElement): string {
    const inst = Field.getInstance(fieldEl);
    if (inst && typeof inst.getValue === 'function') {
      return (inst.getValue() || '').trim();
    }
    return (fieldEl.getAttribute('value') || '').trim();
  }

  private setFieldValue(fieldEl: HTMLElement, value: string): void {
    fieldEl.setAttribute('value', value);
    const inst = Field.getInstance(fieldEl);
    if (inst && typeof inst.setValue === 'function') {
      inst.setValue(value);
    }
  }

  private getHexFromField(): string {
    const hexField = this.formatFieldEls.hex;
    if (!hexField) {
      return this.options.value;
    }
    return this.getFieldValue(hexField) || this.options.value;
  }

  private setHexToField(hex: string): void {
    const hexField = this.formatFieldEls.hex;
    if (!hexField) {
      return;
    }
    this.setFieldValue(hexField, hex);
  }

  /**
   * Initialise les champs de format (plain) et leurs callbacks
   */
  private initFormatFields(): void {
    const t = (key: string) => LocaleManager.t('colorPicker.' + key);
    const copyKeys: Record<FormatKey, string> = {
      hex: 'copyHex',
      rgb: 'copyRgb',
      hsl: 'copyHsl',
      hsv: 'copyHsv',
      cmyk: 'copyCmyk',
      hct: 'copyHct'
    };

    (Object.keys(this.formatFieldEls) as FormatKey[]).forEach((format) => {
      const fieldEl = this.formatFieldEls[format];
      if (!fieldEl) {
        return;
      }

      const fieldOptions: Parameters<typeof Field.init>[1] = {
        onTrailingIconClick: () => this.copyToClipboard(this.getFieldValue(fieldEl), fieldEl),
        trailingIconLabel: t(copyKeys[format])
      };

      if (format === 'hex') {
        fieldOptions.onFocus = () => {
          this._hexFieldFocused = true;
        };
        fieldOptions.onBlur = () => {
          this._hexFieldFocused = false;
          this.commitHexFromField();
        };
      } else {
        const applyFromField = (raw: string): void => {
          if (this._syncingFormats) {
            return;
          }
          const hex = this.hexFromFormatInput(format, raw);
          if (hex) {
            this.commitHex(hex);
          }
        };

        fieldOptions.onInput = (_el, value) => applyFromField(value);
        fieldOptions.onChange = (_el, value) => {
          const hex = this.hexFromFormatInput(format, value);
          if (hex) {
            this.commitHex(hex);
          } else {
            this.syncUIFromHex(this._lastCommittedHex || this.options.value);
          }
        };
      }

      Field.init(fieldEl, fieldOptions);
    });
  }

  /**
   * Parse une liste de nombres depuis une saisie utilisateur (virgules, espaces, %, °)
   */
  private parseNumberList(raw: string, count: number): number[] | null {
    const parts = raw
      .replace(/[%°]/g, '')
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length < count) {
      return null;
    }
    const nums = parts.slice(0, count).map((p) => parseFloat(p));
    if (nums.some((n) => Number.isNaN(n))) {
      return null;
    }
    return nums;
  }

  /**
   * Convertit une saisie de format couleur en hex
   */
  private hexFromFormatInput(format: Exclude<FormatKey, 'hex'>, raw: string): string | null {
    switch (format) {
      case 'rgb': {
        const nums = this.parseNumberList(raw, 3);
        if (!nums) return null;
        return rgbToHex(nums[0], nums[1], nums[2]);
      }
      case 'hsl': {
        const nums = this.parseNumberList(raw, 3);
        if (!nums) return null;
        return hslToHex(nums[0], nums[1], nums[2]);
      }
      case 'hsv': {
        const nums = this.parseNumberList(raw, 3);
        if (!nums) return null;
        const rgb = hsvToRgb(nums[0], nums[1], nums[2]);
        return rgbToHex(rgb.r, rgb.g, rgb.b);
      }
      case 'cmyk': {
        const nums = this.parseNumberList(raw, 4);
        if (!nums) return null;
        const rgb = cmykToRgb(nums[0], nums[1], nums[2], nums[3]);
        return rgbToHex(rgb.r, rgb.g, rgb.b);
      }
      case 'hct': {
        const nums = this.parseNumberList(raw, 3);
        if (!nums) return null;
        try {
          return Hct.from(nums[0], nums[1], nums[2]).toHex();
        } catch {
          return null;
        }
      }
      default:
        return null;
    }
  }

  /**
   * Valide et applique la saisie hex au blur (sans commit intermédiaire sur #RGB partiel)
   */
  private commitHexFromField(): void {
    const raw = this.getHexFromField();
    const normalized = normalizeHex(raw);
    if (normalized) {
      this.commitHex(normalized);
      return;
    }
    this.setHexToField(this._lastCommittedHex || this.options.value);
  }

  /**
   * Applique une couleur hex et notifie le callback onChange
   */
  private commitHex(hex: string, syncOptions?: { skipHue?: boolean }): void {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    this._lastCommittedHex = normalized;
    const hsl = hexToHsl(normalized);
    if (hsl) {
      this.state = hsl;
    }
    if (!this._hexFieldFocused) {
      this.setHexToField(normalized);
    }
    this.syncUIFromHex(normalized, syncOptions);
    this.notifyChange(normalized);
  }

  /**
   * Notifie le callback onChange
   */
  private notifyChange(hex: string): void {
    if (this.options.onChange) {
      this.options.onChange(hex, this);
    }
  }

  private bindEvents(): void {
    if (!this.areaEl) return;

    const onAreaMove = (clientX: number, clientY: number): void => {
      if (!this.areaEl) return;
      const rect = this.areaEl.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      this.state.s = Math.round(x * 100);
      this.state.l = Math.round((1 - y) * 100);
      this.applyState();
    };

    this._unbindAreaPointer?.();
    this._unbindAreaPointer = bindPointerDown(this.areaEl, (e) => {
      if (e instanceof Event) {
        e.preventDefault();
      }
      this.dragging = 'area';
      const { x, y } = getPointerCoords(e);
      onAreaMove(x, y);
      const pointerId = e instanceof PointerEvent ? e.pointerId : 0;
      const area = this.areaEl;
      if (!area) return;
      this._areaDragCleanup?.();
      this._areaDragCleanup = startPointerDragSession({
        captureElement: area,
        pointerId,
        onMove: (ev) => {
          if (this.dragging === 'area') {
            const coords = getPointerCoords(ev);
            onAreaMove(coords.x, coords.y);
          }
        },
        onEnd: () => {
          this.dragging = null;
          this._areaDragCleanup = null;
        },
        preventDefaultOnMove: true,
      });
    });
  }

  private applyState(syncOptions?: { skipHue?: boolean }): void {
    const hex = hslToHex(this.state.h, this.state.s, this.state.l);
    this.commitHex(hex, syncOptions);
  }

  private syncUIFromHex(hex: string, syncOptions?: { skipHue?: boolean }): void {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    const hsl = hexToHsl(normalized);
    if (hsl) this.state = hsl;

    this._syncingFormats = true;

    if (this.previewEl) this.previewEl.style.backgroundColor = normalized;
    if (this.areaEl && this.areaEl.parentElement) {
      this.areaEl.parentElement.style.setProperty('--color-picker-current', normalized);
      this.areaEl.parentElement.style.setProperty('--color-picker-hue', `hsl(${this.state.h}, 100%, 50%)`);
    }
    if (this.handleEl) {
      this.handleEl.style.left = `${this.state.s}%`;
      this.handleEl.style.top = `${100 - this.state.l}%`;
    }
    if (
      !syncOptions?.skipHue &&
      !this._hueDragging &&
      this.hueSliderInstance &&
      typeof this.hueSliderInstance.setValue === 'function'
    ) {
      this._syncingHue = true;
      this.hueSliderInstance.setValue(this.state.h, 'single');
      this._syncingHue = false;
    }

    const rgb = hexToRgb(normalized);
    const hsv = hexToHsv(normalized);
    const cmyk = hexToCmyk(normalized);
    let hctValue = '';
    try {
      const hct = Hct.fromHex(normalized);
      hctValue = `${Math.round(hct.hue)}°, ${Math.round(hct.chroma)}, ${Math.round(hct.tone)}`;
    } catch {
      hctValue = '';
    }

    if (this.formatFieldEls.hex && !this._hexFieldFocused) {
      this.setFieldValue(this.formatFieldEls.hex, normalized);
    }
    if (rgb && this.formatFieldEls.rgb) {
      this.setFieldValue(this.formatFieldEls.rgb, `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
    if (hsl && this.formatFieldEls.hsl) {
      this.setFieldValue(this.formatFieldEls.hsl, `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`);
    }
    if (hsv && this.formatFieldEls.hsv) {
      this.setFieldValue(this.formatFieldEls.hsv, `${hsv.h}°, ${hsv.s}%, ${hsv.v}%`);
    }
    if (cmyk && this.formatFieldEls.cmyk) {
      this.setFieldValue(
        this.formatFieldEls.cmyk,
        `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`
      );
    }
    if (hctValue && this.formatFieldEls.hct) {
      this.setFieldValue(this.formatFieldEls.hct, hctValue);
    }

    this._syncingFormats = false;
  }

  /** Retourne la couleur actuelle en hex */
  getValue(): string {
    return normalizeHex(this.getHexFromField()) || this.options.value;
  }

  /** Définit la couleur (hex #RRGGBB) */
  setValue(hex: string): void {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    this.setHexToField(normalized);
    const hsl = hexToHsl(normalized);
    if (hsl) this.state = hsl;
    this.syncUIFromHex(normalized);
  }

  override destroy(): void {
    this.hueSliderInstance?.destroy();
    this.hueSliderInstance = null;
    this.hueSliderEl = null;
    this.unsubFormatFields?.();
    if ((this.el as KColorPickerHTMLElement).K_ColorPicker === this) {
      delete (this.el as KColorPickerHTMLElement).K_ColorPicker;
    }
    this.logger.info('ColorPicker destroyed');
  }
}

if (typeof window !== 'undefined' && typeof customElements !== 'undefined' && !customElements.get('k3ui-color-picker')) {
  customElements.define(
    'k3ui-color-picker',
    class K3UIColorPickerElement extends HTMLElement {
      connectedCallback(): void {
        if (this.classList.contains('no-autoinit')) {
          return;
        }
        ColorPicker.init(this);
      }
    }
  );
}
