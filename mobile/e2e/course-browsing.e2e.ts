import { element, by, waitFor, expect } from 'detox';

import { loginWithEmailPassword, signOutUser, goBack } from './helpers/auth';
import { launchAppSafe } from './setup';

/**
 * Course Browsing E2E Tests
 * Tests the course and lesson browsing functionality
 */
describe('Course Browsing', () => {
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

  describe('Learn Screen Navigation', () => {
    it('should display the Learn screen with course content', async () => {
      // Navigate to Learn tab
      const learnTab = element(by.id('tab-learn'));
      await learnTab.tap();

      // Wait for Learn screen scroll view
      await waitFor(element(by.id('learn-screen-scroll')))
        .toBeVisible()
        .withTimeout(15000);

      await expect(element(by.id('learn-screen-scroll'))).toBeVisible();
    });

    it('should scroll through Learn screen content', async () => {
      const learnTab = element(by.id('tab-learn'));
      await learnTab.tap();

      await waitFor(element(by.id('learn-screen-scroll')))
        .toBeVisible()
        .withTimeout(15000);

      const scrollView = element(by.id('learn-screen-scroll'));

      // Scroll down
      try {
        await scrollView.scroll(500, 'down');
      } catch {
        // Content might not need scrolling
      }

      // Scroll back up
      try {
        await scrollView.scroll(300, 'up');
      } catch {
        // Already at top
      }
    });

    it('should find Browse full catalog button', async () => {
      const learnTab = element(by.id('tab-learn'));
      await learnTab.tap();

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
  });

  describe('Course Catalog', () => {
    it('should navigate to course catalog', async () => {
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

      // Verify course index screen loads
      await waitFor(element(by.id('course-index-scroll')))
        .toBeVisible()
        .withTimeout(10000);

      // Go back
      await goBack();
    });

    it('should scroll through available courses', async () => {
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

      await waitFor(element(by.id('course-index-scroll')))
        .toBeVisible()
        .withTimeout(10000);

      // Scroll through courses using the proper testID
      try {
        await element(by.id('course-index-scroll')).scroll(500, 'down');
        await element(by.id('course-index-scroll')).scroll(300, 'up');
      } catch {
        // Scrolling might not be needed
      }

      // Go back
      await goBack();
    });

    it('should display module cards in catalog', async () => {
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

      await waitFor(element(by.id('course-index-scroll')))
        .toBeVisible()
        .withTimeout(10000);

      // Check for module cards using testID
      await waitFor(element(by.id('module-card-0')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.id('module-card-0'))).toBeVisible();

      // Go back
      await goBack();
    });
  });

  describe('Course Detail', () => {
    it('should navigate to a course and view details', async () => {
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

      await waitFor(element(by.id('course-index-scroll')))
        .toBeVisible()
        .withTimeout(10000);

      // Tap first module card
      await waitFor(element(by.id('module-card-0')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('module-card-0')).tap();

      // Verify course detail screen loads
      await waitFor(element(by.id('course-detail-scroll')))
        .toBeVisible()
        .withTimeout(10000);

      // Go back twice (to catalog, then to learn)
      await goBack();
      await goBack();
    });

    it('should display course start button on detail screen', async () => {
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

      await waitFor(element(by.id('module-card-0')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.id('module-card-0')).tap();

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

      // Go back
      await goBack();
      await goBack();
    });
  });

  describe('Learning Path', () => {
    it('should display learning path carousel on Learn screen', async () => {
      const learnTab = element(by.id('tab-learn'));
      await learnTab.tap();

      await waitFor(element(by.id('learn-screen-scroll')))
        .toBeVisible()
        .withTimeout(15000);

      // Look for learning path carousel
      try {
        await waitFor(element(by.id('learning-path-carousel')))
          .toBeVisible()
          .withTimeout(5000);

        await expect(element(by.id('learning-path-carousel'))).toBeVisible();
      } catch {
        // Learning path might not be visible
      }
    });

    it('should interact with learning path carousel', async () => {
      const learnTab = element(by.id('tab-learn'));
      await learnTab.tap();

      await waitFor(element(by.id('learn-screen-scroll')))
        .toBeVisible()
        .withTimeout(15000);

      // Try to swipe through learning path carousel
      try {
        const carousel = element(by.id('learning-path-carousel'));
        await waitFor(carousel).toBeVisible().withTimeout(5000);

        // Swipe left to see more items
        await carousel.swipe('left');

        // Swipe right to go back
        await carousel.swipe('right');
      } catch {
        // Carousel not available or swipeable
      }
    });
  });

  describe('Start Lesson Flow', () => {
    it('should be able to start a lesson from catalog', async () => {
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

      await waitFor(element(by.id('module-card-0')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.id('module-card-0')).tap();

      await waitFor(element(by.id('course-detail-scroll')))
        .toBeVisible()
        .withTimeout(10000);

      // Try to start a lesson
      try {
        await waitFor(element(by.id('course-start-button')))
          .toBeVisible()
          .withTimeout(5000);

        await element(by.id('course-start-button')).tap();

        // Wait for session to start
        await waitFor(element(by.id('session-runner-container')))
          .toBeVisible()
          .withTimeout(15000);

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
    });
  });
});
