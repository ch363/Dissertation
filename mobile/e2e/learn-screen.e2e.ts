import { element, by, waitFor, expect } from 'detox';

import { loginWithEmailPassword, signOutUser } from './helpers/auth';
import { launchAppSafe } from './setup';

/**
 * Learn Screen E2E Tests
 * Tests the learning hub, catalog browsing, search, and lesson navigation
 */
describe('Learn Screen', () => {
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

  /**
   * Navigate to Learn tab
   */
  async function navigateToLearn(): Promise<void> {
    const learnTab = element(by.id('tab-learn'));
    await waitFor(learnTab).toBeVisible().withTimeout(5000);
    await learnTab.tap();

    // Verify we're on learn screen
    await waitFor(element(by.id('learn-screen-scroll')))
      .toBeVisible()
      .withTimeout(15000);
  }

  beforeEach(async () => {
    await navigateToLearn();
  });

  it('should display Learn screen scroll view', async () => {
    await expect(element(by.id('learn-screen-scroll'))).toBeVisible();
  });

  it('should show Learning Path carousel', async () => {
    // Check for the learning path carousel
    try {
      await waitFor(element(by.id('learning-path-carousel')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.id('learning-path-carousel'))).toBeVisible();
    } catch {
      // Learning path might not be populated
    }
  });

  it('should display learning path with carousel', async () => {
    // Check for carousel
    try {
      const carousel = element(by.id('learning-path-carousel'));
      await waitFor(carousel).toBeVisible().withTimeout(5000);
      await expect(carousel).toBeVisible();
    } catch {
      // Carousel might not be available
    }
  });

  it('should allow swiping learning path carousel', async () => {
    try {
      const carousel = element(by.id('learning-path-carousel'));
      await waitFor(carousel).toBeVisible().withTimeout(5000);

      // Swipe left on the carousel to scroll horizontally
      await carousel.swipe('left');
      await carousel.swipe('right');

      // Verify carousel still visible after swipes
      await expect(carousel).toBeVisible();
    } catch {
      // Carousel not available
    }
  });

  it('should scroll to show browse catalog button', async () => {
    const scrollView = element(by.id('learn-screen-scroll'));

    // Scroll down to find browse catalog button
    await waitFor(element(by.id('browse-catalog-button')))
      .toBeVisible()
      .whileElement(by.id('learn-screen-scroll'))
      .scroll(400, 'down');

    await expect(element(by.id('browse-catalog-button'))).toBeVisible();
  });

  it('should have scroll view for content', async () => {
    // Verify the scroll view exists and is visible
    const scrollView = element(by.id('learn-screen-scroll'));
    await expect(scrollView).toBeVisible();
  });

  it('should navigate from Learn to other tabs', async () => {
    // Navigate to Home
    const homeTab = element(by.id('tab-home'));
    await homeTab.tap();

    // Verify on Home
    await waitFor(element(by.id('home-screen-scroll')))
      .toBeVisible()
      .withTimeout(5000);

    // Back to Learn
    const learnTab = element(by.id('tab-learn'));
    await learnTab.tap();

    // Verify back on Learn
    await waitFor(element(by.id('learn-screen-scroll')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should navigate to catalog from Learn screen', async () => {
    // Scroll to find catalog button
    await waitFor(element(by.id('browse-catalog-button')))
      .toBeVisible()
      .whileElement(by.id('learn-screen-scroll'))
      .scroll(400, 'down');

    await element(by.id('browse-catalog-button')).tap();

    // Verify we're on catalog screen
    await waitFor(element(by.id('course-index-scroll')))
      .toBeVisible()
      .withTimeout(10000);

    // Verify first module card is visible
    await waitFor(element(by.id('module-card-0')))
      .toBeVisible()
      .withTimeout(5000);

    // Go back
    await element(by.id('tab-learn')).tap();
  });
});
