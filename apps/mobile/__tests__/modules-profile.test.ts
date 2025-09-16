import { ensureProfileSeed } from '../src/modules/profile';

test('modules/profile exports ensureProfileSeed', () => {
  expect(typeof ensureProfileSeed).toBe('function');
});
