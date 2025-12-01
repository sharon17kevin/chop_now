// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .cjs files
config.resolver.sourceExts.push('cjs');

// Configure resolver to handle React Query's module structure
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
