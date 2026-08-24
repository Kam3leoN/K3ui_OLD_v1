# Composants différés (deferred)

Certains composants K3UI ne sont **pas** dans le chunk JS principal. Ils sont chargés à la demande :

1. **AutoInit** — si un élément correspondant au sélecteur est présent dans le DOM (sans `.no-autoinit`)
2. **Manuel** — via `await K.loadDeferredComponents()` puis `K.NomComposant.init(...)`

Pour la taxonomie **Extensions** (générateurs / effets / gestes), voir [EXTENSIONS.md](./EXTENSIONS.md).

## Liste (extrait)

| Composant | Notes |
|-----------|--------|
| Chart, Table, Datepicker, Timepicker | Lourds / vendors (deferred, pas extensions) |
| Firework, Snow, Confetti | Effets canvas → Extensions |
| CodeBlock, ColorPicker, Upload, Comparison, Command | Différés pour alléger le bundle |
| Pace | Opt-in : `data-k3ui-pace="on"` sur `html`/`body`, ou `K.Pace.init()` |
| BarCode, QrCode, Signature, Tilt, … | Voir `COMPONENT_CONFIG.deferred` ; Qr/Bar/Signature → Extensions |

## Pattern demos / usage manuel

```javascript
async function boot() {
  await K.loadDeferredComponents();
  const el = document.getElementById('page-firework');
  const fw = K.Firework.init(el, { layer: 'front' })[0];
  fw.launchBurst(2);
}

if (window.K) boot();
else document.addEventListener('k3ui-ready', boot, { once: true });
```

Référence demos docs : `tilt-playground.js`, `firework-legacy.js`, `snow-legacy.js`, `qr-code-playground.js`.

## CSS

- **Publish** (`dist/css/k3ui*.css`) : CSS bibliothèque **complet**, non purgé.
- **Docs** : copie purgée après `copy:docs` ; toutes les pages docs chargent `k3ui.min.css`.
