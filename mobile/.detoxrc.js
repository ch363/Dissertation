/**
 * Detox E2E config for Expo (iOS Simulator).
 * Requires: npx expo prebuild --platform ios first (ios/ is gitignored).
 * Prebuild generates FluentiaMobile.xcworkspace and FluentiaMobile.app (from app name).
 * @type {Detox.DetoxConfig}
 */
module.exports = {
  logger: {
    level: process.env.DETOX_LOGLEVEL || 'info',
    overrideConsole: false,
    options: {
      showLogRecordDate: false,
      showLogRecordPrefix: false,
    },
  },
  behavior: {
    launchApp: 'auto',
    cleanup: {
      shutdownDevice: false,
    },
  },
  testRunner: {
    type: 'jest',
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    forwardEnv: true,
    retries: 1,
  },
  apps: {
    'ios.sim.debug': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Debug-iphonesimulator/FluentiaMobile.app',
      build:
        'npx expo prebuild --platform ios --no-install && xcodebuild -workspace ios/FluentiaMobile.xcworkspace -scheme FluentiaMobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
      launchArgs: {
        detoxPrintBusyIdleResources: 'NO',
      },
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 16 Pro Max' },
      headless: process.env.CI === 'true',
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.sim.debug',
    },
  },
};
