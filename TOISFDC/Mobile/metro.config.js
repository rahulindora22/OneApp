const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// On Windows, Metro cannot create directories named "node:*" (colon is illegal).
// Stub out any Node.js built-in imported with the "node:" protocol so Metro
// never tries to cache them as file-system paths.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('node:')) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
