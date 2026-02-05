import { device, element, by, waitFor, expect } from 'detox';

import { loginWithEmailPassword } from './helpers/auth';
import { launchAppSafe } from './setup';

/**
 * Diagnostic test to understand what's visible after login
 */
describe('Diagnostic', () => {
  beforeAll(async () => {
    await launchAppSafe();
  });

  it('should identify what is visible after login', async () => {
    // Login
    await loginWithEmailPassword();
    console.log('[Diagnostic] Login complete');

    // Wait a bit
    await new Promise((r) => setTimeout(r, 2000));
    console.log('[Diagnostic] After 2s wait');

    // Check for various elements to understand what's on screen
    const checks = [
      { name: 'tab-home', selector: by.id('tab-home') },
      { name: 'tab-learn', selector: by.id('tab-learn') },
      { name: 'tab-profile', selector: by.id('tab-profile') },
      { name: 'home-screen-scroll', selector: by.id('home-screen-scroll') },
      { name: 'Error text', selector: by.text('Something went wrong') },
      { name: 'Try Again button', selector: by.text('Try Again') },
      { name: 'Loading text', selector: by.text('Loading') },
      { name: 'Log In button', selector: by.text('Log In') },
      { name: 'Get Started button', selector: by.text('Get Started') },
      { name: 'Welcome back text', selector: by.text('Welcome back') },
    ];

    for (const check of checks) {
      try {
        await waitFor(element(check.selector)).toExist().withTimeout(1000);
        console.log(`[Diagnostic] FOUND: ${check.name}`);
      } catch {
        console.log(`[Diagnostic] NOT FOUND: ${check.name}`);
      }
    }

    // Wait more and check again
    await new Promise((r) => setTimeout(r, 5000));
    console.log('[Diagnostic] After 7s total');

    for (const check of checks) {
      try {
        await waitFor(element(check.selector)).toExist().withTimeout(1000);
        console.log(`[Diagnostic] FOUND (7s): ${check.name}`);
      } catch {
        console.log(`[Diagnostic] NOT FOUND (7s): ${check.name}`);
      }
    }

    // The test passes if we get here - we just want diagnostic output
  });
});
