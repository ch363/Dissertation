/**
 * Shared E2E test lifecycle helpers
 * Consolidates setup and teardown patterns for authenticated tests
 */

import { loginWithEmailPassword, signOutUser } from './auth';

/**
 * Delay helper for waiting between actions
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Setup an authenticated test
 * Launches the app and logs in with test credentials
 * @param launchArgs Optional launch arguments for the app
 */
export async function setupAuthenticatedTest(
  launchArgs?: Record<string, unknown>,
): Promise<void> {
  await device.launchApp({
    newInstance: true,
    ...launchArgs,
  });

  await loginWithEmailPassword();
  await delay(2000);
}

/**
 * Teardown an authenticated test
 * Signs out the user
 */
export async function teardownAuthenticatedTest(): Promise<void> {
  try {
    await signOutUser();
  } catch (error) {
    // Sign out failure is non-critical for teardown
    console.warn('Sign out failed during teardown:', error);
  }
}

/**
 * Setup a test without authentication
 * Just launches the app
 * @param launchArgs Optional launch arguments for the app
 */
export async function setupUnauthenticatedTest(
  launchArgs?: Record<string, unknown>,
): Promise<void> {
  await device.launchApp({
    newInstance: true,
    ...launchArgs,
  });
}

/**
 * Reload the app (useful for testing app state persistence)
 */
export async function reloadApp(): Promise<void> {
  await device.launchApp({
    newInstance: false,
  });
  await delay(2000);
}

/**
 * Terminate and relaunch the app with a new instance
 */
export async function restartApp(): Promise<void> {
  await device.terminateApp();
  await delay(1000);
  await device.launchApp({
    newInstance: true,
  });
  await delay(2000);
}

/**
 * Common beforeAll for authenticated tests
 * Usage:
 * ```ts
 * beforeAll(beforeAllAuthenticated);
 * afterAll(afterAllAuthenticated);
 * ```
 */
export const beforeAllAuthenticated = () => setupAuthenticatedTest();

/**
 * Common afterAll for authenticated tests
 */
export const afterAllAuthenticated = () => teardownAuthenticatedTest();
