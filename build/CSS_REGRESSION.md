# Non-régression CSS — chantier déduplication

## Baseline de référence

```bash
npm run css:baseline
```

Produit :

- `build/baseline.css` — compilation expanded de `scss/index.scss`
- `build/baseline.min.css` — version compressée
- `build/baseline-manifest.json` — tailles, gzip, métriques d'audit

## Comparer après un lot SCSS

```bash
# Recompiler le candidat (ex. via npm run build:scss)
npm run css:compare
# ou un fichier précis :
node scripts/css-regression-harness.mjs compare build/candidate.css
```

Sortie `0` = carte `{ sélecteur → déclarations }` identique (ordre des propriétés ignoré).
Rapport détaillé : `build/css-compare-report.json`.

## Audit rapide (métriques duplication)

```bash
npm run css:audit
node scripts/css-regression-harness.mjs audit dist/css/k3ui.css
```

## Règle de validation d'un lot

1. Modifier le SCSS du lot
2. `npm run build:scss` (ou `css:baseline` pour régénérer la référence **uniquement si le lot est validé**)
3. `npm run css:compare` — doit rester équivalent à la baseline **avant** le lot ; après déduplication, comparer visuellement + mettre à jour la baseline une fois le rendu validé
4. `npm run lint` + `npm test`

## Motion M3 full (springs Web)

- **12 springs** : `expressive|standard` × `spatial|effects` × `fast|default|slow` (table M3 « Convert springs to curves »).
- **Tokens actifs** (schéma courant) : `--md-sys-motion-{spatial|effects}-{fast|default|slow}-{duration|easing}`.
- **Défaut** : Expressive ; **Standard** : `html[data-motion-scheme="standard"]`.
- **API SCSS** : `motion.spring-duration(effects, fast)`, `motion.spring-easing(spatial, default)`.
- **Alias sémantiques** : `--md-sys-motion-easing-standard` → effects-fast ; `--md-sys-motion-easing-emphasized` → spatial-default.
- **Déprécié** : `motion.easing-var('linear-standard'|md2-*|protocol-*)` (shim → springs).

## LOT 2 — motion / easing (validé)

| Métrique | Avant (post-LOT 1) | Après |
|----------|-------------------:|------:|
| Taille brute | 2 054 927 o | 2 127 200 o |
| Gzip | 172 309 o | 173 720 o |
| `cubic-bezier` dans `k3ui.css` | ~1 217 | **~316** |
| `cubic-bezier(0.4,0,0.2,1)` (audit) | 561 | **456** |
| `var(--md-sys-motion-*)` | ~60 | **~9 500** |
| Fallbacks `var(..., cubic-bezier)` | 60 | **0** |

Changements :
- Courbes protocolaires centralisées dans `motion.token.scss` + `motion.easing-var()`.
- Tokens composants → `var(--md-sys-motion-easing-*)` (plus de literals dupliqués).
- Mixin `motion()` sans fallback SCSS dans `var()`.
- `animation.token`, toast, page-loader alignés.

## LOT 1 — thème (validé)

| Métrique | Avant | Après |
|----------|------:|------:|
| Taille brute (`k3ui.css`) | 2 041 697 o | 2 054 927 o |
| Gzip expanded | 172 639 o | 172 309 o |
| `var(..., #hex)` (tous tokens) | ~602 | ~435 |
| Fullscreen (sélecteurs) | 4×4 vendeurs | 4× `:is(...)` |

Changements SCSS : `sys-color-var` sans fallback en thème light, `color-scheme` centralisé dans `theme.module.scss`, suppression doublons `html[data-theme] body` dans `global.scss`.

Le harnais `css:compare` normalise `var(--token, fallback)` → `var(--token)` et accepte les écarts structurels fullscreen / body thème redondant.

## Tests visuels (phase suivante)

Prévu : Playwright ou jest-image-snapshot sur une page fixture (Button, Chip, Menu, Switch, Slider, Field, Card, Dialog — light/dark, hover/focus/disabled).
