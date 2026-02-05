import { device } from 'detox';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root so DETOX_E2E_EMAIL / DETOX_E2E_PASSWORD are available
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

/**
 * Launch the app with synchronization disabled during startup.
 * The app has background tasks (Supabase auth refresh, animations) that
 * keep running and prevent Detox idle detection.
 */
export async function launchAppSafe(
  options: Parameters<typeof device.launchApp>[0] = {},
): Promise<void> {
  await device.disableSynchronization();
  await device.launchApp({ newInstance: true, ...options });
  // Give the app time to initialize before re-enabling synchronization
  await new Promise((r) => setTimeout(r, 3000));
  await device.enableSynchronization();
}

/**
 * Reload React Native with synchronization disabled during reload.
 */
export async function reloadAppSafe(): Promise<void> {
  await device.disableSynchronization();
  await device.reloadReactNative();
  await new Promise((r) => setTimeout(r, 2000));
  await device.enableSynchronization();
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
