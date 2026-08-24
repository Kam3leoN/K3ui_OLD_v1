# K3UI — Project Tree

Vue scannable de l’arborescence (hors `node_modules`, `dist`, `build`, `.git`, caches).

```text
k3ui/
├── assets/                 # Fonts, images, sons, audio (+ `qrcode/{dots,corners,covers}`)
├── docs/                   # PROJECT_TREE, EXTENSIONS, DEFERRED_COMPONENTS, LAYOUT_GRID…
├── scripts/                # Scripts de build / maintenance (`generate-qr-shape-catalog.mjs`…)
├── scss/
│   ├── bases/
│   ├── extensions/         # SCSS des extensions (générateurs / effets / gestes)
│   ├── mixins/
│   ├── modules/
│   ├── modules-core/
│   ├── tokens/
│   ├── index.scss
│   └── index-core.scss
├── src/
│   ├── components/         # Composants UI cœur (+ shims vers extensions/)
│   ├── config/             # defaults, selectors, registry (+ EXTENSION_COMPONENT_NAMES)
│   ├── constants/
│   ├── core/
│   │   ├── autoinit/
│   │   ├── base/
│   │   ├── factories/
│   │   ├── managers/       # Theme, Locale, Gesture, Keyboard, Mouse, Motion…
│   │   └── registries/
│   ├── extensions/         # Générateurs, effets, gestes (QrCode, Firework, SwipeDeck…)
│   │   ├── generators/
│   │   ├── effects/
│   │   └── gestures/
│   ├── i18n/
│   ├── specs/
│   ├── types/
│   ├── utils/
│   └── index.ts
├── tests/
├── package.json
├── tsconfig.json
├── vite.config.js
└── README.md
```

## Managers (`src/core/managers/`)

- CookieManager, DynamicColorManager, EventListenerManager, HapticManager
- IconManager, KeyboardManager, LocaleManager, LoggerManager
- MotionManager, MouseManager, GestureManager, **PrivacyManager**, SoundFXManager
- ThemeManager, ToastToasterManager

## Notes structurelles

- Identité loader publique : `LoadingIndicator` ; `Loader.ts` = re-export `@deprecated`
- Composant **Bubble** : bulles de conversation (SCSS `bubble.*` + `src/components/Bubble.ts`)
- Composant **Collapse** : accordion M3 Expressive (SCSS `collapse.*` + `src/components/Collapse.ts`)
- Composant **Quote** + primitive **notch** : citation motivante avec encoche SVG (`quote.*`, `notch.*`, `src/components/Quote.ts`, `src/utils/dom/notch.ts`)
- Composant **PaginationNav** : cartes Précédent/Suivant (`paginationnav.*` + `PaginationNav.ts`, docs `paginationnav.php`)
- **Extensions** : générateurs / effets / gestes — voir `docs/EXTENSIONS.md` ; `EXTENSION_COMPONENT_NAMES` dans `components-registry.ts`
- Extension **QrCode** : moteur SVG maison — `src/extensions/generators/qrcode/`, assets `assets/qrcode/`, dep `qrcode-generator`
- Motion M3 : `scss/tokens/motion.token.scss` + `src/utils/motion/` + `src/specs/common/motion-presets.specs.ts`
- Colorimétrie : dépendance `@material/material-color-utilities` + façade `src/utils/color/` (`DynamicColorManager`, tokens d’état / extensions K3UI)
- Tokens thème : `--md-sys-color-*` canoniques ; aliases `--k3ui-*` émis par `theme.mixin.scss`
- Grille M3 opt-in : `--k3ui-grid-gutter|margin|columns` + `.row--gap-adaptive|dense|8|16|24` + `.row--4-col` (voir `docs/LAYOUT_GRID.md`) ; défaut `.row` inchangé (12 cols, gap 24px)
