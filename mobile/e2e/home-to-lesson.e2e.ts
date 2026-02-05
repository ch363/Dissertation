import { device, element, by, expect, waitFor } from 'detox';

import { loginWithEmailPassword } from './helpers/auth';

/**
 * Home → Learn flow. Logs in before each test using DETOX_E2E_EMAIL / DETOX_E2E_PASSWORD.
 */
describe('Home to lesson flow', () => {
  beforeEach(async () => {
    // Disable sync early to prevent timer-based hangs
    await device.disableSynchronization();
    await loginWithEmailPassword();
    // Wait a moment for home screen to fully stabilize
    await new Promise((r) => setTimeout(r, 2000));
  });

  it('should open Learn tab and show learn content', async () => {
    // Tap Learn tab in bottom navigation
    const learnTab = element(by.id('tab-learn'));
    await waitFor(learnTab).toBeVisible().withTimeout(5000);
    await learnTab.tap();
    // Wait for Learn screen header text (visible at top without scrolling)
    await waitFor(element(by.text('Explore lessons and track your progress')))
      .toBeVisible()
      .withTimeout(15000);
    // Scroll down to find "All Modules" - swipe up on the learn screen scroll
    const learnScroll = element(by.id('learn-screen-scroll'));
    await learnScroll.swipe('up', 'slow', 0.4, 0.5, 0.5);
    await waitFor(element(by.text('All Modules')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should open catalog and show courses', async () => {
    // Go to Learn tab
    const learnTab = element(by.id('tab-learn'));
    await waitFor(learnTab).toBeVisible().withTimeout(5000);
    await learnTab.tap();
    // Wait for Learn screen to load
    await waitFor(element(by.text('Explore lessons and track your progress')))
      .toBeVisible()
      .withTimeout(15000);
    // Scroll down to find "Browse full catalog" - swipe up on the learn screen scroll
    const learnScroll = element(by.id('learn-screen-scroll'));
    await learnScroll.swipe('up', 'slow', 0.4, 0.5, 0.5);
    // Tap the catalog button
    const catalogButton = element(by.id('browse-catalog-button'));
    await waitFor(catalogButton).toBeVisible().withTimeout(5000);
    await catalogButton.tap();
    // Verify courses screen appears
    await waitFor(element(by.text('Courses')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
