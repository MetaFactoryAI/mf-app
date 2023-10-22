const { withExpo } = require('@expo/next-adapter');
const withPlugins = require('next-compose-plugins');

/** @type {import('next').NextConfig} */
const nextConfig = withExpo({
  swcMinify: true,
  experimental: {
    scrollRestoration: true,
    forceSwcTransforms: true,
  },

  typescript: {
    ignoreBuildErrors: !!process.env.CI,
  },
  eslint: { ignoreDuringBuilds: !!process.env.CI },
  transpilePackages: [
    'react-native',
    'expo',
    'app',
    '@mf/api',
    'services',
    'shared',
    'contracts',
    'solito',
    'nativewind',
  ],
});

// const nextPlugins = [withExpo];

// const transform = withPlugins(nextPlugins);

// https://github.com/cyrilwanner/next-compose-plugins/issues/59
// module.exports = function (name, { defaultConfig }) {
//   return transform(name, {
//     ...defaultConfig,
//     ...nextConfig,
//   });
// };

module.exports = nextConfig;
