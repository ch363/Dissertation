import { device, element, by, expect, waitFor } from 'detox';

const EMAIL_ENV = 'DETOX_E2E_EMAIL';
const PASSWORD_ENV = 'DETOX_E2E_PASSWORD';

/**
 * Cross-platform back navigation.
 * On iOS, taps the back button in the navigation header.
 * On Android, uses device.pressBack().
 */
export async function goBack(): Promise<void> {
  if (device.getPlatform() === 'ios') {
    // iOS: tap the back button in navigation header
    // All back buttons should have testID="back-button" for consistency

    // Strategy 1: Try to find back button by testID (most reliable)
    try {
      const backButton = element(by.id('back-button'));
      await backButton.tap();
      return;
    } catch {
      // Not found, try fallback strategies
    }

    // Strategy 2: Try common accessibility labels as fallback
    const backLabels = ['Go back', 'Back', 'back'];
    for (const label of backLabels) {
      try {
        const backButton = element(by.label(label)).atIndex(0);
        await backButton.tap();
        return;
      } catch {
        // Try next label
      }
    }

    throw new Error(
      'Could not find back button on iOS. ' +
        'Add testID="back-button" to your navigation header or ensure back button has accessibilityLabel="Go back".',
    );
  } else {
    // Android: use hardware back button
    await device.pressBack();
  }
}

/**
 * Get E2E test credentials from environment.
 * Set DETOX_E2E_EMAIL and DETOX_E2E_PASSWORD (e.g. in .env or CI secrets).
 */
export function getE2ECredentials(): { email: string; password: string } {
  const email = process.env[EMAIL_ENV]?.trim();
  const password = process.env[PASSWORD_ENV];
  if (!email || !password) {
    throw new Error(
      `E2E login requires ${EMAIL_ENV} and ${PASSWORD_ENV}. ` +
        'Add them to .env (do not commit real passwords) or pass when running: ' +
        `DETOX_E2E_EMAIL=... DETOX_E2E_PASSWORD=... npm run test:e2e`,
    );
  }
  return { email, password };
}

/**
 * Perform login from the landing screen (or current screen).
 * Expects landing with "Log In" or sign-in with "Welcome back".
 * After success, waits until home (Learn tab) is visible.
 */
export async function loginWithEmailPassword(): Promise<void> {
  const { email, password } = getE2ECredentials();

  const logInButton = element(by.text('Log In'));
  const welcomeBack = element(by.text('Welcome back'));
  const homeTab = element(by.id('tab-home'));

  // Wait longer for app state to settle after reload (session restoration can be slow)
  console.log('[E2E Auth] Starting login flow, waiting for app to settle...');
  await new Promise((r) => setTimeout(r, 3000));

  // Already logged in (e.g. after reload with session)? Check for home tab with longer timeout
  // Session restoration from secure storage can take time
  console.log('[E2E Auth] Checking if already logged in...');
  try {
    await waitFor(homeTab).toExist().withTimeout(8000);
    console.log('[E2E Auth] Already logged in - found home tab');
    return;
  } catch {
    console.log('[E2E Auth] Not logged in yet, proceeding with login flow');
  }

  // Check if we're on landing screen with "Log In" button
  console.log('[E2E Auth] Looking for Log In button on landing screen...');
  try {
    await waitFor(logInButton).toExist().withTimeout(5000);
    console.log('[E2E Auth] Found Log In button, tapping...');
    await new Promise((r) => setTimeout(r, 500));
    await logInButton.tap();
  } catch {
    console.log('[E2E Auth] Log In button not found, might already be on sign-in screen');
  }

  // Wait for sign-in screen and fill form (use testID to avoid multiple "Email"/"Password" matches)
  console.log('[E2E Auth] Waiting for sign-in screen (Welcome back)...');
  await waitFor(welcomeBack).toExist().withTimeout(10000);
  console.log('[E2E Auth] Sign-in screen loaded');
  await new Promise((r) => setTimeout(r, 1000));

  const emailInput = element(by.id('signin-email'));
  const passwordInput = element(by.id('signin-password'));
  const signInButton = element(by.id('signin-submit'));
  await expect(emailInput).toExist();

  console.log('[E2E Auth] Filling in credentials...');
  await emailInput.tap();
  await emailInput.replaceText(email);
  await emailInput.tapReturnKey();
  await passwordInput.replaceText(password);
  // Tap above keyboard to dismiss it (center-x, upper half of screen)
  await device.tap({ x: 200, y: 300 });
  await new Promise((r) => setTimeout(r, 500));

  console.log('[E2E Auth] Tapping sign in button...');
  await signInButton.tap();

  // Wait for navigation to home - check for tab bar element or home screen content
  console.log('[E2E Auth] Waiting for home screen...');
  await waitFor(element(by.id('tab-home')))
    .toExist()
    .withTimeout(20000);
  console.log('[E2E Auth] Login successful - home screen reached');
}

/**
 * Sign out the current user and return to landing screen.
 * Expects to be on a screen with bottom tab navigation.
 * Navigates to Profile, then Settings, scrolls to find Sign out, confirms the alert, and waits for sign-in screen.
 */
export async function signOutUser(): Promise<void> {
  // Check if already on login/landing screen (use short timeout)
  // Use toExist() to avoid visibility threshold issues
  try {
    await waitFor(element(by.text('Log In')))
      .toExist()
      .withTimeout(2000);
    // Already signed out
    return;
  } catch {
    // Not on login screen, continue
  }

  // Also check for sign-in screen (Welcome back)
  try {
    await waitFor(element(by.text('Welcome back')))
      .toExist()
      .withTimeout(2000);
    // Already signed out (on sign-in screen)
    return;
  } catch {
    // Not on sign-in screen, continue with sign out
  }

  // Navigate to Profile tab first
  const profileTab = element(by.id('tab-profile'));
  try {
    await waitFor(profileTab).toExist().withTimeout(5000);
    await new Promise((r) => setTimeout(r, 500));
    await profileTab.tap();
    await new Promise((r) => setTimeout(r, 3000));
  } catch {
    // Already on profile or can't find tab - might be signed out
    return;
  }

  // Tap Settings button (cog icon in profile header)
  const settingsButton = element(by.id('settings-button'));
  try {
    await waitFor(settingsButton).toExist().withTimeout(5000);
    await new Promise((r) => setTimeout(r, 500));
    await settingsButton.tap();
    await new Promise((r) => setTimeout(r, 3000));
  } catch {
    // Can't find settings - might be signed out
    return;
  }

  // Scroll down to find "Sign out" button in Account section
  await new Promise((r) => setTimeout(r, 2000));
  const settingsScrollView = element(by.id('settings-screen-scroll'));
  const signOutButton = element(by.text('Sign out'));
  try {
    await settingsScrollView.scrollTo('bottom');
    await waitFor(signOutButton).toExist().withTimeout(5000);
  } catch {
    // Can't find sign out button
    return;
  }

  // Tap sign out button
  try {
    await signOutButton.tap();
  } catch {
    // Button tap failed
    return;
  }

  // Wait for alert to appear
  await new Promise((r) => setTimeout(r, 1000));

  // Confirm sign out in alert dialog
  // The alert has "Cancel" and "Sign out" buttons
  try {
    // Try to find and tap the "Sign out" button in the alert
    const alertSignOutButton = element(
      by.label('Sign out').and(by.type('_UIAlertControllerActionView')),
    );
    await alertSignOutButton.tap();
  } catch {
    // Fallback: try simpler selector
    try {
      await element(by.text('Sign out')).atIndex(1).tap();
    } catch {
      // Alert might have dismissed or sign out already happened
      return;
    }
  }

  // Wait for navigation back to landing/sign-in screen (don't throw if not found)
  // Use toExist() to avoid visibility threshold issues
  try {
    await waitFor(element(by.text('Log In')))
      .toExist()
      .withTimeout(10000);
  } catch {
    // Might be on sign-in screen with "Welcome back" instead - that's ok
    try {
      await waitFor(element(by.text('Welcome back')))
        .toExist()
        .withTimeout(3000);
    } catch {
      // Neither found, but sign out may have still worked
    }
  }
}
