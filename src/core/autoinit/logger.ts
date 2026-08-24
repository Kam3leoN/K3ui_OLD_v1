import { LoggerManager } from '../managers';

/** Logger K3UI partagé (évite de recréer à chaque init) */
export const k3uiLogger = LoggerManager.create('[K3UI]', 'Front-end');
