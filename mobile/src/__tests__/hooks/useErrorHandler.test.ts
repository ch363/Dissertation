import { useErrorHandler } from '@/hooks/useErrorHandler';

describe('useErrorHandler', () => {
  it('should export useErrorHandler hook', () => {
    expect(typeof useErrorHandler).toBe('function');
  });
});
