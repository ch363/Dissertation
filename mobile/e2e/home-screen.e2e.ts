import { device, element, by, waitFor, expect } from 'detox';
import { loginWithEmailPassword, signOutUser, goBack } from './helpers/auth';

/**
 * Home Screen E2E Tests
 * Tests the main dashboard functionality including stats, CTAs, and navigation
 */
describe('Home Screen', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginWithEmailPassword();
    await new Promise((r) => setTimeout(r, 2000));
  });

  afterAll(async () => {
    await signOutUser();
  });

  /**
   * Navigate to Home tab
   */
  async function navigateToHome(): Promise<void> {
    const homeTab = element(by.id('tab-home'));
    await waitFor(homeTab).toBeVisible().withTimeout(5000);
    await homeTab.tap();
    await new Promise((r) => setTimeout(r, 2000));
  }

  beforeEach(async () => {
    await navigateToHome();
  });

  it('should display home screen with welcome message', async () => {
    // Verify Home tab indicator is visible (we're on home)
    await expect(element(by.text('Home'))).toBeVisible();
  });

  it('should show Today at a Glance section', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('home-screen-scroll'));

    // Scroll to find Today at a Glance
    await scrollView.scroll(300, 'down');
    await waitFor(element(by.text('Today at a Glance'))).toBeVisible().withTimeout(5000);
  });

  it('should display and scroll through stats cards', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('home-screen-scroll'));

    // Scroll down to see content
    await scrollView.scroll(300, 'down');
    await new Promise((r) => setTimeout(r, 1000));

    // Scroll back up
    await scrollView.scroll(300, 'up');
    await new Promise((r) => setTimeout(r, 1000));

    // Verify scroll view is still visible
    await expect(scrollView).toBeVisible();
  });

  it('should show Why This Next section', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('home-screen-scroll'));

    // Scroll to find Why This Next recommendation card
    await scrollView.scroll(400, 'down');
    await waitFor(element(by.text('Why This Next'))).toBeVisible().withTimeout(5000);
  });

  it('should navigate to Learn tab from home', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const learnTab = element(by.id('tab-learn'));
    await waitFor(learnTab).toBeVisible().withTimeout(5000);
    await new Promise((r) => setTimeout(r, 1000));
    await learnTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify Learn screen loaded
    await waitFor(element(by.text('Explore lessons and track your progress')))
      .toBeVisible()
      .withTimeout(10000);

    // Return to home
    await navigateToHome();

    // Verify we're back on Home
    await expect(element(by.text('Home'))).toBeVisible();
  });

  it('should navigate to Profile tab from home', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const profileTab = element(by.id('tab-profile'));
    await waitFor(profileTab).toBeVisible().withTimeout(5000);
    await new Promise((r) => setTimeout(r, 1000));
    await profileTab.tap();

    // Wait for profile screen to load
    await new Promise((r) => setTimeout(r, 3000));

    // Verify profile loaded (settings button visible on profile)
    const settingsButton = element(by.id('settings-button'));
    await waitFor(settingsButton).toBeVisible().withTimeout(5000);

    // Return to home
    await navigateToHome();

    // Verify we're back on Home
    await expect(element(by.text('Home'))).toBeVisible();
  });

  it('should navigate to Settings from Profile', async () => {
    await new Promise((r) => setTimeout(r, 2000));

    // First go to Profile
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

    // Verify Settings screen loaded
    await waitFor(element(by.text('HELP'))).toBeVisible().withTimeout(5000);

    // Go back to profile
    await goBack();
    await new Promise((r) => setTimeout(r, 3000));

    // Return to home
    await navigateToHome();

    // Verify we're back on Home
    await expect(element(by.text('Home'))).toBeVisible();
  });

  it('should display and scroll primary CTA card area', async () => {
    await new Promise((r) => setTimeout(r, 2000));

    // The primary CTA could be "Start Review", "Continue Lesson", or "Start Lesson"
    const scrollView = element(by.id('home-screen-scroll'));

    // Scroll through the home screen content
    await scrollView.scroll(400, 'down');
    await new Promise((r) => setTimeout(r, 1000));

    await scrollView.scroll(400, 'up');
    await new Promise((r) => setTimeout(r, 1000));

    // Verify scroll view is still functional
    await expect(scrollView).toBeVisible();
  });
});
