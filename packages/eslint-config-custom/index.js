module.exports = {
  extends: [
    'eslint:recommended',
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  settings: {
    next: {
      rootDir: '../../apps/next/',
    },
  },
  plugins: ['@typescript-eslint'],
  ignorePatterns: [
    '.eslintrc.js',
    '*.config.js',
    'shim.js',
    './node_modules/**',
  ],
  root: true,
  rules: {
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        pathGroups: [
          {
            pattern: 'app/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: 'shared/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: 'services/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '~/**',
            group: 'internal',
            position: 'after',
          },
          {
            pattern: '@*/**',
            group: 'external',
          },
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
          {
            pattern: 'next/**',
            group: 'external',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        'newlines-between': 'always',
      },
    ],
  },
};
