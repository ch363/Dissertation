import { hasOnboarding } from '@/api/onboarding';
import { ensureProfileSeed } from '@/api/profile';
import { routes } from '@/services/navigation/routes';

/**
 * Centralized post-auth flow resolution.
 * Returns the route that should be loaded after a successful sign-in.
 * Checks onboarding status and routes to onboarding or home accordingly.
 * Used for: signup flows, email confirmation callbacks, authenticated users landing on index.
 */
export async function resolvePostAuthDestination(userId: string): Promise<string> {
  try {
    // Ensure the profile row exists before routing anywhere that depends on it.
    await ensureProfileSeed();
    const onboardingDone = await hasOnboarding(userId);
    // If onboarding not done, start at onboarding welcome so the user flows into Q1
    return onboardingDone ? routes.tabs.home : '/(onboarding)/welcome';
  } catch (err) {
    // If there's an error, default to onboarding welcome page
    // This ensures navigation doesn't break even if database queries fail
    console.error('resolvePostAuthDestination: Error', err);
    return '/(onboarding)/welcome';
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
