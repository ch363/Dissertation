import { device } from 'detox';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root so DETOX_E2E_EMAIL / DETOX_E2E_PASSWORD are available
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

/**
 * Launch the app with synchronization disabled.
 * The app has background tasks (Supabase auth refresh, animations) that
 * keep running and prevent Detox idle detection.
 * We keep sync disabled throughout tests and rely on explicit waits.
 */
export async function launchAppSafe(
  options: Parameters<typeof device.launchApp>[0] = {},
): Promise<void> {
  // Launch the app with synchronization disabled
  await device.launchApp({
    newInstance: true,
    launchArgs: { detoxEnableSynchronization: 0 },
    ...options,
  });
  // Give the app time to initialize
  await new Promise((r) => setTimeout(r, 3000));
  // Keep synchronization disabled - the app has recurring timers that prevent idle
  await device.disableSynchronization();
}

/**
 * Reload React Native with synchronization disabled.
 */
export async function reloadAppSafe(): Promise<void> {
  await device.reloadReactNative();
  await new Promise((r) => setTimeout(r, 2000));
  // Keep synchronization disabled
  await device.disableSynchronization();
}

beforeAll(async () => {
  await launchAppSafe();
});

beforeEach(async () => {
  // Try to reload, but if app was terminated, launch fresh
  try {
    await reloadAppSafe();
  } catch {
    await launchAppSafe();
  }
});
