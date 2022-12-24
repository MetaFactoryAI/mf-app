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
  ignorePatterns: ['.eslintrc.js', '*.config.js', 'shim.js'],
  root: true,
};
