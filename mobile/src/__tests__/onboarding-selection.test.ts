import { computeNextSelection, normalizeSelected } from '@/components/onboarding';

describe('normalizeSelected', () => {
  test('returns empty array for nullish', () => {
    expect(normalizeSelected(null)).toEqual([]);
    expect(normalizeSelected(undefined)).toEqual([]);
  });

  test('wraps single value', () => {
    expect(normalizeSelected('one')).toEqual(['one']);
  });

  test('passes arrays through', () => {
    expect(normalizeSelected(['a', 'b'])).toEqual(['a', 'b']);
  });
});

describe('computeNextSelection', () => {
  test('single-select replaces previous', () => {
    expect(computeNextSelection(['a'], 'b', false)).toEqual(['b']);
  });

  test('multi-select toggles existing', () => {
    expect(computeNextSelection(['a', 'b'], 'a', true)).toEqual(['b']);
  });

  test('multi-select adds when not present', () => {
    expect(computeNextSelection(['a'], 'b', true)).toEqual(['a', 'b']);
  });

  test('respects maxSelections by keeping most recent', () => {
    expect(computeNextSelection(['a', 'b'], 'c', true, 2)).toEqual(['b', 'c']);
  });
});
