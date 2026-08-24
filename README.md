# K3UI

Librairie UI basée sur Material You 3 (Material Design 3), SCSS + TypeScript. Composants accessibles, AutoInit par défaut, personnalisables via options.

## Installation

```bash
npm install k3ui
```

Ou chargement direct du script (CDN) :

```html
<link rel="stylesheet" href="https://unpkg.com/k3ui/dist/css/k3ui.min.css" />
<script src="https://unpkg.com/k3ui/dist/js/k3ui.min.js"></script>
```

## Usage minimal

Après chargement du script, les composants sont initialisés automatiquement sur les éléments correspondants (sélecteurs par défaut). Vous pouvez aussi utiliser l’API globale `K` :

> Composants lourds (Chart, Firework, Snow, CodeBlock, etc.) : voir [docs/DEFERRED_COMPONENTS.md](docs/DEFERRED_COMPONENTS.md) et `K.loadDeferredComponents()`.

```html
<div class="dialog" id="myDialog">
  <div class="dialog-container">
    <div class="dialog-header"><h2>Titre</h2></div>
    <div class="dialog-content"><p>Contenu.</p></div>
    <div class="dialog-footer">
      <div class="dialog-action-right">
        <button type="button" class="btn btn--text btn--sm btn--primary dialog-close ripple">
          Fermer
        </button>
      </div>
    </div>
  </div>
</div>

<script>
  var dialogEl = document.getElementById("myDialog");
  var instance = K.Dialog.getInstance(dialogEl);
  instance.open();
</script>
```

## Thème dynamique (DynamicColorManager)

Couleurs Material Dynamic Color injectées en `--md-sys-color-*` sur `:root`
(algorithmes via la dépendance `@material/material-color-utilities`, façade K3UI dans `src/utils/color/`).

```javascript
// dist/js/init.js — surcharge optionnelle
window.K3UI_OPTIONS = {
  DynamicColorManager: {
    sourceColor: '#6750A4',
    specVersion: '2025', // défaut K3UI (Expressive / rôles *-dim)
    variant: 2,          // Variant.TONAL_SPOT
    contrastLevel: 0,
    platform: 'phone',
  },
};
```

API runtime (après chargement de `k3ui.min.js`) :

- `K.DynamicColorManager.setSourceColor(hex)`
- `K.DynamicColorManager.setVariant(variant)` — ex. `K.Variant.EXPRESSIVE`
- `K.DynamicColorManager.setSpecVersion('2025' | '2021')`
- `K.DynamicColorManager.setContrastLevel(-1 | 0 | 1)`

Thème depuis image (lazy, hors bundle principal) :

```javascript
import { themeFromImage } from './src/utils/color/image-theme';
const { sourceColor, scheme } = await themeFromImage(imageEl, { specVersion: '2025' });
```
Licence des algorithmes couleur : Apache-2.0 (Google LLC) — voir `src/utils/color/NOTICE.md`.

## Configuration

Inclure avant le script K3UI un fichier qui définit les options :

```html
<script src="init.js"></script>
<script src="dist/js/k3ui.min.js"></script>
```

Dans `init.js` :

```javascript
window.K3UI_OPTIONS = {
  Dialog: {
    /* options */
  },
  Drawer: {
    /* options */
  },
  // ...
};
```

## CSS (SCSS)

Pour utiliser les sources SCSS dans votre build :

- Fichiers dans `scss/` (tokens, mixins, modules).
- Point d’entrée : `scss/index.scss`.
- Vous pouvez aussi importer les feuilles compilées : `k3ui/dist/css/k3ui.css` ou `k3ui/dist/css/k3ui.min.css`.

## Documentation

Site de documentation (exemples et API) : [https://k3ui-docs.vercel.app](https://k3ui-docs.vercel.app)

En local : dossier `k3ui-docs`.

## Vie privée / RGPD

K3UI est une librairie UI **sans analytics ni tracking**. Aucune donnée n'est envoyée à un serveur
tiers : `CookieManager` est un utilitaire bas niveau (pas de Matomo/AMP), et les seules écritures
`localStorage` servent à mémoriser des préférences d'interface ou le contenu saisi par l'utilisateur
dans le composant Todo.

### Clés de stockage utilisées

| Clé                          | Catégorie    | Usage                                              |
| ----------------------------- | ------------ | --------------------------------------------------- |
| `k3ui-privacy-consent`        | essential    | Mémorise le consentement lui-même (`PrivacyManager`) |
| `k3ui-theme`                   | functional   | Préférence de thème (clair/sombre/auto/système)     |
| `k3ui-locale`                  | functional   | Préférence de langue                                 |
| `k3ui-sound-enabled`           | functional   | Activation des effets sonores UI                    |
| `k3ui-dynamic-color`           | functional   | Préférences de couleur dynamique Material            |
| `k3ui-dynamic-color-css-vars`  | functional   | Cache anti-FOUC des variables CSS (couleur dynamique) |
| `k3ui-todo`                    | optional     | Contenu des listes de tâches (donnée utilisateur)    |

### PrivacyManager

Par défaut (aucun appel à `setConsent()`), les écritures `functional` restent autorisées pour rester
compatible avec les applications existantes ; les écritures `optional` (Todo) sont refusées tant
qu'un opt-in explicite n'a pas été donné — c'est pourquoi `Todo.persistToStorage` est `false` par
défaut.

```javascript
// Autoriser explicitement la persistance des préférences UI (thème, langue, son, couleur)
K.PrivacyManager.setConsent('functional', true);

// Autoriser explicitement la persistance du contenu du composant Todo (opt-in RGPD)
K.PrivacyManager.setConsent('optional', true);

// Refuser une catégorie et effacer immédiatement les clés localStorage correspondantes
K.PrivacyManager.setConsent('functional', false);

// Lister l'inventaire des clés connues (audit / bannière de consentement)
K.PrivacyManager.listKeys();

// Tout effacer (ex. bouton "Supprimer mes données" dans l'app hôte)
K.PrivacyManager.clearAll();
```

### Responsabilités de l'application hôte

- Afficher un bandeau/dialogue de consentement si la réglementation applicable (RGPD, ePrivacy...) l'exige,
  et appeler `PrivacyManager.setConsent(...)` en conséquence.
- Ne pas envoyer les valeurs saisies dans des champs sensibles (voir `InputPattern.SSN_FR`,
  `InputPattern.CREDIT_CARD`) à des services tiers ou à des logs applicatifs : ces patterns ne servent
  qu'à la validation de format côté UX dans K3UI.
- Préférer l'auto-hébergement des assets compilés (`dist/js`, `dist/css`) plutôt qu'un CDN public
  (ex. unpkg) lorsque la politique de confidentialité du site doit éviter les requêtes vers des tiers.

## Scripts

| Commande           | Description                  |
| ------------------ | ---------------------------- |
| `npm run build`    | Build JS + SCSS + copie docs |
| `npm run lint`     | Vérification TypeScript      |
| `npm test`         | Tests unitaires (Jest)       |

## Licence

Apache-2.0
