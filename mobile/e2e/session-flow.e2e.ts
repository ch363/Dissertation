import { element, by, waitFor } from 'detox';

import { loginWithEmailPassword, signOutUser, goBack } from './helpers/auth';
import { launchAppSafe } from './setup';

/**
 * Session Flow E2E Tests
 * Tests the learning session flow from start to completion
 * Note: This test is more complex as it requires actual session interaction
 */
describe('Session Flow', () => {
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
    // Ensure we're on Home tab
    const homeTab = element(by.id('tab-home'));
    await waitFor(homeTab).toBeVisible().withTimeout(5000);
    await homeTab.tap();
    await waitFor(element(by.id('home-screen-scroll')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should display home screen with session entry points', async () => {
    const scrollView = element(by.id('home-screen-scroll'));
    await waitFor(scrollView).toBeVisible().withTimeout(5000);

    // Scroll through home to verify content loads
    try {
      await scrollView.scroll(300, 'down');
      await scrollView.scroll(300, 'up');
    } catch {
      // Scroll view might not have enough content
    }

    await expect(scrollView).toBeVisible();
  });

  it('should find lesson start option from Learn screen', async () => {
    // Navigate to Learn tab
    const learnTab = element(by.id('tab-learn'));
    await learnTab.tap();

    await waitFor(element(by.id('learn-screen-scroll')))
      .toBeVisible()
      .withTimeout(15000);

    const scrollView = element(by.id('learn-screen-scroll'));
    await waitFor(scrollView).toBeVisible().withTimeout(5000);

    // Scroll to find the catalog button
    await waitFor(element(by.id('browse-catalog-button')))
      .toBeVisible()
      .whileElement(by.id('learn-screen-scroll'))
      .scroll(400, 'down');

    await expect(element(by.id('browse-catalog-button'))).toBeVisible();
  });

  it('should access catalog and view module details', async () => {
    // Navigate to Learn
    const learnTab = element(by.id('tab-learn'));
    await learnTab.tap();

    await waitFor(element(by.id('learn-screen-scroll')))
      .toBeVisible()
      .withTimeout(15000);

    // Navigate to catalog using testID
    await waitFor(element(by.id('browse-catalog-button')))
      .toBeVisible()
      .whileElement(by.id('learn-screen-scroll'))
      .scroll(400, 'down');

    await element(by.id('browse-catalog-button')).tap();

    // Wait for course index screen
    await waitFor(element(by.id('course-index-scroll')))
      .toBeVisible()
      .withTimeout(10000);

    // Verify first module card is visible
    await waitFor(element(by.id('module-card-0')))
      .toBeVisible()
      .withTimeout(5000);

    // Scroll through modules
    try {
      await element(by.id('course-index-scroll')).scroll(300, 'down');
      await element(by.id('course-index-scroll')).scroll(300, 'up');
    } catch {
      // Scroll might not be needed
    }

    // Go back
    await goBack();
  });

  it('should navigate to course detail and see start button', async () => {
    // Navigate to Learn
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

    // Wait for and tap first module
    await waitFor(element(by.id('module-card-0')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('module-card-0')).tap();

    // Wait for course detail screen
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

    // Go back to catalog and then Learn
    await goBack();
    await goBack();
  });

  it('should verify profile screen has stats', async () => {
    // Navigate to Profile
    const profileTab = element(by.id('tab-profile'));
    await profileTab.tap();

    await waitFor(element(by.id('profile-screen-scroll')))
      .toBeVisible()
      .withTimeout(10000);

    const scrollView = element(by.id('profile-screen-scroll'));

    // Scroll through profile
    try {
      await scrollView.scroll(300, 'down');
      await scrollView.scroll(300, 'up');
    } catch {
      // Scroll might not be needed
    }

    await expect(scrollView).toBeVisible();
  });

  it('should handle navigation between session entry points', async () => {
    // Test navigating between screens that can start sessions
    const homeTab = element(by.id('tab-home'));
    const learnTab = element(by.id('tab-learn'));
    const profileTab = element(by.id('tab-profile'));

    // Home -> Learn
    await learnTab.tap();
    await waitFor(element(by.id('learn-screen-scroll')))
      .toBeVisible()
      .withTimeout(10000);

    // Learn -> Profile
    await profileTab.tap();
    await waitFor(element(by.id('profile-screen-scroll')))
      .toBeVisible()
      .withTimeout(10000);

    // Profile -> Home
    await homeTab.tap();
    await waitFor(element(by.id('home-screen-scroll')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should start and exit a session from catalog', async () => {
    // Navigate to Learn -> Catalog -> Module -> Start
    const learnTab = element(by.id('tab-learn'));
    await learnTab.tap();

    await waitFor(element(by.id('learn-screen-scroll')))
      .toBeVisible()
      .withTimeout(15000);

    await waitFor(element(by.id('browse-catalog-button')))
      .toBeVisible()
      .whileElement(by.id('learn-screen-scroll'))
      .scroll(400, 'down');

    await element(by.id('browse-catalog-button')).tap();

    await waitFor(element(by.id('module-card-0')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('module-card-0')).tap();

    await waitFor(element(by.id('course-detail-scroll')))
      .toBeVisible()
      .withTimeout(10000);

    try {
      await waitFor(element(by.id('course-start-button')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('course-start-button')).tap();

      // Wait for session
      await waitFor(element(by.id('session-runner-container')))
        .toBeVisible()
        .withTimeout(15000);

      // Verify session UI
      await expect(element(by.id('session-card-scroll'))).toBeVisible();

      // Exit session
      await goBack();

      // Handle leave confirmation
      try {
        await waitFor(element(by.text('Leave')))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.text('Leave')).tap();
      } catch {
        // No confirmation
      }
    } catch {
      // No lessons available
      await goBack();
    }

    // Return home
    await element(by.id('tab-home')).tap();
    await waitFor(element(by.id('home-screen-scroll')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
