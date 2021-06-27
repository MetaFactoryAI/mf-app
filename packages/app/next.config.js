// @generated: @expo/next-adapter@2.1.32
// Learn more: https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/guides/using-nextjs.md#withexpo

const { withExpo } = require('@expo/next-adapter');
const withImages = require('next-images');

const withTM = require('next-transpile-modules')([
  '@mf/components',
  'react-native-dapp',
  'keyvaluestorage',
]);
const withPlugins = require('next-compose-plugins');

module.exports = withPlugins([
  withTM,
  withImages,
  [withExpo, { projectRoot: __dirname }],
]);
