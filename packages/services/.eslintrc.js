module.exports = {
  root: true,
  extends: ['custom'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  overrides: [
    {
      files: ['./api/**/*.ts'],
      rules: {
        'import/no-default-export': 'off', // API routes have to have a default export
        'import/no-anonymous-default-export': 'off', // API routes have to have a default export
        'import/prefer-default-export': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
    {
      files: ['./**/*.ts'],
      rules: {
        'react-hooks/rules-of-hooks': 'off',
      },
    },
  ],
};
