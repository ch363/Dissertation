import { device, element, by, waitFor, expect } from 'detox';
import { signOutUser } from './helpers/auth';

/**
 * Auth Flow E2E Tests
 * Tests the authentication screens: landing, sign up, sign in, forgot password
 * Note: These tests verify UI elements but don't create actual accounts
 */
describe('Auth Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    // Ensure we're signed out for next test suite
    try {
      await signOutUser();
    } catch {
      // Already signed out or not applicable
    }
  });

  /**
   * Helper to ensure we're on the landing screen.
   * Signs out if currently logged in.
   */
  async function ensureLandingScreen(): Promise<void> {
    await device.launchApp({ newInstance: true });
    await new Promise((r) => setTimeout(r, 1500));

    // Check if we're on the landing screen
    try {
      await waitFor(element(by.id('landing-screen'))).toBeVisible().withTimeout(5000);
      return;
    } catch {
      // Not on landing - might be logged in, try to sign out
    }

    // Check if logged in (tab bar visible)
    try {
      await waitFor(element(by.id('tab-home'))).toBeVisible().withTimeout(3000);
      await signOutUser();
      await new Promise((r) => setTimeout(r, 2000));
      await waitFor(element(by.id('landing-screen'))).toBeVisible().withTimeout(5000);
    } catch {
      // If we can't sign out, try one more app relaunch
      await device.launchApp({ newInstance: true, delete: true });
      await new Promise((r) => setTimeout(r, 2000));
      await waitFor(element(by.id('landing-screen'))).toBeVisible().withTimeout(10000);
    }
  }

  /**
   * Navigate to sign up screen from landing
   */
  async function navigateToSignUp(): Promise<void> {
    await ensureLandingScreen();
    await element(by.id('landing-signup')).tap();
    await new Promise((r) => setTimeout(r, 2000));
    await waitFor(element(by.id('signup-screen'))).toBeVisible().withTimeout(5000);
  }

  /**
   * Navigate to sign in screen from landing
   */
  async function navigateToSignIn(): Promise<void> {
    await ensureLandingScreen();
    await element(by.id('landing-login')).tap();
    await new Promise((r) => setTimeout(r, 2000));
    await waitFor(element(by.text('Welcome back'))).toBeVisible().withTimeout(5000);
  }

  /**
   * Navigate to forgot password screen from landing
   */
  async function navigateToForgotPassword(): Promise<void> {
    await navigateToSignIn();
    await element(by.text('Forgot password?')).tap();
    await new Promise((r) => setTimeout(r, 2000));
    await waitFor(element(by.id('forgot-password-screen'))).toBeVisible().withTimeout(5000);
  }

  describe('Landing Screen', () => {
    beforeEach(async () => {
      await ensureLandingScreen();
    });

    it('should display the landing screen with Get Started and Log In buttons', async () => {
      // Verify landing elements - these MUST succeed or test fails
      await expect(element(by.id('landing-screen'))).toBeVisible();
      await expect(element(by.text('Fluentia'))).toBeVisible();
      await expect(element(by.text('Personalised learning, one step at a time.'))).toBeVisible();
      await expect(element(by.id('landing-signup'))).toBeVisible();
      await expect(element(by.id('landing-login'))).toBeVisible();
    });

    it('should navigate to sign up screen from Get Started', async () => {
      // Tap sign up button
      await element(by.id('landing-signup')).tap();
      await new Promise((r) => setTimeout(r, 2000));

      // Verify navigation to sign up screen
      await waitFor(element(by.id('signup-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.text('Create your account'))).toBeVisible();
    });

    it('should navigate to sign in screen from Log In', async () => {
      // Tap login button
      await element(by.id('landing-login')).tap();
      await new Promise((r) => setTimeout(r, 2000));

      // Verify navigation to sign in screen
      await waitFor(element(by.text('Welcome back'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Sign Up Screen', () => {
    beforeEach(async () => {
      await navigateToSignUp();
    });

    it('should display all sign up form fields', async () => {
      // Verify all form elements are visible
      await expect(element(by.id('signup-screen'))).toBeVisible();
      await expect(element(by.id('signup-name'))).toBeVisible();
      await expect(element(by.id('signup-email'))).toBeVisible();
      await expect(element(by.id('signup-password'))).toBeVisible();
      await expect(element(by.id('signup-confirm-password'))).toBeVisible();
      await expect(element(by.id('signup-submit'))).toBeVisible();
    });

    it('should show validation for invalid email', async () => {
      // Enter invalid email
      const emailInput = element(by.id('signup-email'));
      await emailInput.tap();
      await emailInput.typeText('invalid-email');
      await device.tap({ x: 200, y: 100 }); // Dismiss keyboard
      await new Promise((r) => setTimeout(r, 500));

      // Verify validation error appears
      await waitFor(element(by.text('Enter a valid email address.')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should show validation for short password', async () => {
      // Scroll to see password field if needed
      try {
        const scrollView = element(by.id('signup-scroll'));
        await scrollView.scroll(100, 'down');
      } catch {
        // Not scrollable, continue
      }

      // Enter short password
      const passwordInput = element(by.id('signup-password'));
      await passwordInput.tap();
      await passwordInput.typeText('short');
      await device.tap({ x: 200, y: 100 }); // Dismiss keyboard
      await new Promise((r) => setTimeout(r, 500));

      // Verify validation error appears
      await waitFor(element(by.text('Password must be at least 8 characters.')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should show validation for mismatched passwords', async () => {
      // Enter password
      const passwordInput = element(by.id('signup-password'));
      await passwordInput.tap();
      await passwordInput.typeText('password123');

      // Enter different confirm password
      const confirmInput = element(by.id('signup-confirm-password'));
      await confirmInput.tap();
      await confirmInput.typeText('different123');
      await device.tap({ x: 200, y: 100 }); // Dismiss keyboard
      await new Promise((r) => setTimeout(r, 500));

      // Verify validation error appears
      await waitFor(element(by.text('Passwords do not match.')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should have link to sign in', async () => {
      // Verify sign in link exists
      await expect(element(by.text('Already have an account? Sign in'))).toBeVisible();
    });
  });

  describe('Sign In Screen', () => {
    beforeEach(async () => {
      await navigateToSignIn();
    });

    it('should display sign in form fields', async () => {
      // Verify form elements
      await expect(element(by.text('Welcome back'))).toBeVisible();
      await expect(element(by.id('signin-email'))).toBeVisible();
      await expect(element(by.id('signin-password'))).toBeVisible();
      await expect(element(by.id('signin-submit'))).toBeVisible();
    });

    it('should have link to forgot password', async () => {
      // Verify forgot password link exists
      await expect(element(by.text('Forgot password?'))).toBeVisible();
    });

    it('should navigate to forgot password screen', async () => {
      // Tap forgot password link
      await element(by.text('Forgot password?')).tap();
      await new Promise((r) => setTimeout(r, 2000));

      // Verify navigation to forgot password screen
      await waitFor(element(by.id('forgot-password-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.text('Forgot password'))).toBeVisible();
    });
  });

  describe('Forgot Password Screen', () => {
    beforeEach(async () => {
      await navigateToForgotPassword();
    });

    it('should display forgot password form', async () => {
      // Verify form elements
      await expect(element(by.id('forgot-password-screen'))).toBeVisible();
      await expect(element(by.text('Forgot password'))).toBeVisible();
      await expect(element(by.id('forgot-password-email'))).toBeVisible();
      await expect(element(by.id('forgot-password-submit'))).toBeVisible();
    });

    it('should show validation for invalid email', async () => {
      // Enter invalid email
      const emailInput = element(by.id('forgot-password-email'));
      await emailInput.tap();
      await emailInput.typeText('invalid-email');
      await device.tap({ x: 200, y: 100 }); // Dismiss keyboard
      await new Promise((r) => setTimeout(r, 500));

      // Verify validation error appears
      await waitFor(element(by.text('Enter a valid email address.')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should have link back to sign in', async () => {
      // Verify back to sign in link exists
      await expect(element(by.text('Back to sign in'))).toBeVisible();
    });
  });
});
