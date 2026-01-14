import { ensureProfileSeed } from '@/services/api/profile';

test('modules/profile exports ensureProfileSeed', () => {
  expect(typeof ensureProfileSeed).toBe('function');
});
