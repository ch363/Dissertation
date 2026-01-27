import { hasOnboarding } from '@/services/api/onboarding';
import { ensureProfileSeed } from '@/services/api/profile';
import { routes } from '@/services/navigation/routes';

/**
 * Centralized post-auth flow resolution.
 * Returns the route that should be loaded after a successful sign-in.
 * For first-time users, routes to home (app/index). For users who haven't completed onboarding, routes to onboarding.
 * Used for: signup flows, email confirmation callbacks, authenticated users landing on index.
 */
export async function resolvePostAuthDestination(userId: string): Promise<string> {
  try {
    // Ensure the profile row exists before routing anywhere that depends on it.
    await ensureProfileSeed();
    
    // Check if user has completed onboarding
    const onboardingDone = await hasOnboarding(userId);
    console.log('resolvePostAuthDestination:', { userId, onboardingDone });
    
    // Users who completed onboarding should go to home
    if (onboardingDone) {
      return routes.tabs.home;
    }
    
    // Users who haven't completed onboarding should be routed to onboarding
    return routes.onboarding.welcome;
  } catch (err) {
    // If there's an error, default to home page (not onboarding)
    // This ensures first-time users see the home page
    console.error('resolvePostAuthDestination: Error', err);
    return routes.tabs.home;
  }
}

/**
 * Post-login destination resolution.
 * Always routes to home, skipping onboarding check.
 * Used for: direct login (existing users who have already completed onboarding).
 */
export async function resolvePostLoginDestination(_userId: string): Promise<string> {
  try {
    // Ensure the profile row exists before routing anywhere that depends on it.
    await ensureProfileSeed();
    // Login always goes to home - existing users should not see onboarding again
    return routes.tabs.home;
  } catch (err) {
    // If there's an error, default to home
    console.error('resolvePostLoginDestination: Error', err);
    return routes.tabs.home;
  }
}
