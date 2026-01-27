import { resolvePostAuthDestination } from '@/features/auth/flows/resolvePostAuthDestination';
import { routes } from '@/services/navigation/routes';

jest.mock('@/services/api/profile', () => ({
  ensureProfileSeed: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/services/api/onboarding', () => ({
  hasOnboarding: jest.fn(),
}));

describe('auth-flow resolver', () => {
  const hasOnboarding = require('@/services/api/onboarding').hasOnboarding as jest.Mock;

  it('routes to home when onboarding complete', async () => {
    hasOnboarding.mockResolvedValue(true);
    const dest = await resolvePostAuthDestination('user-1');
    expect(dest).toBe(routes.tabs.home);
  });

  it('routes to home when onboarding is not complete (current behavior)', async () => {
    hasOnboarding.mockResolvedValue(false);
    const dest = await resolvePostAuthDestination('user-1');
    expect(dest).toBe(routes.tabs.home);
  });
});
