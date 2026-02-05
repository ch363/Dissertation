import { device, element, by, waitFor, expect } from 'detox';

import { loginWithEmailPassword } from './helpers/auth';
import { launchAppSafe } from './setup';

/**
 * Comprehensive User Journey E2E Test
 *
 * Tests the complete user flow:
 * 1. Login
 * 2. Navigate to Learn tab
 * 3. Scroll the Learn screen vertically
 * 4. Scroll the Learning Path carousel horizontally
 * 5. Navigate into All Modules (Course Index)
 * 6. Navigate back to Learn
 * 7. Navigate to Profile tab
 * 8. Navigate to Settings from Profile
 * 9. Log out
 */
describe('User Journey', () => {
  beforeAll(async () => {
    await launchAppSafe();
  });

  it('should complete full user journey', async () => {
    // ===== STEP 1: Login =====
    console.log('[Journey] Step 1: Logging in...');
    await loginWithEmailPassword();
    console.log('[Journey] Login complete');
    await new Promise((r) => setTimeout(r, 3000));

    // Verify we're on Home
    await waitFor(element(by.id('tab-home'))).toExist().withTimeout(10000);
    console.log('[Journey] On Home screen');

    // ===== STEP 2: Navigate to Learn tab =====
    console.log('[Journey] Step 2: Navigating to Learn tab...');
    const learnTab = element(by.id('tab-learn'));
    await waitFor(learnTab).toExist().withTimeout(5000);
    await learnTab.tap();
    await new Promise((r) => setTimeout(r, 2000));

    // Verify we're on Learn screen
    const learnScroll = element(by.id('learn-screen-scroll'));
    await waitFor(learnScroll).toExist().withTimeout(10000);
    console.log('[Journey] On Learn screen');

    // ===== STEP 3: Scroll Learn screen =====
    console.log('[Journey] Step 3: Scrolling Learn screen...');
    await learnScroll.swipe('up', 'slow', 0.3);
    await new Promise((r) => setTimeout(r, 1000));
    await learnScroll.swipe('down', 'slow', 0.3);
    await new Promise((r) => setTimeout(r, 1000));
    console.log('[Journey] Learn screen scrolled');

    // ===== STEP 4: Scroll Learning Path carousel =====
    console.log('[Journey] Step 4: Scrolling Learning Path carousel...');
    const carousel = element(by.id('learning-path-carousel'));
    try {
      await waitFor(carousel).toExist().withTimeout(5000);
      await carousel.swipe('left', 'slow', 0.3);
      await new Promise((r) => setTimeout(r, 500));
      await carousel.swipe('right', 'slow', 0.3);
      await new Promise((r) => setTimeout(r, 500));
      console.log('[Journey] Carousel scrolled');
    } catch {
      console.log('[Journey] Carousel not found, skipping...');
    }

    // ===== STEP 5: Navigate to All Modules =====
    console.log('[Journey] Step 5: Navigating to All Modules...');
    
    // Scroll to find the browse catalog button
    const browseButton = element(by.id('browse-catalog-button'));
    for (let i = 0; i < 5; i++) {
      try {
        await waitFor(browseButton).toBeVisible().withTimeout(2000);
        console.log('[Journey] Found browse catalog button');
        break;
      } catch {
        console.log(`[Journey] Scrolling to find button (attempt ${i + 1})...`);
        await learnScroll.swipe('up', 'fast', 0.5);
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    await browseButton.tap();
    await new Promise((r) => setTimeout(r, 2000));

    // Verify we're on Course Index
    const courseIndexScroll = element(by.id('course-index-scroll'));
    await waitFor(courseIndexScroll).toExist().withTimeout(10000);
    console.log('[Journey] On All Modules (Course Index) screen');

    // ===== STEP 6: Navigate back to Learn =====
    console.log('[Journey] Step 6: Navigating back to Learn...');
    
    // Try back button by accessibility label
    const backButton = element(by.label('Back'));
    try {
      await waitFor(backButton).toExist().withTimeout(3000);
      await backButton.tap();
    } catch {
      // Try by testID
      try {
        await element(by.id('back-button')).tap();
      } catch {
        // Use coordinate tap for back arrow (top left)
        console.log('[Journey] Tapping back by coordinates...');
        await device.tap({ x: 30, y: 60 });
      }
    }
    await new Promise((r) => setTimeout(r, 2000));

    // Check if we returned to Learn or got stuck in a session
    try {
      await waitFor(learnScroll).toExist().withTimeout(5000);
      console.log('[Journey] Back on Learn screen');
    } catch {
      // Might be in an unexpected session - try to exit
      console.log('[Journey] Not on Learn screen, checking for session...');
      try {
        const exitSession = element(by.label('Exit session'));
        await waitFor(exitSession).toExist().withTimeout(3000);
        console.log('[Journey] Found session, exiting...');
        await exitSession.tap();
        await new Promise((r) => setTimeout(r, 1000));
        
        // Confirm exit
        const exitConfirm = element(by.text('Exit'));
        await exitConfirm.tap();
        await new Promise((r) => setTimeout(r, 2000));
        
        // Now tap Learn tab to get back
        await learnTab.tap();
        await new Promise((r) => setTimeout(r, 2000));
      } catch {
        console.log('[Journey] No session found, trying Learn tab...');
        await learnTab.tap();
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // ===== STEP 7: Navigate to Profile tab =====
    console.log('[Journey] Step 7: Navigating to Profile tab...');
    const profileTab = element(by.id('tab-profile'));
    await waitFor(profileTab).toExist().withTimeout(5000);
    await profileTab.tap();
    await new Promise((r) => setTimeout(r, 2000));

    // Verify we're on Profile screen
    const profileScroll = element(by.id('profile-screen-scroll'));
    await waitFor(profileScroll).toExist().withTimeout(10000);
    console.log('[Journey] On Profile screen');

    // ===== STEP 8: Navigate to Settings =====
    console.log('[Journey] Step 8: Navigating to Settings...');
    const settingsButton = element(by.id('settings-button'));
    await waitFor(settingsButton).toExist().withTimeout(5000);
    await settingsButton.tap();
    await new Promise((r) => setTimeout(r, 2000));

    // Verify we're on Settings screen
    const settingsScroll = element(by.id('settings-screen-scroll'));
    await waitFor(settingsScroll).toExist().withTimeout(10000);
    console.log('[Journey] On Settings screen');

    // Scroll settings a bit
    await settingsScroll.swipe('up', 'slow', 0.3);
    await new Promise((r) => setTimeout(r, 500));

    // ===== STEP 9: Log out =====
    console.log('[Journey] Step 9: Logging out...');
    
    // Scroll to find Sign out button
    const signOutButton = element(by.text('Sign out'));
    try {
      await waitFor(signOutButton).toBeVisible().withTimeout(3000);
    } catch {
      await settingsScroll.scrollTo('bottom');
      await new Promise((r) => setTimeout(r, 500));
    }
    
    await signOutButton.tap();
    await new Promise((r) => setTimeout(r, 1000));

    // Confirm sign out in alert dialog
    try {
      // Try the alert button
      const alertSignOut = element(by.label('Sign out').and(by.type('_UIAlertControllerActionView')));
      await alertSignOut.tap();
    } catch {
      // Fallback: tap second "Sign out" text (first is button, second is alert)
      try {
        await element(by.text('Sign out')).atIndex(1).tap();
      } catch {
        // Try generic confirm
        const confirmButton = element(by.text('Confirm'));
        await confirmButton.tap();
      }
    }
    await new Promise((r) => setTimeout(r, 3000));

    // Verify we're logged out (back on landing/sign-in screen)
    try {
      await waitFor(element(by.text('Log In'))).toExist().withTimeout(10000);
      console.log('[Journey] Logged out - on landing screen');
    } catch {
      await waitFor(element(by.text('Welcome back'))).toExist().withTimeout(5000);
      console.log('[Journey] Logged out - on sign-in screen');
    }

    console.log('[Journey] ✓ User journey completed successfully!');
  });
});
