const { withExpo } = require('@expo/next-adapter');
const withFonts = require('next-fonts');
const withImages = require('next-images');
const withPlugins = require('next-compose-plugins');
const withTM = require('next-transpile-modules')([
  'app',
  'services',
  'solito',
  'nativewind',
]);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // reanimated (and thus, Moti) doesn't work with strict mode currently...
  // https://github.com/nandorojo/moti/issues/224
  // https://github.com/necolas/react-native-web/pull/2330
  // https://github.com/nandorojo/moti/issues/224
  // once that gets fixed, set this back to true
  reactStrictMode: false,
  swcMinify: true,
  // webpack5: true,
  experimental: {
    scrollRestoration: true,
    forceSwcTransforms: true,
    swcPlugins: [[require.resolve('./plugins/swc_plugin_reanimated.wasm')]],
    transpilePackages: ['app', 'services', 'solito', 'nativewind', 'moti'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

const nextPlugins = [
  withTM,
  withFonts,
  withImages,
  // [withExpo, { projectRoot: __dirname + '/../..' }],
  withExpo,
];

const transform = withPlugins(nextPlugins);

// https://github.com/cyrilwanner/next-compose-plugins/issues/59
module.exports = function (name, { defaultConfig }) {
  return transform(name, {
    ...defaultConfig,
    ...nextConfig,
  });
};

// module.exports = withPlugins(nextPlugins, nextConfig);