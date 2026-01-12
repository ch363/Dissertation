import { signInWithEmail } from '@/app/api/auth';

// Minimal smoke test to ensure the facade exports exist and are callable.
// In CI this would be mocked; here we just assert the function type.

test('modules/auth exports signInWithEmail', () => {
  expect(typeof signInWithEmail).toBe('function');
});
