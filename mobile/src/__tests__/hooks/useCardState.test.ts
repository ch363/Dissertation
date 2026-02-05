import { useCardState } from '@/features/session/hooks/useCardState';

describe('useCardState', () => {
  it('should export useCardState hook', () => {
    expect(typeof useCardState).toBe('function');
  });
});
