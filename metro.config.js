const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * jsmediatags publishes `main` -> build2, but `browser` -> dist/jsmediatags.js which is not
 * in the npm tarball. Also jsmediatags's BlobFileReader / XhrFileReader / NodeFileReader
 * depend on browser/node APIs not available in React Native, so we stub them out.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const JSMEDIATAGS_BUILD_DIR = path.resolve(
  __dirname,
  'node_modules/jsmediatags/build2',
);
const JSMEDIATAGS_STUB = path.resolve(
  __dirname,
  'scripts/jsmediatags-empty.js',
);

const config = {
  resolver: {
    resolveRequest(context, moduleName, platform) {
      if (moduleName === 'jsmediatags') {
        return {
          type: 'sourceFile',
          filePath: path.join(JSMEDIATAGS_BUILD_DIR, 'jsmediatags.js'),
        };
      }
      // Stub out readers that don't work in React Native
      if (
        context.originModulePath &&
        context.originModulePath.startsWith(JSMEDIATAGS_BUILD_DIR) &&
        (moduleName === './BlobFileReader' ||
          moduleName === './XhrFileReader' ||
          moduleName === './NodeFileReader')
      ) {
        return {
          type: 'sourceFile',
          filePath: JSMEDIATAGS_STUB,
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
