import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { OnboardingProvider, useOnboarding } from '@/onboarding/OnboardingContext';

jest.mock('@/modules/auth', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({ id: 'user-1' }),
}));

const mockSaveOnboarding = jest.fn().mockResolvedValue(null);
jest.mock('@/lib/onboardingRepo', () => ({
  saveOnboarding: (...args: any[]) => mockSaveOnboarding(...args),
}));

function TestComponent({ onReady }: { onReady: (ctx: ReturnType<typeof useOnboarding>) => void }) {
  const ctx = useOnboarding();
  onReady(ctx);
  return null;
}

describe('OnboardingProvider', () => {
  it('persists answers via saveOnboarding', async () => {
    let ctx: ReturnType<typeof useOnboarding> | null = null;
    await act(async () => {
      TestRenderer.create(
        <OnboardingProvider>
          <TestComponent onReady={(c) => (ctx = c)} />
        </OnboardingProvider>
      );
    });

    expect(ctx).not.toBeNull();
    await act(async () => {
      ctx!.setAnswerAndSave('difficulty', 'balanced');
    });
    expect(mockSaveOnboarding).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ difficulty: 'balanced' })
    );
  });
});
