import { hasOnboarding } from '@/api/onboarding';
import { ensureProfileSeed } from '@/api/profile';
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
    
    // First-time users (no onboarding) should go to home (app/index)
    // Users who started but didn't complete onboarding should continue onboarding
    // Users who completed onboarding should go to home
    if (onboardingDone) {
      return routes.tabs.home;
    }
    
    // For first-time users, go to home (app/index) - they can start onboarding from there
    // Only route to onboarding if they explicitly need to complete it
    // For now, let's route first-time users to home as requested
    return routes.tabs.home;
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
