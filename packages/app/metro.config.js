const { createMetroConfiguration } = require('expo-yarn-workspaces');

let metroConfig = createMetroConfiguration(__dirname);

metroConfig.resolver.extraNodeModules = require('node-libs-react-native');

module.exports = metroConfig;
