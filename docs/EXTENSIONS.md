# Extensions K3UI

Les **Extensions** sont des modules optionnels (générateurs, effets décoratifs, gestes) —
hors design system Material « cœur » — chargés à la demande.

## Deferred ≠ Extension

| Concept | Rôle |
|---------|------|
| **Deferred** | Stratégie de bundle : chunk JS séparé, chargé si présent dans le DOM |
| **Extension** | Taxonomie produit : générateur / effet / geste optionnel |

Exemples **deferred mais pas extension** : `Chart`, `Table`, `Datepicker`, `Upload`.

Exemples **extension** (tous deferred) : `QrCode`, `BarCode`, `Firework`, `Confetti`, `Snow`, …

Source de vérité : `EXTENSION_COMPONENT_NAMES` dans `src/config/components-registry.ts`.

## API publique (non breaking)

```javascript
await K.loadDeferredComponents(); // charge tous les différés (inchangé)
// ou
await K.loadExtensions();         // charge uniquement les extensions

K.QrCode.init('.qrcode');         // API flat conservée
K.Extensions.QrCode === K.QrCode; // namespace de découverte (après chargement)
```

## Structure source

```text
src/extensions/
├── generators/   # QrCode, BarCode, Signature
├── effects/      # Firework, Confetti, Snow, Halo, Holo, Gradient
└── gestures/     # SwipeDeck
```

Les classes CSS publiques (`.qrcode`, `.firework`, …) **ne changent pas**.

Des **shims** temporaires restent dans `src/components/` (réexports) pour les imports profonds legacy ; préférez `src/extensions/...` ou l’API `K.*`.

## Voir aussi

- [DEFERRED_COMPONENTS.md](./DEFERRED_COMPONENTS.md) — mécanisme de chargement
- `src/extensions/index.ts` — métadonnées
