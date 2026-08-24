/**
 * Configuration Jest pour K3UI
 * @description Configuration des tests unitaires avec TypeScript et jsdom
 */

module.exports = {
  // Preset TypeScript
  preset: 'ts-jest',
  
  // Environnement de test (DOM simulé)
  testEnvironment: 'jsdom',
  
  // Fichier de configuration après l'environnement
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Mapping des modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@material/material-color-utilities/(.*)$':
      '<rootDir>/node_modules/@material/material-color-utilities/$1',
  },

  // Autoriser la transformation ESM du package Material Color Utilities
  transformIgnorePatterns: [
    '/node_modules/(?!(@material/material-color-utilities)/)',
  ],

  // Patterns de fichiers de test
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],
  
  // Couverture de code
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  
  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Répertoires à ignorer
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  // Configuration TypeScript avec transform
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      // Le code source `src/` n’est pas entièrement aligné sur `tsc --strict` ; on garde les globals Jest sans bloquer les suites.
      diagnostics: false
    }],
    '^.+\\.jsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      diagnostics: false,
      useESM: true,
    }],
  },
  
  // Timeout pour les tests
  testTimeout: 10000,

  // LOT 6 : limite la pression mémoire (OOM sur la suite complète)
  maxWorkers: 2,
  
  // Variables d'environnement
  setupFiles: ['<rootDir>/tests/env.ts']
};
