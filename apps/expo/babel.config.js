module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [
      'transform-inline-environment-variables',
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          alias: {
            crypto: 'react-native-quick-crypto',
            stream: 'stream-browserify',
            buffer: '@craftzdog/react-native-buffer',
            'bn.js': 'react-native-bignumber',
          },
        },
      ],
      // https://expo.github.io/router/docs/intro#configure-the-babel-plugin
      require.resolve('expo-router/babel'),
    ],
  };
};
