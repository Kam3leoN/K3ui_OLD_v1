/**
 * Anti-FOUC : réapplication synchrone des couleurs dynamiques avant le premier paint.
 * Synchroniser la clé de stockage avec k3ui-docs/partials/metas.php si elle change.
 */

/** Clé localStorage du cache des variables CSS Material (écrit par DynamicColorManager). */
export const K3UI_DYNAMIC_COLOR_CSS_VARS_STORAGE_KEY = 'k3ui-dynamic-color-css-vars';

/** Clé localStorage des préférences DynamicColorManager. */
export const K3UI_DYNAMIC_COLOR_PREFS_STORAGE_KEY = 'k3ui-dynamic-color';

/** Clé localStorage du thème clair/sombre (ThemeManager). */
export const K3UI_THEME_STORAGE_KEY = 'k3ui-theme';

/**
 * Structure du cache CSS pour rejeu synchrone dans le head.
 */
export interface CachedDynamicColorCssVars {
    hash: string;
    isDark: boolean;
    vars: Record<string, string>;
}

/**
 * Collecte les custom properties définies en inline sur un élément.
 * @param target - Élément cible (souvent document.documentElement)
 */
export function collectInlineCssCustomProperties(target: HTMLElement): Record<string, string> {
    const vars: Record<string, string> = {};
    for (let i = 0; i < target.style.length; i++) {
        const prop = target.style.item(i);
        if (prop.startsWith('--')) {
            const value = target.style.getPropertyValue(prop).trim();
            if (value) {
                vars[prop] = value;
            }
        }
    }
    return vars;
}

/**
 * Persiste les variables CSS du thème pour rejeu avant chargement du bundle.
 */
export function cacheDynamicColorCssVars(
    target: HTMLElement,
    hash: string,
    isDark: boolean
): void {
    if (typeof localStorage === 'undefined') {
        return;
    }

    try {
        const payload: CachedDynamicColorCssVars = {
            hash,
            isDark,
            vars: collectInlineCssCustomProperties(target),
        };
        localStorage.setItem(K3UI_DYNAMIC_COLOR_CSS_VARS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        /* quota / mode privé */
    }
}

/**
 * Résout le mode clair/sombre effectif à partir des préférences persistées.
 */
function resolveEffectiveThemeMode(): 'light' | 'dark' {
    if (typeof window === 'undefined') {
        return 'light';
    }

    try {
        const savedTheme = localStorage.getItem(K3UI_THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
            return savedTheme;
        }
        if (savedTheme === 'auto' || savedTheme === 'system') {
            return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
    } catch {
        /* ignore */
    }

    try {
        const prefsRaw = localStorage.getItem(K3UI_DYNAMIC_COLOR_PREFS_STORAGE_KEY);
        if (prefsRaw) {
            const prefs = JSON.parse(prefsRaw) as { isDark?: boolean };
            if (typeof prefs.isDark === 'boolean') {
                return prefs.isDark ? 'dark' : 'light';
            }
        }
    } catch {
        /* ignore */
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Applique le mode clair/sombre sur <html> (classes + data-theme).
 */
function applyHtmlThemeMode(mode: 'light' | 'dark'): void {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(mode === 'dark' ? 'theme-dark' : 'theme-light');
    root.setAttribute('data-theme', mode);
}

/**
 * Rejoue le cache CSS depuis localStorage (usage runtime ou tests).
 */
export function applyCachedDynamicColorCssVars(): boolean {
    if (typeof localStorage === 'undefined' || typeof document === 'undefined') {
        return false;
    }

    try {
        const raw = localStorage.getItem(K3UI_DYNAMIC_COLOR_CSS_VARS_STORAGE_KEY);
        if (!raw) {
            applyHtmlThemeMode(resolveEffectiveThemeMode());
            return false;
        }

        const cached = JSON.parse(raw) as CachedDynamicColorCssVars;
        const root = document.documentElement;

        if (cached.vars && typeof cached.vars === 'object') {
            for (const [key, value] of Object.entries(cached.vars)) {
                if (key.startsWith('--') && value) {
                    root.style.setProperty(key, value);
                }
            }
        }

        const mode = typeof cached.isDark === 'boolean'
            ? (cached.isDark ? 'dark' : 'light')
            : resolveEffectiveThemeMode();
        applyHtmlThemeMode(mode);

        return true;
    } catch {
        applyHtmlThemeMode(resolveEffectiveThemeMode());
        return false;
    }
}

/**
 * Snippet à exécuter de façon synchrone dans le <head> pour éviter le flash des couleurs
 * Material par défaut (violet) avant l'init de DynamicColorManager.
 */
export const K3UI_DYNAMIC_COLOR_CRITICAL_SCRIPT =
    `(function(){try{var k="${K3UI_DYNAMIC_COLOR_CSS_VARS_STORAGE_KEY}";var t="${K3UI_THEME_STORAGE_KEY}";var p="${K3UI_DYNAMIC_COLOR_PREFS_STORAGE_KEY}";var r=document.documentElement;function mode(){try{var s=localStorage.getItem(t);if(s==="light"||s==="dark")return s;if(s==="auto"||s==="system")return window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var pr=localStorage.getItem(p);if(pr){var o=JSON.parse(pr);if(typeof o.isDark==="boolean")return o.isDark?"dark":"light";}}catch(e){}return window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}function apply(m){r.classList.remove("theme-light","theme-dark");r.classList.add(m==="dark"?"theme-dark":"theme-light");r.setAttribute("data-theme",m);}var raw=localStorage.getItem(k);if(!raw){apply(mode());return;}var c=JSON.parse(raw);if(c&&c.vars){for(var n in c.vars){if(Object.prototype.hasOwnProperty.call(c.vars,n)&&n.indexOf("--")===0&&c.vars[n]){r.style.setProperty(n,c.vars[n]);}}}apply(typeof c.isDark==="boolean"?(c.isDark?"dark":"light"):mode());}catch(e){try{var m=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.classList.remove("theme-light","theme-dark");document.documentElement.classList.add(m==="dark"?"theme-dark":"theme-light");document.documentElement.setAttribute("data-theme",m);}catch(x){}}})();`;
