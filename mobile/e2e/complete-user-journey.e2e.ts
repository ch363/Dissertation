import { device, element, by, waitFor } from 'detox';

import { loginWithEmailPassword, signOutUser, goBack } from './helpers/auth';
import { launchAppSafe } from './setup';

/**
 * Complete User Journey E2E Test
 * Tests a full end-to-end user session through all main screens
 */
describe('Complete User Journey', () => {
  beforeAll(async () => {
    await launchAppSafe();
    await loginWithEmailPassword();
    await new Promise((r) => setTimeout(r, 2000));
  });

  afterAll(async () => {
    await signOutUser();
  });

  it('should complete a full user journey through all main screens', async () => {
    // 1. Start on Home screen (already there after login)
    const homeTab = element(by.id('tab-home'));
    await waitFor(homeTab).toBeVisible().withTimeout(5000);
    await new Promise((r) => setTimeout(r, 3000));

    // Verify we're on home
    const homeScrollView = element(by.id('home-screen-scroll'));
    await waitFor(homeScrollView).toBeVisible().withTimeout(5000);
    await new Promise((r) => setTimeout(r, 1500));

    // 2. Navigate to Learn screen
    const learnTab = element(by.id('tab-learn'));
    await new Promise((r) => setTimeout(r, 1000));
    await learnTab.tap();
    await new Promise((r) => setTimeout(r, 3000));
    await waitFor(element(by.text('Explore lessons and track your progress')))
      .toBeVisible()
      .withTimeout(15000);
    await new Promise((r) => setTimeout(r, 1500));

    // 3. Navigate to Profile screen
    const profileTab = element(by.id('tab-profile'));
    await new Promise((r) => setTimeout(r, 1000));
    await profileTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Wait for profile scroll view
    const profileScrollView = element(by.id('profile-screen-scroll'));
    await waitFor(profileScrollView).toBeVisible().withTimeout(10000);
    await new Promise((r) => setTimeout(r, 1500));

    // 4. Navigate to Settings from Profile
    // Tap Settings button (cog icon in profile header)
    const settingsButton = element(by.id('settings-button'));
    await waitFor(settingsButton).toBeVisible().withTimeout(5000);
    await new Promise((r) => setTimeout(r, 1000));
    await settingsButton.tap();
    await new Promise((r) => setTimeout(r, 3000));

    await waitFor(element(by.text('HELP')))
      .toBeVisible()
      .withTimeout(5000);
    await new Promise((r) => setTimeout(r, 1500));

    // 5. Go back to Profile, then Home to complete the journey
    await goBack();
    await new Promise((r) => setTimeout(r, 3000));

    await new Promise((r) => setTimeout(r, 1000));
    await homeTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Final verification - we're back on home
    await waitFor(homeTab).toBeVisible().withTimeout(5000);
  });

  it('should handle tab switching', async () => {
    const homeTab = element(by.id('tab-home'));
    const learnTab = element(by.id('tab-learn'));
    const profileTab = element(by.id('tab-profile'));

    // Switch between tabs with proper delays
    await new Promise((r) => setTimeout(r, 1000));
    await learnTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    await new Promise((r) => setTimeout(r, 1000));
    await profileTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    await new Promise((r) => setTimeout(r, 1000));
    await homeTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify we end up on home
    await waitFor(homeTab).toBeVisible().withTimeout(5000);
  });
});
