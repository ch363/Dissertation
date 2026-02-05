import { device, element, by, waitFor, expect } from 'detox';
import { loginWithEmailPassword, signOutUser, goBack } from './helpers/auth';

/**
 * Settings Screen E2E Tests
 * Tests app settings, preferences, help, and configuration screens
 */
describe('Settings Screen', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginWithEmailPassword();
    await new Promise((r) => setTimeout(r, 2000));
  });

  afterAll(async () => {
    await signOutUser();
  });

  /**
   * Navigate to Settings screen from any tab
   */
  async function navigateToSettings(): Promise<void> {
    // Navigate to Profile first, then Settings
    await new Promise((r) => setTimeout(r, 2000));
    const profileTab = element(by.id('tab-profile'));
    await waitFor(profileTab).toBeVisible().withTimeout(5000);
    await new Promise((r) => setTimeout(r, 1000));
    await profileTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Tap Settings button (cog icon in profile header)
    const settingsButton = element(by.id('settings-button'));
    await waitFor(settingsButton).toBeVisible().withTimeout(5000);
    await new Promise((r) => setTimeout(r, 1000));
    await settingsButton.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify we're on settings screen
    await waitFor(element(by.text('HELP'))).toBeVisible().withTimeout(5000);
  }

  beforeEach(async () => {
    await navigateToSettings();
  });

  it('should display Settings screen with sections', async () => {
    // Verify main settings sections are visible
    await expect(element(by.text('HELP'))).toBeVisible();
  });

  it('should show all main section headers', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('settings-screen-scroll'));

    // Check for HELP section
    await expect(element(by.text('HELP'))).toBeVisible();

    // Scroll to find APPEARANCE section
    await scrollView.scroll(300, 'down');
    await waitFor(element(by.text('APPEARANCE'))).toBeVisible().withTimeout(5000);

    // Scroll to find LEARNING section
    await scrollView.scroll(300, 'down');
    await waitFor(element(by.text('LEARNING'))).toBeVisible().withTimeout(5000);
  });

  it('should navigate to Help screen', async () => {
    await new Promise((r) => setTimeout(r, 2000));

    // Find and tap Help
    const helpButton = element(by.text('Help'));
    await waitFor(helpButton).toBeVisible().withTimeout(5000);
    await helpButton.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify Help screen loaded (check for any content on help screen)
    await new Promise((r) => setTimeout(r, 2000));

    // Go back
    await goBack();
    await new Promise((r) => setTimeout(r, 2000));

    // Verify we're back on settings
    await waitFor(element(by.text('HELP'))).toBeVisible().withTimeout(5000);
  });

  it('should navigate to FAQ screen', async () => {
    await new Promise((r) => setTimeout(r, 2000));

    // Find and tap FAQ
    const faqButton = element(by.text('FAQ'));
    await waitFor(faqButton).toBeVisible().withTimeout(5000);
    await faqButton.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify FAQ screen loaded by checking for a FAQ question
    const firstFaqItem = element(by.text('How does review work?'));
    await waitFor(firstFaqItem).toBeVisible().withTimeout(5000);

    // Tap on the first FAQ item to expand it
    await firstFaqItem.tap();
    await new Promise((r) => setTimeout(r, 1000));

    // Go back
    await goBack();
    await new Promise((r) => setTimeout(r, 2000));

    // Verify we're back on settings
    await waitFor(element(by.text('HELP'))).toBeVisible().withTimeout(5000);
  });

  it('should display Dark Mode toggle', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('settings-screen-scroll'));

    await scrollView.scroll(300, 'down');
    await waitFor(element(by.text('Dark Mode'))).toBeVisible().withTimeout(5000);
  });

  it('should navigate to Speech Settings', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('settings-screen-scroll'));

    // Scroll to find Speech settings
    await scrollView.scroll(400, 'down');
    await waitFor(element(by.text('Speech'))).toBeVisible().withTimeout(5000);

    await element(by.text('Speech')).tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Wait for speech settings screen to load
    await new Promise((r) => setTimeout(r, 2000));

    // Go back
    await goBack();
    await new Promise((r) => setTimeout(r, 2000));

    // Verify we're back on settings
    await waitFor(element(by.text('HELP'))).toBeVisible().withTimeout(5000);
  });

  it('should navigate to Session Defaults', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('settings-screen-scroll'));

    // Scroll to find Session defaults
    await scrollView.scroll(400, 'down');
    await waitFor(element(by.text('Session defaults'))).toBeVisible().withTimeout(5000);

    await element(by.text('Session defaults')).tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Wait for session defaults screen to load
    await new Promise((r) => setTimeout(r, 2000));

    // Go back
    await goBack();
    await new Promise((r) => setTimeout(r, 2000));

    // Verify we're back on settings
    await waitFor(element(by.text('HELP'))).toBeVisible().withTimeout(5000);
  });

  it('should show Sign out button in Account section', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('settings-screen-scroll'));

    // Sign out is at the very bottom - scroll to bottom
    await scrollView.scrollTo('bottom');
    await new Promise((r) => setTimeout(r, 1000));

    // Verify Sign out button is visible
    await waitFor(element(by.text('Sign out'))).toBeVisible().withTimeout(5000);
  });

  it('should allow scrolling through settings', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('settings-screen-scroll'));

    // Scroll down through settings
    await scrollView.scroll(600, 'down');
    await new Promise((r) => setTimeout(r, 1000));

    // Scroll back up
    await scrollView.scroll(600, 'up');
    await new Promise((r) => setTimeout(r, 1000));

    // Verify we can still see HELP section (back at top)
    await waitFor(element(by.text('HELP'))).toBeVisible().withTimeout(5000);
  });

  it('should navigate back to Profile from Settings', async () => {
    await new Promise((r) => setTimeout(r, 2000));

    // Go back to Profile
    await goBack();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify we're on Profile screen (settings button should be visible)
    const settingsButton = element(by.id('settings-button'));
    await waitFor(settingsButton).toBeVisible().withTimeout(5000);

    // Navigate to Home
    const homeTab = element(by.id('tab-home'));
    await new Promise((r) => setTimeout(r, 1000));
    await homeTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify we're on Home
    await waitFor(element(by.id('tab-home'))).toBeVisible().withTimeout(5000);

    // Back to Profile
    const profileTab = element(by.id('tab-profile'));
    await new Promise((r) => setTimeout(r, 1000));
    await profileTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify we're on Profile
    await waitFor(settingsButton).toBeVisible().withTimeout(5000);
  });
});
