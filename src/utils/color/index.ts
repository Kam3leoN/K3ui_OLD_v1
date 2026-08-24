/**
 * @fileoverview Entrypoint pour les utilitaires de couleurs K3UI
 * @description Exporte les façades publiques et réexporte les types du package Material
 */

export {
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  hsvToRgb,
  rgbToCmyk,
  cmykToRgb,
  hexToHsl,
  hslToHex,
  hexToHsv,
  hexToCmyk,
  normalizeHex
} from './convert';
export type { HSL, HSV, CMYK } from './convert';
export * from './hct';
export * from './palette';
export * from './theme-generator';
export * from './scheme';
export * from './contrast';
export { argbToHex, hexToArgb, argbToRgbString } from './color-format';
export { buildStateTokens } from './state-tokens';
export type { StateTokenEntry } from './state-tokens';
export { buildK3uiExtensionTokens } from './k3ui-extension-tokens';
export { MaterialDynamicColors } from './material-dynamic-colors';

export { Blend, TemperatureCache } from '@material/material-color-utilities';
export type { DynamicColor } from '@material/material-color-utilities';
