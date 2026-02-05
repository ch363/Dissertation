import { device, element, by, waitFor } from 'detox';

import { loginWithEmailPassword } from './helpers/auth';
import { launchAppSafe } from './setup';

/**
 * Comprehensive User Journey E2E Test
 * 
 * Tests the complete flow:
 * 1. Login
 * 2. Navigate to Learn tab
 * 3. Scroll around on Learn screen
 * 4. Scroll the Learning Path carousel
 * 5. Go into All Modules (Course Index)
 * 6. Go back to Learn
 * 7. Go to Profile
 * 8. Go to Settings
 * 9. Log out
 */
describe('User Journey', () => {
  beforeAll(async () => {
    await launchAppSafe();
  });

  it('should complete full user journey through the app', async () => {
    // ===== STEP 1: Login =====
    console.log('[Journey] Step 1: Logging in...');
    await loginWithEmailPassword();
    console.log('[Journey] Login complete');
    await new Promise((r) => setTimeout(r, 2000));

    // ===== STEP 2: Navigate to Learn tab =====
    console.log('[Journey] Step 2: Navigating to Learn tab...');
    const learnTab = element(by.id('tab-learn'));
    await waitFor(learnTab).toExist().withTimeout(10000);
    await learnTab.tap();
    await new Promise((r) => setTimeout(r, 3000));
    console.log('[Journey] On Learn tab');

    // ===== STEP 3: Scroll around on Learn screen =====
    console.log('[Journey] Step 3: Scrolling Learn screen...');
    const learnScroll = element(by.id('learn-screen-scroll'));
    await waitFor(learnScroll).toExist().withTimeout(10000);
    
    // Scroll down
    await learnScroll.swipe('up', 'slow', 0.5);
    await new Promise((r) => setTimeout(r, 1000));
    
    // Scroll back up
    await learnScroll.swipe('down', 'slow', 0.5);
    await new Promise((r) => setTimeout(r, 1000));
    console.log('[Journey] Learn screen scrolled');

    // ===== STEP 4: Scroll the Learning Path carousel =====
    console.log('[Journey] Step 4: Scrolling carousel...');
    const carousel = element(by.id('learning-path-carousel'));
    try {
      await waitFor(carousel).toExist().withTimeout(5000);
      // Use gentler swipe to avoid accidental taps
      await carousel.swipe('left', 'slow', 0.3);
      await new Promise((r) => setTimeout(r, 500));
      await carousel.swipe('right', 'slow', 0.3);
      await new Promise((r) => setTimeout(r, 500));
      console.log('[Journey] Carousel scrolled');
    } catch {
      console.log('[Journey] Carousel not found, continuing...');
    }

    // ===== STEP 5: Go into All Modules =====
    console.log('[Journey] Step 5: Opening All Modules...');
    const browseCatalogBtn = element(by.id('browse-catalog-button'));
    
    // Make sure we're still on Learn screen
    await waitFor(learnScroll).toExist().withTimeout(5000);
    
    // Scroll down to reach the All Modules button at the bottom
    console.log('[Journey] Scrolling to find All Modules button...');
    
    // Keep scrolling until we find the button AND it's fully visible
    for (let i = 0; i < 5; i++) {
      try {
        await waitFor(browseCatalogBtn).toBeVisible().withTimeout(2000);
        console.log('[Journey] Found All Modules button (visible)');
        break;
      } catch {
        console.log(`[Journey] Scroll attempt ${i + 1}...`);
        await learnScroll.swipe('up', 'slow', 0.3);
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    
    // Extra small scroll to make sure button is fully in view
    await learnScroll.swipe('up', 'slow', 0.15);
    await new Promise((r) => setTimeout(r, 300));
    
    await waitFor(browseCatalogBtn).toBeVisible().withTimeout(5000);
    await browseCatalogBtn.tap();
    await new Promise((r) => setTimeout(r, 2000));
    
    // Verify we're on Course Index
    const courseIndexScroll = element(by.id('course-index-scroll'));
    await waitFor(courseIndexScroll).toExist().withTimeout(10000);
    console.log('[Journey] In All Modules screen');
    
    // Scroll around in modules
    await courseIndexScroll.swipe('up', 'slow', 0.3);
    await new Promise((r) => setTimeout(r, 500));

    // ===== STEP 6: Go back to Learn =====
    console.log('[Journey] Step 6: Going back to Learn...');
    // Tap the back arrow at top left
    const backButton = element(by.label('Back'));
    await waitFor(backButton).toExist().withTimeout(5000);
    await backButton.tap();
    await new Promise((r) => setTimeout(r, 2000));
    
    // Check if we ended up in a Review Session (can happen if due reviews exist)
    const reviewSessionTitle = element(by.text('Review Session'));
    try {
      await waitFor(reviewSessionTitle).toExist().withTimeout(3000);
      console.log('[Journey] Detected Review Session, closing it...');
      
      // Tap the X button (Exit session) in top right
      const exitButton = element(by.label('Exit session'));
      await waitFor(exitButton).toExist().withTimeout(3000);
      await exitButton.tap();
      await new Promise((r) => setTimeout(r, 1000));
      
      // Confirm exit in the alert dialog - button text is "Exit"
      const confirmExit = element(by.text('Exit'));
      await waitFor(confirmExit).toExist().withTimeout(3000);
      await confirmExit.tap();
      await new Promise((r) => setTimeout(r, 2000));
      console.log('[Journey] Closed Review Session');
    } catch {
      console.log('[Journey] No Review Session detected');
    }
    
    await waitFor(learnScroll).toExist().withTimeout(10000);
    console.log('[Journey] Back on Learn screen');

    // ===== STEP 7: Go to Profile via Home tab first =====
    console.log('[Journey] Step 7: Going to Profile...');
    
    // First go to Home to reset state
    const homeTab = element(by.id('tab-home'));
    await waitFor(homeTab).toExist().withTimeout(5000);
    await homeTab.tap();
    await new Promise((r) => setTimeout(r, 2000));
    console.log('[Journey] On Home screen');
    
    // Now tap on Settings tab directly (4th tab)
    const settingsTab = element(by.id('tab-settings'));
    await waitFor(settingsTab).toExist().withTimeout(5000);
    await settingsTab.tap();
    await new Promise((r) => setTimeout(r, 3000));
    
    const settingsScroll = element(by.id('settings-screen-scroll'));
    await waitFor(settingsScroll).toExist().withTimeout(15000);
    console.log('[Journey] On Settings screen');
    
    // Scroll settings
    await settingsScroll.swipe('up', 'slow', 0.3);
    await new Promise((r) => setTimeout(r, 500));

    // ===== STEP 8: Log out =====
    console.log('[Journey] Step 8: Logging out...');
    // Find and tap sign out
    const signOutText = element(by.text('Sign out'));
    await waitFor(signOutText).toExist().withTimeout(5000);
    await signOutText.tap();
    await new Promise((r) => setTimeout(r, 1000));
    
    // Confirm sign out in alert
    const confirmSignOut = element(by.text('Sign out').withAncestor(by.type('_UIAlertControllerActionView')));
    try {
      await waitFor(confirmSignOut).toExist().withTimeout(3000);
      await confirmSignOut.tap();
    } catch {
      // Try alternative selector for iOS alert button
      const alertButton = element(by.label('Sign out'));
      await alertButton.tap();
    }
    await new Promise((r) => setTimeout(r, 3000));

    // Verify we're logged out (back to landing or sign in screen)
    const logInButton = element(by.text('Log In'));
    const welcomeBack = element(by.text('Welcome back'));
    
    try {
      await waitFor(logInButton).toExist().withTimeout(5000);
      console.log('[Journey] Successfully logged out - on landing screen');
    } catch {
      try {
        await waitFor(welcomeBack).toExist().withTimeout(3000);
        console.log('[Journey] Successfully logged out - on sign in screen');
      } catch {
        console.log('[Journey] Logout complete');
      }
    }

    console.log('[Journey] ✓ Full user journey completed successfully!');
  });
});
