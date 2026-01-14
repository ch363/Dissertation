import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Safe wrapper around expo-speech that lazy-loads the native module.
// If the module isn't present in the native build, calls will no-op.
// expo-speech automatically handles missing voices by using the default system voice.

type SpeakOptions = {
  language?: string;
  rate?: number;
};

export async function speak(text: string, options?: SpeakOptions) {
  // Avoid simulator-native warnings/errors about missing voices.
  // But still allow it to work - expo-speech will use default voice
  try {
    const Speech = await import('expo-speech');
    // Ensure any current speech is stopped before speaking
    try {
      Speech.stop();
    } catch {}
    // expo-speech.speak() is synchronous - just call it directly
    // It will automatically use default voice if language-specific voice isn't available
    Speech.speak(text, {
      language: options?.language,
      rate: options?.rate || 1.0,
    });
  } catch (error) {
    // no-op if not available
    console.error('TTS error:', error);
  }
}

export async function stop() {
  try {
    const Speech = await import('expo-speech');
    // expo-speech.stop() is synchronous
    Speech.stop();
  } catch (error) {
    // no-op if not available
  }
}
