import { signInWithEmailPassword } from '@/services/api/auth';

// Minimal smoke test to ensure the facade exports exist and are callable.
// In CI this would be mocked; here we just assert the function type.

test('modules/auth exports signInWithEmailPassword', () => {
  expect(typeof signInWithEmailPassword).toBe('function');
});
