import { resolvePostAuthDestination } from '@/features/auth/flows/resolvePostAuthDestination';
import { routes } from '@/services/navigation/routes';

jest.mock('@/api/profile', () => ({
  ensureProfileSeed: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/api/onboarding', () => ({
  hasOnboarding: jest.fn(),
}));

describe('auth-flow resolver', () => {
  const hasOnboarding = require('@/api/onboarding').hasOnboarding as jest.Mock;

  it('routes to home when onboarding complete', async () => {
    hasOnboarding.mockResolvedValue(true);
    const dest = await resolvePostAuthDestination('user-1');
    expect(dest).toBe(routes.tabs.home);
  });

  it('routes to onboarding when not complete', async () => {
    hasOnboarding.mockResolvedValue(false);
    const dest = await resolvePostAuthDestination('user-1');
    expect(dest).toBe(routes.onboarding.welcome);
  });
});
