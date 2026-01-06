import { hasOnboarding } from '@/modules/onboarding';
import { ensureProfileSeed } from '@/modules/profile';

/**
 * Centralized post-auth flow resolution.
 * Returns the route that should be loaded after a successful sign-in.
 */
export async function resolvePostAuthDestination(userId: string) {
  // Ensure the profile row exists before routing anywhere that depends on it.
  await ensureProfileSeed();
  const onboardingDone = await hasOnboarding(userId);
  return onboardingDone ? '/home/index' : '/onboarding/welcome';
}
