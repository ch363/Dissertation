import { ensureProfileSeed } from '@/app/api/profile';

test('modules/profile exports ensureProfileSeed', () => {
  expect(typeof ensureProfileSeed).toBe('function');
});
