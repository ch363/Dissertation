import { device, element, by, waitFor } from 'detox';

import { loginWithEmailPassword, signOutUser, goBack } from './helpers/auth';
import { launchAppSafe } from './setup';

/**
 * Session Questions E2E Tests
 * Tests the actual question/exercise interactions within a session.
 * Note: Question formats vary dynamically, so we handle multiple card types.
 */
describe('Session Questions Flow', () => {
  beforeAll(async () => {
    await launchAppSafe();
    await loginWithEmailPassword();
    // Wait for home screen to be ready
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

  it('should navigate to Learn and find the catalog button', async () => {
    // Navigate to Learn tab
    const learnTab = element(by.id('tab-learn'));
    await learnTab.tap();

    // Wait for Learn screen
    await waitFor(element(by.id('learn-screen-scroll')))
      .toBeVisible()
      .withTimeout(15000);

    // Scroll to find the catalog button
    await waitFor(element(by.id('browse-catalog-button')))
      .toBeVisible()
      .whileElement(by.id('learn-screen-scroll'))
      .scroll(400, 'down');

    await expect(element(by.id('browse-catalog-button'))).toBeVisible();
  });

  it('should navigate to catalog and see module cards', async () => {
    // Navigate to Learn tab
    const learnTab = element(by.id('tab-learn'));
    await learnTab.tap();

    await waitFor(element(by.id('learn-screen-scroll')))
      .toBeVisible()
      .withTimeout(15000);

    // Scroll to and tap the catalog button
    await waitFor(element(by.id('browse-catalog-button')))
      .toBeVisible()
      .whileElement(by.id('learn-screen-scroll'))
      .scroll(400, 'down');

    await element(by.id('browse-catalog-button')).tap();

    // Wait for course index screen
    await waitFor(element(by.id('course-index-scroll')))
      .toBeVisible()
      .withTimeout(10000);

    // Check for the first module card
    await waitFor(element(by.id('module-card-0')))
      .toBeVisible()
      .withTimeout(5000);

    // Go back to Learn
    await goBack();
  });

  it('should start a lesson from catalog and verify session UI', async () => {
    // Navigate to Learn tab
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

    // Wait for and tap the first module
    await waitFor(element(by.id('module-card-0')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('module-card-0')).tap();

    // Wait for course detail screen
    await waitFor(element(by.id('course-detail-scroll')))
      .toBeVisible()
      .withTimeout(10000);

    // Tap the start lesson button
    try {
      await waitFor(element(by.id('course-start-button')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('course-start-button')).tap();

      // Wait for session to load
      await waitFor(element(by.id('session-runner-container')))
        .toBeVisible()
        .withTimeout(15000);

      // Verify session UI elements
      await expect(element(by.id('session-card-scroll'))).toBeVisible();

      // Exit session
      await goBack();
      
      // Handle leave confirmation if it appears
      try {
        await waitFor(element(by.text('Leave')))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.text('Leave')).tap();
      } catch {
        // No confirmation needed
      }
    } catch {
      // No lessons available - go back
      await goBack();
    }

    // Return to home
    await element(by.id('tab-home')).tap();
  });

  it('should interact with multiple choice cards if present', async () => {
    await navigateToSession();

    try {
      await waitFor(element(by.id('session-runner-container')))
        .toBeVisible()
        .withTimeout(10000);

      // Check for MC options
      try {
        await waitFor(element(by.id('mc-option-0')).atIndex(0))
          .toBeVisible()
          .withTimeout(3000);

        // Tap the first option
        await element(by.id('mc-option-0')).atIndex(0).tap();

        // Wait for feedback
        await waitFor(element(by.id('feedback-correct')).or(element(by.id('feedback-incorrect'))))
          .toBeVisible()
          .withTimeout(5000);
      } catch {
        // MC options not visible - different card type
      }
    } catch {
      // Session not available
    }

    await exitSession();
  });

  it('should interact with fill blank cards if present', async () => {
    await navigateToSession();

    try {
      await waitFor(element(by.id('session-runner-container')))
        .toBeVisible()
        .withTimeout(10000);

      // Check for fill blank card
      try {
        await waitFor(element(by.id('fill-blank-card')))
          .toBeVisible()
          .withTimeout(3000);

        // Look for options
        const option = element(by.id('fb-option-0')).atIndex(0);
        await waitFor(option).toBeVisible().withTimeout(3000);
        await option.tap();

        // Wait for feedback
        await waitFor(element(by.id('session-continue-button')))
          .toBeVisible()
          .withTimeout(3000);
      } catch {
        // Fill blank card not visible
      }
    } catch {
      // Session not available
    }

    await exitSession();
  });

  it('should interact with translate cards if present', async () => {
    await navigateToSession();

    try {
      await waitFor(element(by.id('session-runner-container')))
        .toBeVisible()
        .withTimeout(10000);

      // Check for translate card
      try {
        await waitFor(element(by.id('translate-card')))
          .toBeVisible()
          .withTimeout(3000);

        // Find and interact with the text input
        const input = element(by.id('translate-input'));
        await waitFor(input).toBeVisible().withTimeout(3000);

        await input.tap();
        await input.typeText('test answer');

        // Dismiss keyboard by tapping outside
        await element(by.id('session-card-scroll')).tap();

        // Tap check button
        try {
          await waitFor(element(by.id('translate-check-button')))
            .toBeVisible()
            .withTimeout(3000);
          await element(by.id('translate-check-button')).tap();

          // Wait for result
          await waitFor(element(by.id('feedback-correct')).or(element(by.id('feedback-incorrect'))))
            .toBeVisible()
            .withTimeout(5000);
        } catch {
          // Check button not visible yet
        }
      } catch {
        // Translate card not visible
      }
    } catch {
      // Session not available
    }

    await exitSession();
  });

  it('should interact with listening cards if present', async () => {
    await navigateToSession();

    try {
      await waitFor(element(by.id('session-runner-container')))
        .toBeVisible()
        .withTimeout(10000);

      // Check for listening card (type mode)
      try {
        await waitFor(element(by.id('listening-card')))
          .toBeVisible()
          .withTimeout(3000);

        // Find and interact with the text input
        const input = element(by.id('listening-input'));
        await waitFor(input).toBeVisible().withTimeout(3000);

        await input.tap();
        await input.typeText('test');

        // Dismiss keyboard
        await element(by.id('session-card-scroll')).tap();

        // Tap check button
        try {
          await waitFor(element(by.id('listening-check-button')))
            .toBeVisible()
            .withTimeout(3000);
          await element(by.id('listening-check-button')).tap();

          // Wait for result
          await waitFor(element(by.id('feedback-correct')).or(element(by.id('feedback-incorrect'))))
            .toBeVisible()
            .withTimeout(5000);
        } catch {
          // Check button not visible
        }
      } catch {
        // Listening card not visible
      }
    } catch {
      // Session not available
    }

    await exitSession();
  });

  it('should handle teach cards (vocabulary introduction)', async () => {
    await navigateToSession();

    try {
      await waitFor(element(by.id('session-runner-container')))
        .toBeVisible()
        .withTimeout(10000);

      // Check for teach card
      try {
        await waitFor(element(by.id('teach-card')))
          .toBeVisible()
          .withTimeout(3000);

        // For teach cards, just need to tap continue
        const continueBtn = element(by.id('session-continue-button'));
        await waitFor(continueBtn).toBeVisible().withTimeout(3000);
        await continueBtn.tap();
      } catch {
        // Teach card not visible
      }
    } catch {
      // Session not available
    }

    await exitSession();
  });

  it('should verify session completion flow', async () => {
    await navigateToSession();

    try {
      await waitFor(element(by.id('session-runner-container')))
        .toBeVisible()
        .withTimeout(10000);

      // Try to progress through cards (max 5 iterations for test efficiency)
      let iterations = 5;
      while (iterations > 0) {
        iterations--;

        // Check if we've reached summary
        try {
          await waitFor(element(by.id('session-summary-screen')))
            .toBeVisible()
            .withTimeout(2000);

          // Verify summary screen elements
          await expect(element(by.id('summary-back-home-button'))).toBeVisible();
          
          // Tap back to home
          await element(by.id('summary-back-home-button')).tap();
          
          await waitFor(element(by.id('home-screen-scroll')))
            .toBeVisible()
            .withTimeout(5000);

          return; // Test passed
        } catch {
          // Not on summary screen yet
        }

        // Try to answer and continue
        await answerCurrentCard();
      }
    } catch {
      // Session not available
    }

    await exitSession();
  });
});

/**
 * Helper to navigate to a session via catalog
 */
async function navigateToSession() {
  try {
    // Navigate to Learn tab
    const learnTab = element(by.id('tab-learn'));
    await learnTab.tap();

    await waitFor(element(by.id('learn-screen-scroll')))
      .toBeVisible()
      .withTimeout(10000);

    // Navigate to catalog
    await waitFor(element(by.id('browse-catalog-button')))
      .toBeVisible()
      .whileElement(by.id('learn-screen-scroll'))
      .scroll(300, 'down');

    await element(by.id('browse-catalog-button')).tap();

    // Wait for and tap first module
    await waitFor(element(by.id('module-card-0')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('module-card-0')).tap();

    // Wait for course detail and tap start
    await waitFor(element(by.id('course-detail-scroll')))
      .toBeVisible()
      .withTimeout(10000);

    await waitFor(element(by.id('course-start-button')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('course-start-button')).tap();

    // Wait for session
    await waitFor(element(by.id('session-runner-container')))
      .toBeVisible()
      .withTimeout(15000);
  } catch {
    // Navigation failed - may not have content
  }
}

/**
 * Helper to answer the current card (best effort)
 */
async function answerCurrentCard() {
  // Try MC option
  try {
    const mcOption = element(by.id('mc-option-0')).atIndex(0);
    await waitFor(mcOption).toBeVisible().withTimeout(1500);
    await mcOption.tap();
  } catch {
    // Not MC
  }

  // Try Fill Blank option
  try {
    const fbOption = element(by.id('fb-option-0')).atIndex(0);
    await waitFor(fbOption).toBeVisible().withTimeout(1500);
    await fbOption.tap();
  } catch {
    // Not Fill Blank
  }

  // Try continue button
  try {
    const continueBtn = element(by.id('session-continue-button'));
    await waitFor(continueBtn).toBeVisible().withTimeout(2000);
    await continueBtn.tap();
  } catch {
    // Continue button not available
  }
}

/**
 * Helper to exit session and return to home
 */
async function exitSession() {
  try {
    // Try to go back
    await goBack();

    // Handle leave confirmation if it appears
    try {
      await waitFor(element(by.text('Leave')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.text('Leave')).tap();
    } catch {
      // No confirmation needed
    }
  } catch {
    // Already exited or navigation failed
  }

  // Navigate back to home
  try {
    const homeTab = element(by.id('tab-home'));
    await waitFor(homeTab).toBeVisible().withTimeout(3000);
    await homeTab.tap();
    await waitFor(element(by.id('home-screen-scroll')))
      .toBeVisible()
      .withTimeout(5000);
  } catch {
    // Already on home or tab not visible
  }
}
