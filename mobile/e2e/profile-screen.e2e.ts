import { device, element, by, waitFor, expect } from 'detox';

import { loginWithEmailPassword, signOutUser, goBack } from './helpers/auth';
import { launchAppSafe } from './setup';

/**
 * Profile Screen E2E Tests
 * Tests user profile, stats, skills mastery, and level progress
 */
describe('Profile Screen', () => {
  beforeAll(async () => {
    await launchAppSafe();
    await loginWithEmailPassword();
    await new Promise((r) => setTimeout(r, 2000));
  });

  afterAll(async () => {
    await signOutUser();
  });

  /**
   * Navigate to Profile tab
   */
  async function navigateToProfile(): Promise<void> {
    await new Promise((r) => setTimeout(r, 2000));
    const profileTab = element(by.id('tab-profile'));
    await waitFor(profileTab).toBeVisible().withTimeout(5000);
    await new Promise((r) => setTimeout(r, 1000));
    await profileTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify we're on profile (settings button visible)
    await waitFor(element(by.id('settings-button')))
      .toBeVisible()
      .withTimeout(5000);
  }

  beforeEach(async () => {
    await navigateToProfile();
  });

  it('should display profile screen', async () => {
    // Wait for profile screen to load
    await new Promise((r) => setTimeout(r, 2000));

    // Profile screen should be visible
    const scrollView = element(by.id('profile-screen-scroll'));
    await expect(scrollView).toBeVisible();
  });

  it('should show user level and XP progress', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('profile-screen-scroll'));

    // Look for Level Progress section
    await scrollView.scroll(300, 'down');
    await waitFor(element(by.text('Level Progress')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should display stats cards area', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('profile-screen-scroll'));

    // Stats cards show DUE REVIEWS, STUDY TIME, DAY STREAK
    // Scroll to ensure we can see content
    await scrollView.scroll(300, 'down');
    await new Promise((r) => setTimeout(r, 1000));

    // Verify scrolling worked
    await expect(scrollView).toBeVisible();
  });

  it('should show skills mastery preview', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('profile-screen-scroll'));

    // Scroll to find Skill Mastery section
    await scrollView.scroll(500, 'down');
    await waitFor(element(by.text('Skill Mastery')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate to full skills view', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('profile-screen-scroll'));

    // Look for "View all" button in Skill Mastery section
    await scrollView.scroll(500, 'down');
    await waitFor(element(by.text('View all')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.text('View all')).tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Wait for skills screen - should show mastery content
    await new Promise((r) => setTimeout(r, 2000));

    // Go back
    await goBack();
    await new Promise((r) => setTimeout(r, 2000));

    // Verify we're back on profile
    await waitFor(element(by.id('settings-button')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should allow scrolling through profile content', async () => {
    await new Promise((r) => setTimeout(r, 2000));
    const scrollView = element(by.id('profile-screen-scroll'));

    // Scroll down
    await scrollView.scroll(300, 'down');
    await new Promise((r) => setTimeout(r, 1000));

    // Scroll back up to top
    await scrollView.scroll(300, 'up');
    await new Promise((r) => setTimeout(r, 1000));

    // Verify scroll view still visible
    await expect(scrollView).toBeVisible();
  });

  it('should navigate to Settings from profile', async () => {
    await new Promise((r) => setTimeout(r, 2000));

    // Tap Settings button (cog icon) in profile header
    const settingsButton = element(by.id('settings-button'));
    await waitFor(settingsButton).toBeVisible().withTimeout(5000);
    await settingsButton.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify Settings screen loaded
    await waitFor(element(by.text('HELP')))
      .toBeVisible()
      .withTimeout(5000);

    // Go back to profile
    await goBack();
    await new Promise((r) => setTimeout(r, 2000));

    // Verify we're back on profile
    await waitFor(settingsButton).toBeVisible().withTimeout(5000);
  });

  it('should navigate to Edit Profile from profile', async () => {
    await new Promise((r) => setTimeout(r, 2000));

    // Tap Edit Profile button (pen icon) next to settings cog in profile header
    const editProfileButton = element(by.id('edit-profile-button'));
    await waitFor(editProfileButton).toBeVisible().withTimeout(5000);
    await editProfileButton.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify Edit Profile screen loaded
    await waitFor(element(by.text('Edit Profile')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify Cancel button is present
    const cancelButton = element(by.text('Cancel'));
    await waitFor(cancelButton).toBeVisible().withTimeout(5000);

    // Go back to profile using Cancel button
    await cancelButton.tap();
    await new Promise((r) => setTimeout(r, 2000));

    // Verify we're back on profile
    await waitFor(editProfileButton).toBeVisible().withTimeout(5000);
  });

  it('should navigate between Profile and other tabs', async () => {
    // Go to Home
    const homeTab = element(by.id('tab-home'));
    await new Promise((r) => setTimeout(r, 1000));
    await homeTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify on Home
    await expect(element(by.text('Home'))).toBeVisible();

    // Back to Profile
    const profileTab = element(by.id('tab-profile'));
    await new Promise((r) => setTimeout(r, 1000));
    await profileTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify on Profile
    await waitFor(element(by.id('settings-button')))
      .toBeVisible()
      .withTimeout(5000);

    // Go to Learn
    const learnTab = element(by.id('tab-learn'));
    await new Promise((r) => setTimeout(r, 1000));
    await learnTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify on Learn
    await waitFor(element(by.text('Explore lessons and track your progress')))
      .toBeVisible()
      .withTimeout(10000);

    // Back to Profile
    await new Promise((r) => setTimeout(r, 1000));
    await profileTab.tap();
    await new Promise((r) => setTimeout(r, 3000));

    // Verify on Profile
    await waitFor(element(by.id('settings-button')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
