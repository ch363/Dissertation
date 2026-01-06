import { resolvePostAuthDestination } from '@/lib/auth-flow';

jest.mock('@/modules/profile', () => ({
  ensureProfileSeed: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/modules/onboarding', () => ({
  hasOnboarding: jest.fn(),
}));

describe('auth-flow resolver', () => {
  const hasOnboarding = require('@/modules/onboarding').hasOnboarding as jest.Mock;

  it('routes to home when onboarding complete', async () => {
    hasOnboarding.mockResolvedValue(true);
    const dest = await resolvePostAuthDestination('user-1');
    expect(dest).toBe('/nav-bar/home');
  });

  it('routes to onboarding when not complete', async () => {
    hasOnboarding.mockResolvedValue(false);
    const dest = await resolvePostAuthDestination('user-1');
    expect(dest).toBe('/onboarding/welcome');
  });
});
