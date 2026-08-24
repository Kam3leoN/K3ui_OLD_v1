/**
 * Configuration Lighthouse CI pour k3ui-docs (home).
 * @see https://github.com/GoogleChrome/lighthouse-ci
 */
const DOCS_URL = process.env.LIGHTHOUSE_DOCS_URL || 'http://localhost/k3ui-docs/index.php';

/** @type {import('@lhci/cli').LHCI.ServerCommand.Options} */
module.exports = {
  ci: {
    collect: {
      url: [DOCS_URL],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        skipAudits: [],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.75 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['warn', { minScore: 0.96 }],
        'categories:seo': ['error', { minScore: 1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './build/lighthouse',
    },
  },
};
