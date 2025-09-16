// Safe wrapper around expo-speech that lazy-loads the native module.
// If the module isn't present in the native build, calls will no-op.

type SpeakOptions = {
  language?: string;
  rate?: number;
};

export async function speak(text: string, options?: SpeakOptions) {
  try {
    const Speech = await import('expo-speech');
    // Ensure any current speech is stopped before speaking
    try {
      await Speech.stop();
    } catch {}
    Speech.speak(text, options);
  } catch {
    // no-op if not available
  }
}

export async function stop() {
  try {
    const Speech = await import('expo-speech');
    await Speech.stop();
  } catch {
    // no-op
  }
}
