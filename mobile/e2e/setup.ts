import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env from project root so DETOX_E2E_EMAIL / DETOX_E2E_PASSWORD are available
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import { device } from 'detox';

beforeAll(async () => {
  await device.launchApp({ newInstance: true });
});

beforeEach(async () => {
  // Try to reload, but if app was terminated, launch fresh
  try {
    await device.reloadReactNative();
  } catch {
    await device.launchApp({ newInstance: true });
  }
});
