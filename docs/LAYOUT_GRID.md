# Grille layout K3UI → Material 3

Migration **progressive et opt-in**. Le contrat historique de `.row` reste le défaut.

## Défaut (inchangé)

| Propriété | Valeur |
|-----------|--------|
| Colonnes | 12 |
| Gap | `$gap-size` = `1.5rem` (≈ 24px) |
| Spans | `.s*`, `.m*`, `.l*`, `.xl*` |

Ne **pas** modifier `$gap-size` globalement : ~366 `.row` dans k3ui-docs en dépendent.

## Variables CSS M3

Émises sur `:root` (breakpoints K3UI alignés M3) :

| Viewport | `--k3ui-grid-gutter` | `--k3ui-grid-margin` | `--k3ui-grid-columns` |
|----------|----------------------|----------------------|------------------------|
| compact (&lt;600) | 8px | 16px | 4 |
| medium (≥600) | 16px | 24px | 8 |
| expanded (≥840) | 16px | 24px | 12 |
| large (≥1200) | 24px | 24px | 12 |

Aussi : `--k3ui-grid-gutter-dense` = 8px (hero / tuiles type [m3.material.io](https://m3.material.io/) `.split-asset`).

## Modificateurs opt-in

```html
<!-- Gutters adaptatifs M3 -->
<div class="row row--gap-adaptive">…</div>

<!-- Dense 8dp (hero marketing) -->
<div class="row row--gap-dense">…</div>

<!-- Force fixe -->
<div class="row row--gap-8">…</div>
<div class="row row--gap-16">…</div>
<div class="row row--gap-24">…</div>

<!-- Colonnes (pas de bascule auto selon viewport) -->
<div class="row row--4-col">…</div>
<div class="row row--8-col">…</div>
```

## Ce qui n’est pas fait (major future)

- Changer le défaut de `.row` vers gap adaptive
- Auto-switch 4 ↔ 8 ↔ 12 tracks sur `.row` (casserait `s12 m6`)

## Fichiers

- `scss/tokens/layout.token.scss`
- `scss/mixins/layout.mixin.scss`
- `scss/modules/layout.module.scss`
