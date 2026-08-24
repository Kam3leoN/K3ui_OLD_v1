# Contribuer à K3UI

Merci de votre intérêt pour contribuer à K3UI. Ce document décrit comment préparer votre environnement et soumettre des contributions.

## Prérequis

- Node.js 20+
- npm

## Installation

```bash
git clone <url-du-repo>
cd k3ui
npm ci
```

## Commandes utiles

| Commande                | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `npm run build`         | Build complet (Vite + SCSS + copie vers k3ui-docs)             |
| `npm run build:ci`      | Build sans copie docs (pour CI / environnement sans k3ui-docs) |
| `npm run lint`          | Vérification TypeScript (`tsc --noEmit`)                       |
| `npm test`              | Tests unitaires (Jest)                                         |
| `npm run test:ci`       | Tests en mode CI (couverture, sans watch)                      |
| `npm run test:coverage` | Tests avec rapport de couverture                               |

## Nouveau composant

Pour intégrer un **nouveau composant**, suivez le guide d’intégration qui décrit la structure des fichiers, les patterns et la checklist :

- **[.md/PROMPT_INTEGRATION_COMPOSANT.md](.md/PROMPT_INTEGRATION_COMPOSANT.md)** — Prompt et checklist pour l’intégration d’un composant (TypeScript, SCSS tokens/mixins/modules, specs, config, doc, tests, API).

Respectez la checklist finale du document (build, tests, lint, documentation, tests unitaires, page API, vérification en navigateur, mise à jour du CHANGELOG).

## Avant de soumettre (checklist)

- [ ] `npm run lint` passe sans erreur
- [ ] `npm run build:ci` ou `npm run build` réussit
- [ ] `npm run test:ci` ou `npm test` passe
- [ ] Vérification manuelle dans le navigateur (page doc et api si vous touchez à un composant)
- [ ] CHANGELOG.md mis à jour pour les changements notables

## Workflow de contribution

1. Créer une branche à partir de `master` / `main` ou `develop`
2. Faire vos modifications en suivant les conventions du projet (voir `.cursorrules` à la racine)
3. Exécuter lint, build et tests localement
4. Soumettre une pull request en décrivant les changements

La CI exécutera automatiquement lint, build et tests sur chaque push et PR.

## Publication npm

- **Manuel** : après `npm run build`, exécuter `npm publish` (être connecté avec `npm login`). Vérifier la version dans `package.json` et `CHANGELOG.md`.
- **CI** : le workflow `.github/workflows/publish.yml` publie sur npm lorsqu’une **Release GitHub** est créée (tag `v*`). Configurer le secret `NPM_TOKEN` (token npm avec droit de publication) dans les paramètres du dépôt.
