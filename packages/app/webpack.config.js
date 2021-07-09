const createExpoWebpackConfigAsync = require('@expo/webpack-config');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@mf/ui'],
      },
    },
    argv,
  );

  // if (env.mode === 'production') {
  //   config.plugins.push(
  //     new BundleAnalyzerPlugin({
  //       path: 'web-report',
  //     }),
  //   );
  // }

  return config;
};
