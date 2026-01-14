import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Safe wrapper around expo-speech that preloads the native module.
// If the module isn't present in the native build, calls will no-op.
// expo-speech automatically handles missing voices by using the default system voice.

type SpeakOptions = {
  language?: string;
  rate?: number;
};

// Preload the Speech module at app startup
let SpeechModule: typeof import('expo-speech') | null = null;
let preloadPromise: Promise<void> | null = null;
let isInitialized = false;
let isSpeaking = false; // Track if currently speaking to prevent overlapping calls

/**
 * Preload expo-speech module to avoid delay on first use
 * Call this at app startup
 */
export async function preloadSpeech(): Promise<void> {
  if (isInitialized && SpeechModule) {
    return; // Already loaded
  }
  
  if (preloadPromise) {
    return preloadPromise; // Already preloading
  }
  
  preloadPromise = (async () => {
    try {
      SpeechModule = await import('expo-speech');
      // Small delay to ensure native module is fully initialized
      await new Promise(resolve => setTimeout(resolve, 100));
      isInitialized = true;
      console.log('TTS module preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload expo-speech:', error);
      isInitialized = false;
      // Continue anyway - speak() will handle it
    }
  })();
  
  return preloadPromise;
}

/**
 * Ensure TTS module is loaded before use
 */
async function ensureInitialized(): Promise<boolean> {
  if (isInitialized && SpeechModule) {
    return true;
  }
  
  // Wait for preload if in progress
  if (preloadPromise) {
    await preloadPromise;
    if (SpeechModule) {
      return true;
    }
  }
  
  // Fallback: load now
  try {
    SpeechModule = await import('expo-speech');
    // Small delay to ensure native module is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('TTS initialization error:', error);
    return false;
  }
}

export async function speak(text: string, options?: SpeakOptions) {
  // Prevent overlapping calls
  if (isSpeaking) {
    console.debug('TTS: Already speaking, stopping previous speech');
    await stop();
    // Wait a bit longer for stop to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Ensure module is initialized
  const initialized = await ensureInitialized();
  if (!initialized || !SpeechModule) {
    console.error('TTS not available - module not initialized');
    return;
  }
  
  if (!text || text.trim().length === 0) {
    console.warn('TTS: Empty text provided');
    return;
  }
  
  // Ensure any current speech is stopped before speaking
  try {
    SpeechModule.stop();
    // Small delay to ensure stop completes
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    // Ignore stop errors
  }
  
  // expo-speech.speak() is synchronous - just call it directly
  // It will automatically use default voice if language-specific voice isn't available
  try {
    isSpeaking = true;
    SpeechModule.speak(text, {
      language: options?.language,
      rate: options?.rate || 1.0,
    });
    // Reset speaking flag after estimated duration (text length * ~100ms per character)
    const estimatedDuration = Math.max(1000, text.length * 100);
    setTimeout(() => {
      isSpeaking = false;
    }, estimatedDuration);
  } catch (error) {
    console.error('TTS speak error:', error);
    isSpeaking = false;
  }
}

export async function stop() {
  isSpeaking = false; // Reset speaking flag
  
  const initialized = await ensureInitialized();
  if (!initialized || !SpeechModule) {
    return; // no-op if not available
  }
  
  try {
    SpeechModule.stop();
  } catch (error) {
    // no-op if not available
  }
}
