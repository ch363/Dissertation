import { useAppTheme, getTtsEnabled, setTtsEnabled } from '../src/modules/settings';

// Smoke tests to verify facade exports' shapes
test('modules/settings exports useAppTheme', () => {
  expect(typeof useAppTheme).toBe('function');
});

test('modules/settings exports tts prefs', async () => {
  expect(typeof getTtsEnabled).toBe('function');
  expect(typeof setTtsEnabled).toBe('function');
  // Should be callable without throwing (AsyncStorage is mocked)
  const initial = await getTtsEnabled();
  await setTtsEnabled(!initial);
  const after = await getTtsEnabled();
  expect(typeof after).toBe('boolean');
});
