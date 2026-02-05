import { element, by, expect } from 'detox';
import { getE2ECredentials, loginWithEmailPassword } from './helpers/auth';

const hasCredentials = () => {
  try {
    getE2ECredentials();
    return true;
  } catch {
    return false;
  }
};

describe('Login flow', () => {
  it('should show landing then sign in and reach home', async () => {
    if (!hasCredentials()) {
      console.warn('Skipping login test: set DETOX_E2E_EMAIL and DETOX_E2E_PASSWORD to run');
      return;
    }

    await loginWithEmailPassword();

    await expect(element(by.text('Learn'))).toBeVisible();
  });
});
