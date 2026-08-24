# Tests Unitaires K3UI

Ce dossier contient tous les tests unitaires pour la bibliothèque K3UI.

## 🧪 Structure des tests

```
tests/
├── setup.ts              # Configuration globale des tests
├── env.ts                # Variables d'environnement de test
├── core/                 # Tests des managers
│   ├── LoggerManager.test.ts
│   └── ThemeManager.test.ts
├── components/           # Tests des composants
│   └── Toast.test.ts
└── integration/          # Tests d'intégration
    └── AutoInit.test.ts
```

## 🚀 Commandes disponibles

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests en mode watch (développement)
npm run test:watch

# Exécuter les tests avec couverture de code
npm run test:coverage

# Exécuter les tests pour CI/CD
npm run test:ci

# Exécuter les tests en mode debug
npm run test:debug
```

## 📊 Couverture de code

Les tests visent une couverture de code de **70%** minimum pour :

- Branches (conditions)
- Fonctions
- Lignes de code
- Statements

## 🎯 Types de tests

### Tests unitaires

- **Managers** : LoggerManager, ThemeManager, IconManager, etc.
- **Composants** : Toast, Snackbar, Dialog, Field, etc.
- **Utilitaires** : Fonctions helper, validation, etc.

### Tests d'intégration

- **AutoInit** : Initialisation automatique de tous les composants
- **Interactions** : Communication entre composants
- **Configuration** : Options globales et locales

## 🔧 Configuration

### Jest

- **Preset** : `ts-jest` pour TypeScript
- **Environnement** : `jsdom` pour simuler le DOM
- **Timeout** : 10 secondes par test
- **Coverage** : Seuils définis dans `jest.config.js`

### Mocks

- **localStorage/sessionStorage** : Simulés pour tous les tests
- **matchMedia** : Mock pour les requêtes média
- **Timers** : timers **réels** par défaut (`tests/setup.ts`, LOT 6) ; `jest.useFakeTimers()` localement si besoin
- **Instances** : `Foo.getInstance(el)` via le registre (LOT 6), pas `(el as any).K_Foo`
- **DOM** : Nettoyage automatique entre les tests

## 📝 Écriture de tests

### Structure recommandée

```typescript
describe("NomDuComposant", () => {
  beforeEach(() => {
    // Setup avant chaque test
  });

  afterEach(() => {
    // Cleanup après chaque test
  });

  describe("Fonctionnalité spécifique", () => {
    test("devrait faire quelque chose", () => {
      // Arrange
      const input = "test";

      // Act
      const result = component.method(input);

      // Assert
      expect(result).toBe("expected");
    });
  });
});
```

### Bonnes pratiques

- **Nommage** : Tests en français avec "devrait" + verbe
- **Isolation** : Chaque test est indépendant
- **Mocking** : Mocker les dépendances externes
- **Assertions** : Utiliser des assertions spécifiques
- **Cleanup** : Nettoyer après chaque test

## 🐛 Debug des tests

### Problèmes courants

1. **Timers** : fake timers **par test** ; `flushComponentInit()` pour le `onInit` async (`tests/helpers/component-init.ts`)
2. **Instances** : `Component.getInstance(el)` ou `Switch.getInstance(el)` ; `getKInstance` réservé au legacy DOM
3. **DOM** : S'assurer que le DOM est nettoyé entre les tests
4. **Async** : Utiliser `await` et `jest.advanceTimersByTime()`
5. **Mocks** : Vérifier que les mocks sont correctement configurés

### Commandes de debug

```bash
# Tests avec plus de détails
npm run test:debug

# Tests d'un fichier spécifique
npm test -- LoggerManager.test.ts

# Tests avec pattern
npm test -- --testNamePattern="devrait créer"
```

## 📈 Métriques

### Objectifs de qualité

- **Couverture** : ≥ 70%
- **Performance** : Tests < 100ms chacun
- **Fiabilité** : 0% de tests flaky
- **Maintenabilité** : Tests lisibles et maintenables

### Rapports

- **Coverage** : Généré dans `coverage/`
- **HTML** : `coverage/lcov-report/index.html`
- **JSON** : `coverage/coverage-final.json`

## 🔄 Intégration continue

Les tests sont configurés pour :

- **GitHub Actions** : `npm run test:ci`
- **Pre-commit hooks** : Validation avant commit
- **Pull requests** : Tests automatiques
- **Releases** : Validation avant publication

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [TypeScript Testing](https://jestjs.io/docs/getting-started#using-typescript)
