module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Remove deprecated expo-router/babel plugin for SDK 50+
    plugins: [],
  };
};
