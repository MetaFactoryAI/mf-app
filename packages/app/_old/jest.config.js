module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest/setup.js'],
  moduleNameMapper: {
    '\\.svg': '<rootDir>/jest/__mocks__/svgMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|static-container|react-clone-referenced-element|@react-native-community|@walletconnect|expo(nent)?|@expo(nent)?/.*|victory|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@expo-google-fonts|@sentry/.*)',
  ],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/__fixtures__/**',
    '!**/__generated__/**',
    '!**/__web-build__/**',
    '!**/__testHelpers__/**',
  ],
  clearMocks: true,
};
