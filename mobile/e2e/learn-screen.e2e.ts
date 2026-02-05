import { device, element, by, waitFor, expect } from 'detox';

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
    await new Promise((r) => setTimeout(r, 2000));
  });

  afterAll(async () => {
    await signOutUser();
  });

  /**
   * Navigate to Learn tab
   */
  async function navigateToLearn(): Promise<void> {
    await new Promise((r) => setTimeout(r, 2000));
    const learnTab = element(by.id('tab-learn'));
    await waitFor(learnTab).toBeVisible().withTimeout(5000);
    await new Promise((r) => setTimeout(r, 1000));
    await learnTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify we're on learn screen
    await waitFor(element(by.text('Explore lessons and track your progress')))
      .toBeVisible()
      .withTimeout(15000);
  }

  beforeEach(async () => {
    await navigateToLearn();
  });

  it('should display Learn screen with header', async () => {
    await expect(element(by.text('Explore lessons and track your progress'))).toBeVisible();
  });

  it('should show Learning Path section', async () => {
    // Wait for Learn screen to fully load
    await new Promise((r) => setTimeout(r, 2000));

    // Verify Learning Path section is visible
    await waitFor(element(by.text('Learning Path')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should display learning path with carousel', async () => {
    // Wait for Learn screen to fully load
    await new Promise((r) => setTimeout(r, 2000));

    // Verify Learning Path section and carousel are visible
    await waitFor(element(by.text('Learning Path')))
      .toBeVisible()
      .withTimeout(5000);

    const carousel = element(by.id('learning-path-carousel'));
    await expect(carousel).toBeVisible();
  });

  it('should allow swiping learning path carousel', async () => {
    await new Promise((r) => setTimeout(r, 2000));

    // Verify "Learning Path" header is visible
    await waitFor(element(by.text('Learning Path')))
      .toBeVisible()
      .withTimeout(5000);

    // Swipe left on the carousel to scroll horizontally
    const carousel = element(by.id('learning-path-carousel'));
    await carousel.swipe('left');
    await new Promise((r) => setTimeout(r, 1000));
    await carousel.swipe('right');

    // Verify carousel still visible after swipes
    await expect(carousel).toBeVisible();
  });

  it('should scroll to show All Modules section', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('learn-screen-scroll'));

    // Scroll down to find All Modules
    await scrollView.scroll(400, 'down');
    await waitFor(element(by.text('All Modules')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should have scroll view for content', async () => {
    await new Promise((r) => setTimeout(r, 2000));

    // Verify the scroll view exists and is visible
    const scrollView = element(by.id('learn-screen-scroll'));
    await expect(scrollView).toBeVisible();
  });

  it('should navigate from Learn to other tabs', async () => {
    // Navigate to Home
    const homeTab = element(by.id('tab-home'));
    await new Promise((r) => setTimeout(r, 1000));
    await homeTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify on Home
    await expect(element(by.text('Home'))).toBeVisible();

    // Back to Learn
    const learnTab = element(by.id('tab-learn'));
    await new Promise((r) => setTimeout(r, 1000));
    await learnTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify back on Learn
    await waitFor(element(by.text('Explore lessons and track your progress')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
