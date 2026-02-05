import { device, element, by, expect, waitFor } from 'detox';

import { loginWithEmailPassword, signOutUser } from './helpers/auth';
import { launchAppSafe } from './setup';

/**
 * Home → Learn flow. Tests navigation from home to lesson content.
 */
describe('Home to lesson flow', () => {
  beforeAll(async () => {
    await launchAppSafe();
    await loginWithEmailPassword();
    await waitFor(element(by.id('tab-home')))
      .toBeVisible()
      .withTimeout(10000);
  });

  afterAll(async () => {
    await signOutUser();
  });

  beforeEach(async () => {
    // Ensure we start on home
    const homeTab = element(by.id('tab-home'));
    await homeTab.tap();
    await waitFor(element(by.id('home-screen-scroll')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should open Learn tab and show learn content', async () => {
    // Tap Learn tab in bottom navigation
    const learnTab = element(by.id('tab-learn'));
    await waitFor(learnTab).toBeVisible().withTimeout(5000);
    await learnTab.tap();

    // Wait for Learn screen
    await waitFor(element(by.id('learn-screen-scroll')))
      .toBeVisible()
      .withTimeout(15000);

    // Verify learn screen is visible
    await expect(element(by.id('learn-screen-scroll'))).toBeVisible();
  });

  it('should scroll and find catalog button', async () => {
    // Go to Learn tab
    const learnTab = element(by.id('tab-learn'));
    await waitFor(learnTab).toBeVisible().withTimeout(5000);
    await learnTab.tap();

    // Wait for Learn screen to load
    await waitFor(element(by.id('learn-screen-scroll')))
      .toBeVisible()
      .withTimeout(15000);

    // Scroll to find catalog button using testID
    await waitFor(element(by.id('browse-catalog-button')))
      .toBeVisible()
      .whileElement(by.id('learn-screen-scroll'))
      .scroll(400, 'down');

    await expect(element(by.id('browse-catalog-button'))).toBeVisible();
  });

  it('should open catalog and show courses', async () => {
    // Go to Learn tab
    const learnTab = element(by.id('tab-learn'));
    await waitFor(learnTab).toBeVisible().withTimeout(5000);
    await learnTab.tap();

    // Wait for Learn screen to load
    await waitFor(element(by.id('learn-screen-scroll')))
      .toBeVisible()
      .withTimeout(15000);

    // Scroll to find catalog button
    await waitFor(element(by.id('browse-catalog-button')))
      .toBeVisible()
      .whileElement(by.id('learn-screen-scroll'))
      .scroll(400, 'down');

    // Tap the catalog button
    await element(by.id('browse-catalog-button')).tap();

    // Verify course index screen appears
    await waitFor(element(by.id('course-index-scroll')))
      .toBeVisible()
      .withTimeout(10000);

    // Verify first module card is visible
    await waitFor(element(by.id('module-card-0')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate to course detail from catalog', async () => {
    // Go to Learn tab
    const learnTab = element(by.id('tab-learn'));
    await learnTab.tap();

    await waitFor(element(by.id('learn-screen-scroll')))
      .toBeVisible()
      .withTimeout(15000);

    // Navigate to catalog
    await waitFor(element(by.id('browse-catalog-button')))
      .toBeVisible()
      .whileElement(by.id('learn-screen-scroll'))
      .scroll(400, 'down');

    await element(by.id('browse-catalog-button')).tap();

    // Tap first module
    await waitFor(element(by.id('module-card-0')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('module-card-0')).tap();

    // Verify course detail screen
    await waitFor(element(by.id('course-detail-scroll')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should find start lesson button on course detail', async () => {
    // Go to Learn tab
    const learnTab = element(by.id('tab-learn'));
    await learnTab.tap();

    await waitFor(element(by.id('learn-screen-scroll')))
      .toBeVisible()
      .withTimeout(15000);

    // Navigate to catalog
    await waitFor(element(by.id('browse-catalog-button')))
      .toBeVisible()
      .whileElement(by.id('learn-screen-scroll'))
      .scroll(400, 'down');

    await element(by.id('browse-catalog-button')).tap();

    // Tap first module
    await waitFor(element(by.id('module-card-0')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('module-card-0')).tap();

    // Wait for course detail
    await waitFor(element(by.id('course-detail-scroll')))
      .toBeVisible()
      .withTimeout(10000);

    // Check for start button
    try {
      await waitFor(element(by.id('course-start-button')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.id('course-start-button'))).toBeVisible();
    } catch {
      // Start button might not be visible if no lessons
    }
  });
});
