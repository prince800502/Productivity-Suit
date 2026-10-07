/* eslint-env node */
/* global __dirname, __filename, require, module, process */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use only the root node_modules for resolution (hoisted dependencies)
config.resolver.nodeModulesPaths = [
  `${__dirname}/../../node_modules`,
];

// Add the pnpm store and packages to watchFolders so Metro can find the files
config.watchFolders = [
  `${__dirname}`,
  `${__dirname}/../../node_modules/.pnpm`,
  `${__dirname}/../../packages`,
  `${__dirname}/../../node_modules`,
];

// Add support for package exports
config.resolver.unstable_enablePackageExports = true;

// Ensure TypeScript files are resolved
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

// Set main fields to look for - react-native first for React Native compatibility
config.resolver.mainFields = ['react-native', 'main', 'module', 'browser'];

// Handle workspace package resolution, expo-router entry, and pnpm store dependencies
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle expo-router entry specifically
  if (moduleName === 'expo-router/entry') {
    try {
      return {
        filePath: require.resolve('expo-router/entry', { paths: [`${__dirname}/../../node_modules`] }),
        type: 'sourceFile',
      };
    } catch (e) {
      // Fall through to default resolution
    }
  }
  
  // Handle workspace packages - point to actual package directories (not junctions)
  if (moduleName === '@productivity-suite/core') {
    try {
      return {
        filePath: path.resolve(__dirname, '../../packages/core/index.js'),
        type: 'sourceFile',
      };
    } catch (e) {
      // Fall through
    }
  }
  
  if (moduleName === '@productivity-suite/ui') {
    try {
      return {
        filePath: path.resolve(__dirname, '../../packages/ui/index.js'),
        type: 'sourceFile',
      };
    } catch (e) {
      // Fall through
    }
  }
  
  // Handle React and React Native for pnpm store packages
  if (moduleName === 'react' || moduleName === 'react-native' || moduleName.startsWith('react/')) {
    try {
      return {
        filePath: require.resolve(moduleName, { paths: [`${__dirname}/../../node_modules`] }),
        type: 'sourceFile',
      };
    } catch (e) {
      // Fall through
    }
  }
  
  // Handle expo packages for pnpm store packages
  if (moduleName.startsWith('expo') || moduleName.startsWith('@expo/')) {
    try {
      return {
        filePath: require.resolve(moduleName, { paths: [`${__dirname}/../../node_modules`] }),
        type: 'sourceFile',
      };
    } catch (e) {
      // Fall through
    }
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;