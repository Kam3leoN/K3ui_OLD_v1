import { LoggerManager } from './LoggerManager';
import { PrivacyManager } from './PrivacyManager';
import { storage } from '../../utils/storage/storage';
import { getK3uiGlobal } from '../../types/global/k3ui-window';

/** Clé de stockage localStorage pour l'état activé/désactivé des effets sonores */
const SOUND_ENABLED_STORAGE_KEY = 'k3ui-sound-enabled';

/**
 * Interface pour les options du SoundFXManager
 */
export interface SoundFXOptions {
  /**
   * Activer les effets sonores
   * @default true
   */
  enabled: boolean;
  /**
   * Volume par défaut (0.0 à 1.0)
   * @default 0.5
   */
  volume: number;
  /**
   * Dossier racine des sons (relatif à assets/sounds/)
   * @default ''
   */
  soundsPath: string;
  /**
   * Formats audio supportés
   * @default ['mp3', 'ogg', 'wav', 'aac']
   */
  supportedFormats: string[];
  /**
   * Activer les sons au survol
   * @default true
   */
  hoverEnabled: boolean;
  /**
   * Activer les sons au clic
   * @default true
   */
  clickEnabled: boolean;
  /**
   * Activer les sons au mouvement
   * @default false
   */
  moveEnabled: boolean;
  /**
   * Activer les sons à la sortie
   * @default true
   */
  leaveEnabled: boolean;
  /**
   * Callback appelé lors du début de la lecture d'un son
   * @default null
   */
  onPlayStart: ((soundName: string, element: HTMLElement) => void) | null;
  /**
   * Callback appelé lors de la fin de la lecture d'un son
   * @default null
   */
  onPlayEnd: ((soundName: string, element: HTMLElement) => void) | null;
  /**
   * Callback appelé lors d'une erreur de lecture
   * @default null
   */
  onError: ((soundName: string, error: string, element: HTMLElement) => void) | null;
}

/**
 * Options par défaut du SoundFXManager
 */
const _defaults: SoundFXOptions = {
  enabled: true,
  volume: 0.5,
  soundsPath: '',
  supportedFormats: ['mp3', 'ogg', 'wav', 'aac'],
  hoverEnabled: true,
  clickEnabled: true,
  moveEnabled: false,
  leaveEnabled: true,
  onPlayStart: null,
  onPlayEnd: null,
  onError: null,
};

/**
 * Gestionnaire d'effets sonores pour K3UI
 */
export class SoundFXManager {
  /** Logger pour le manager */
  private static logger: LoggerManager = LoggerManager.create('[SoundFXManager]', 'Manager');

  private static _instance: SoundFXManager | null = null;
  private static _initialized: boolean = false;
  private static _options: SoundFXOptions = { ..._defaults };

  private options: SoundFXOptions;
  private audioContainer: HTMLElement | null = null;
  private activeAudios: HTMLAudioElement[] = [];
  private eventListeners: Map<HTMLElement, Map<string, EventListener>> = new Map();

  /**
   * Constructeur du SoundFXManager
   * @param options - Options de configuration
   */
  constructor(options: Partial<SoundFXOptions> = {}) {
    this.options = { ..._defaults, ...options };
    this.init();
  }

  /**
   * Initialise le SoundFXManager
   */
  private init(): void {
    if (this.options.enabled) {
      this.createAudioContainer();
      this.scanElements();
    }
  }

  /**
   * Crée le conteneur audio caché
   */
  private createAudioContainer(): void {
    this.audioContainer = document.createElement('div');
    this.audioContainer.id = 'k3ui-audio-container';
    this.audioContainer.style.cssText = 'position:absolute;top:-200px;display:none;';

    // Créer les spans pour chaque type de son (+ custom pour playSoundByName)
    const soundTypes = ['click', 'hover', 'leave', 'move', 'custom'];
    soundTypes.forEach(type => {
      const span = document.createElement('span');
      span.id = `k3ui-${type}-sound`;
      this.audioContainer!.appendChild(span);
    });

    document.body.appendChild(this.audioContainer);
  }

  /**
   * Scanne les éléments pour les attributs de son
   */
  private scanElements(): void {
    const elements = document.querySelectorAll('[hoverSound], [leaveSound], [clickSound], [moveSound]');
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        this.setupElementSounds(element);
      }
    });
  }

  /**
   * Configure les sons pour un élément
   * @param element - Élément HTML à configurer
   */
  private setupElementSounds(element: HTMLElement): void {
    const listeners = new Map<string, EventListener>();

    // Son au survol
    if (this.options.hoverEnabled && element.hasAttribute('hoverSound')) {
      const soundName = element.getAttribute('hoverSound')!;
      const hoverListener = () => this.playSound(soundName, element, 'hover');
      element.addEventListener('mouseenter', hoverListener);
      listeners.set('mouseenter', hoverListener);
    }

    // Son à la sortie
    if (this.options.leaveEnabled && element.hasAttribute('leaveSound')) {
      const soundName = element.getAttribute('leaveSound')!;
      const leaveListener = () => this.playSound(soundName, element, 'leave');
      element.addEventListener('mouseleave', leaveListener);
      listeners.set('mouseleave', leaveListener);
    }

    // Son au clic
    if (this.options.clickEnabled && element.hasAttribute('clickSound')) {
      const soundName = element.getAttribute('clickSound')!;
      const clickListener = () => this.playSound(soundName, element, 'click');
      element.addEventListener('mousedown', clickListener);
      listeners.set('mousedown', clickListener);
    }

    // Son au mouvement
    if (this.options.moveEnabled && element.hasAttribute('moveSound')) {
      const soundName = element.getAttribute('moveSound')!;
      const moveListener = () => this.playSound(soundName, element, 'move');
      element.addEventListener('mousemove', moveListener);
      listeners.set('mousemove', moveListener);
    }

    this.eventListeners.set(element, listeners);
  }

  /**
   * Joue un son
   * @param soundName - Nom du fichier son (sans extension)
   * @param element - Élément qui a déclenché le son
   * @param type - Type de son (hover, click, leave, move)
   */
  private playSound(soundName: string, element: HTMLElement, type: string): void {
    if (!this.options.enabled || !this.audioContainer) return;

    try {
      // Appeler le callback onPlayStart
      if (this.options.onPlayStart) {
        this.options.onPlayStart(soundName, element);
      }

      // Créer l'élément audio
      const audio = document.createElement('audio');
      audio.autoplay = true;
      audio.volume = this.options.volume;

      // Ajouter les sources pour chaque format supporté (chemin invalide -> format ignoré)
      this.options.supportedFormats.forEach(format => {
        const path = this.buildSoundPath(soundName, format);
        if (!path) return;
        const source = document.createElement('source');
        source.src = path;
        source.type = this.getMimeType(format);
        audio.appendChild(source);
      });

      // Gérer la fin de lecture
      audio.addEventListener('ended', () => {
        this.removeAudio(audio);
        if (this.options.onPlayEnd) {
          this.options.onPlayEnd(soundName, element);
        }
      });

      // Gérer les erreurs
      audio.addEventListener('error', () => {
        this.removeAudio(audio);
        if (this.options.onError) {
          this.options.onError(soundName, `Erreur lors de la lecture du format ${type}`, element);
        }
      });

      // Ajouter à la liste des audios actifs
      this.activeAudios.push(audio);

      // Insérer dans le conteneur approprié
      const container = this.audioContainer.querySelector(`#k3ui-${type}-sound`);
      if (container) {
        container.innerHTML = '';
        container.appendChild(audio);
      }

    } catch (error) {
      if (this.options.onError) {
        this.options.onError(soundName, `Erreur: ${error}`, element);
      }
    }
  }

  /**
   * Segment de chemin autorisé pour un dossier/fichier son (protection contre la traversée de répertoire).
   * N'autorise que lettres, chiffres, underscore et tiret.
   */
  private static readonly SAFE_PATH_SEGMENT = /^[a-zA-Z0-9_-]+$/;

  /**
   * Vérifie qu'un segment de chemin (dossier ou nom de fichier) ne contient que des caractères sûrs.
   * @param value Segment à valider
   * @returns true si le segment est sûr à utiliser dans un chemin de fichier
   */
  private static isSafePathSegment(value: string): boolean {
    if (!value) return false;
    if (value.includes('..') || value.includes('\\') || value.includes(':')) {
      return false;
    }
    return SoundFXManager.SAFE_PATH_SEGMENT.test(value);
  }

  /**
   * Valide un `soundName` pouvant contenir des sous-dossiers (ex: `fireworks/lift1`).
   * Chaque segment séparé par `/` doit être un segment de chemin sûr ; rejette `..`, `\` et `:`.
   * @param soundName Nom du son (avec éventuels sous-dossiers séparés par `/`)
   * @returns true si tous les segments sont sûrs
   */
  private static isSafeSoundName(soundName: string): boolean {
    if (!soundName || soundName.includes('..') || soundName.includes('\\') || soundName.includes(':')) {
      return false;
    }
    const segments = soundName.split('/').filter((s) => s.length > 0);
    if (segments.length === 0 || segments.length !== soundName.split('/').length) {
      return false;
    }
    return segments.every((segment) => SoundFXManager.SAFE_PATH_SEGMENT.test(segment));
  }

  /**
   * Construit le chemin vers le fichier son.
   * `soundName` (segments) et `format` sont whitelistés à `[a-zA-Z0-9_-]` pour empêcher toute
   * traversée de répertoire (`..`, `\`, `:`) via des valeurs contrôlées par le contenu (attributs data-*).
   * @param soundName - Nom du fichier son
   * @param format - Format du fichier
   * @returns Chemin complet vers le fichier, ou chaîne vide si invalide
   */
  private buildSoundPath(soundName: string, format: string): string {
    if (!SoundFXManager.isSafeSoundName(soundName)) {
      SoundFXManager.logger.warn(`Nom de son invalide (caractères non autorisés): ${soundName}`);
      return '';
    }
    if (!SoundFXManager.isSafePathSegment(format)) {
      SoundFXManager.logger.warn(`Format de son invalide (caractères non autorisés): ${format}`);
      return '';
    }

    // Utiliser le soundsPath configuré (via init.js ou defaults) ou détecter automatiquement
    const soundsPath = this.options.soundsPath || this.determineSoundsPath();
    const customPath = soundsPath.endsWith('/') ? soundsPath : `${soundsPath}/`;
    return `${customPath}${soundName}.${format}`;
  }

  /**
   * Détermine le chemin des sons automatiquement
   * @returns Le chemin des sons déterminé
   */
  private determineSoundsPath(): string {
    // Essayer de détecter depuis les scripts chargés
    const scripts = document.querySelectorAll('script[src*="k3ui"]');

    if (scripts.length > 0) {
      const scriptSrc = (scripts[0] as HTMLScriptElement).src;

      // Si le script est dans /dist/, les assets sont dans ../assets/
      if (scriptSrc.includes('/dist/')) {
        return '../assets/sounds/';
      }

      // Sinon, utiliser le chemin de base du script
      const baseUrl = scriptSrc.replace('/js/k3ui.min.js', '').replace('/js/k3ui.js', '');
      return `${baseUrl}/assets/sounds/`;
    }

    // Fallback : détecter depuis l'URL courante
    const currentPath = window.location.pathname;

    // Si on est dans /docs/, les assets sont dans ../assets/
    if (currentPath.includes('/docs/')) {
      return '../assets/sounds/';
    }

    if (currentPath.includes('/dist/')) {
      return '../assets/sounds/';
    }

    if (currentPath === '/' || currentPath.endsWith('/k3ui/') || currentPath.endsWith('/k3ui')) {
      return './assets/sounds/';
    }

    // Fallback par défaut - utiliser le chemin relatif vers assets/
    return '../assets/sounds/';
  }


  /**
   * Retourne le type MIME pour un format
   * @param format - Format du fichier
   * @returns Type MIME
   */
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'ogg': 'audio/ogg',
      'wav': 'audio/wav',
      'aac': 'audio/aac'
    };
    return mimeTypes[format] || 'audio/mpeg';
  }

  /**
   * Supprime un audio de la liste active
   * @param audio - Élément audio à supprimer
   */
  private removeAudio(audio: HTMLAudioElement): void {
    const index = this.activeAudios.indexOf(audio);
    if (index > -1) {
      this.activeAudios.splice(index, 1);
    }
  }

  /**
   * Arrête tous les sons en cours
   */
  public stopAllSounds(): void {
    this.activeAudios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.activeAudios = [];

    if (this.audioContainer) {
      const spans = this.audioContainer.querySelectorAll('span');
      spans.forEach(span => span.innerHTML = '');
    }
  }

  /**
   * Joue un son spécifique
   * @param soundName - Nom du fichier son
   * @param element - Élément déclencheur (optionnel)
   */
  public playSoundByName(soundName: string, element?: HTMLElement): void {
    if (!this.options.enabled) return;

    const targetElement = element || document.body;
    this.playSound(soundName, targetElement, 'custom');
  }

  /**
   * Précharge des sons pour lecture immédiate sans délai.
   * @param soundNames - Noms des fichiers (ex: ['fireworks/lift1', 'fireworks/burst1'])
   */
  public preloadSoundNames(soundNames: string[]): void {
    if (!this.options.enabled || soundNames.length === 0) return;
    const format = this.options.supportedFormats[0] || 'mp3';
    soundNames.forEach((name) => {
      const path = this.buildSoundPath(name, format);
      if (!path) return;
      const audio = document.createElement('audio');
      audio.preload = 'auto';
      const source = document.createElement('source');
      source.src = path;
      source.type = this.getMimeType(format);
      audio.appendChild(source);
      audio.load();
    });
  }

  /**
   * Met à jour les options
   * @param options - Nouvelles options
   */
  public updateOptions(options: Partial<SoundFXOptions>): void {
    this.options = { ...this.options, ...options };

    // Mettre à jour les options statiques
    SoundFXManager._options = { ...SoundFXManager._options, ...options };

    // Réinitialiser si l'état enabled a changé
    if (options.enabled !== undefined) {
      if (this.options.enabled) {
        this.init();
      } else {
        this.destroy();
      }
    }
  }

  /**
   * Retourne les options actuelles
   * @returns Options actuelles
   */
  public getOptions(): SoundFXOptions {
    return { ...this.options };
  }

  /**
   * Détruit le SoundFXManager
   */
  public destroy(): void {
    this.stopAllSounds();

    // Supprimer les écouteurs d'événements
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach((listener, event) => {
        element.removeEventListener(event, listener);
      });
    });
    this.eventListeners.clear();

    // Supprimer le conteneur audio
    if (this.audioContainer && this.audioContainer.parentNode) {
      this.audioContainer.parentNode.removeChild(this.audioContainer);
    }

    this.audioContainer = null;
  }

  /**
   * Initialise le SoundFXManager avec des options
   * @param options - Options de configuration
   * @returns Instance du SoundFXManager
   */
  static init(options?: Partial<SoundFXOptions>): SoundFXManager {
    if (this._instance) {
      this._instance.updateOptions(options || {});
      // Synchroniser l'interface après la mise à jour des options
      this.syncInterface();
      return this._instance;
    }

    // Restaurer les préférences depuis localStorage
    const savedEnabled = this.getSavedEnabled();
    const mergedOptions = { ...this._options, ...options };

    // Appliquer la préférence sauvegardée si elle existe
    if (savedEnabled !== null) {
      mergedOptions.enabled = savedEnabled;
    }

    this._options = mergedOptions;
    this._instance = new SoundFXManager(this._options);
    this._initialized = true;

    // Synchroniser l'interface après l'initialisation
    this.syncInterface();

    return this._instance;
  }

  /**
   * Récupère l'état sauvegardé depuis localStorage
   * @returns État sauvegardé ou null si non trouvé
   */
  private static getSavedEnabled(): boolean | null {
    try {
      const saved = storage.get<boolean>(SOUND_ENABLED_STORAGE_KEY);
      if (saved !== null && saved !== undefined) {
        return saved;
      }
    } catch (error) {
      this.logger.warn('Erreur lors de la lecture du localStorage pour SoundFX:', error);
    }
    return null;
  }

  /**
   * Obtient l'instance globale du SoundFXManager
   * @returns Instance du SoundFXManager
   */
  static getInstance(): SoundFXManager {
    if (!this._instance) {
      this.init();
    }
    return this._instance!;
  }

  /**
   * Arrête tous les sons en cours (méthode statique)
   */
  static stopAllSounds(): void {
    if (this._instance) {
      this._instance.stopAllSounds();
    }
  }

  /**
   * Garantit qu'une instance existe (lazy au premier usage).
   */
  static ensureInit(options?: Partial<SoundFXOptions>): SoundFXManager {
    return this.init(options);
  }

  /**
   * Joue un son spécifique (méthode statique)
   * @param soundName - Nom du fichier son
   * @param element - Élément déclencheur (optionnel)
   */
  static playSoundByName(soundName: string, element?: HTMLElement): void {
    this.ensureInit();
    if (this._instance) {
      this._instance.playSoundByName(soundName, element);
    }
  }

  /**
   * Précharge des sons (méthode statique).
   * @param soundNames - Noms des fichiers (ex: ['fireworks/lift1', 'fireworks/burst1'])
   */
  static preloadSoundNames(soundNames: string[]): void {
    this.ensureInit();
    if (this._instance) {
      this._instance.preloadSoundNames(soundNames);
    }
  }

  /**
   * Met à jour les options (méthode statique)
   * @param options - Nouvelles options
   */
  static updateOptions(options: Partial<SoundFXOptions>): void {
    if (this._instance) {
      this._instance.updateOptions(options);
    } else {
      this._options = { ...this._options, ...options };
    }
  }

  /**
   * Obtient les options actuelles (méthode statique)
   * @returns Options actuelles
   */
  static getOptions(): SoundFXOptions {
    if (this._instance) {
      return this._instance.getOptions();
    }
    return { ...this._options };
  }

  /**
   * Détruit le SoundFXManager (méthode statique)
   */
  static destroy(): void {
    if (this._instance) {
      this._instance.destroy();
      this._instance = null;
      this._initialized = false;
    }
  }

  /**
   * Retourne les options par défaut
   * @returns Options par défaut
   */
  static get defaults(): SoundFXOptions {
    return _defaults;
  }

  /**
   * Vérifie si le SoundFXManager est initialisé
   * @returns true si initialisé
   */
  static get isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Bascule l'état du son et gère l'interface utilisateur
   */
  static async toggleSound(): Promise<void> {
    try {
      this.ensureInit();
      const currentOptions = this.getOptions();
      const newEnabled = !currentOptions.enabled;

      // Mettre à jour le manager et le stockage
      await this.updateOptions({ enabled: newEnabled });

      // Sauvegarder en localStorage (soumis au consentement de la catégorie "functional")
      if (PrivacyManager.canWrite(SOUND_ENABLED_STORAGE_KEY)) {
        storage.set(SOUND_ENABLED_STORAGE_KEY, newEnabled);
      } else {
        this.logger.debug('Sound preference write skipped (privacy consent)');
      }

      // Mettre à jour l'interface (icône, tooltip, toast) avec le nouvel état
      this.updateSoundIcon(newEnabled);

      // Émettre un événement personnalisé pour la synchronisation
      const soundToggleEvent = new CustomEvent('soundfx-toggled', {
        detail: { enabled: newEnabled }
      });
      document.dispatchEvent(soundToggleEvent);
    } catch (error) {
      this.logger.error('Erreur lors du basculement du son:', error);
      throw error;
    }
  }

  /**
   * Met à jour l'icône et le tooltip du bouton son et affiche un feedback
   * @param forceState État forcé à utiliser (optionnel)
   * @param showToast Afficher un message de confirmation (défaut: true)
   */
  static updateSoundIcon(forceState?: boolean, showToast: boolean = true): void {
    // Chercher le bouton sound-toggle
    const soundButton = document.querySelector('.sound-toggle') as HTMLElement;
    if (!soundButton) {
      this.logger.warn('Bouton sound-toggle non trouvé');
      return;
    }

    // Chercher l'icône dans le bouton
    const icon = soundButton.querySelector('i[name]') as HTMLElement;
    if (!icon) {
      this.logger.warn('Icône sound non trouvée');
      return;
    }

    // Utiliser l'état forcé ou obtenir l'état actuel du son
    const isEnabled = forceState !== undefined ? forceState : this.getOptions().enabled;
    const iconName = isEnabled ? 'volume-on' : 'volume-off';

    // Mettre à jour l'icône
    icon.setAttribute('name', iconName);
    icon.removeAttribute('folder');

    // Mettre à jour le tooltip (data-tooltip pour K3UI Tooltips, texte dynamique selon l'état)
    const tooltipText = isEnabled ? "Couper l'audio" : "Activer l'audio";
    soundButton.setAttribute('data-tooltip', tooltipText);
    soundButton.setAttribute('aria-label', tooltipText);

    // Classe pour opacité réduite quand le son est coupé (aligné avec reduce-motion toggle)
    soundButton.classList.toggle('sound-toggle--muted', !isEnabled);

    // Forcer la mise à jour de l'icône via IconManager
    getK3uiGlobal()?.IconManager?.updateIcon(icon);

    // Afficher un message de confirmation seulement si demandé
    const toast = getK3uiGlobal()?.Toast;
    if (showToast && toast) {
      const message = isEnabled ? 'Audio activé' : 'Audio désactivé';
      const variant = isEnabled ? 'success' : 'error';
      toast.show({
        title: 'Son',
        icon: iconName,
        description: message,
        variant,
        closeDelay: 2000,
        showClose: false,
        showProgressBar: true,
      });
    }

    // Log de succès
    this.logger.success(`Icône son changée vers ${iconName} (état: ${isEnabled})`);
  }

  /**
   * Synchronise l'interface utilisateur avec l'état actuel du son
   */
  static syncInterface(): void {
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.updateSoundIcon(undefined, false); // Sans toast lors de l'initialisation
      });
    } else {
      // Le DOM est déjà prêt, synchroniser immédiatement
      this.updateSoundIcon(undefined, false); // Sans toast lors de l'initialisation
    }
  }
}
