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
let isWarmedUp = false; // Track if TTS has been warmed up

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
  // Ensure module is initialized first
  const initialized = await ensureInitialized();
  if (!initialized || !SpeechModule) {
    console.error('TTS not available - module not initialized');
    isSpeaking = false;
    return;
  }
  
  if (!text || text.trim().length === 0) {
    console.warn('TTS: Empty text provided');
    isSpeaking = false;
    return;
  }
  
  // Only stop if we're actually speaking - don't stop if we just warmed up
  // This prevents interfering with the audio system initialization
  if (isSpeaking) {
    try {
      SpeechModule.stop();
      // Wait a bit longer to ensure stop completes
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // Ignore stop errors
      console.debug('TTS stop error (ignored):', error);
    }
  }
  
  // Reset flag before starting new speech
  isSpeaking = false;
  
  // Small delay to ensure audio system is ready (especially after warmup)
  if (!isWarmedUp) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // expo-speech.speak() is synchronous - use callbacks to track state
  // It will automatically use default voice if language-specific voice isn't available
  try {
    isSpeaking = true;
    console.log('TTS: Speaking:', text.substring(0, 30));
    
    // Use callbacks to properly track speaking state (if supported)
    // Note: Some versions of expo-speech may not support all callbacks
    const speakOptions: any = {
      language: options?.language,
      rate: options?.rate || 1.0,
    };
    
    // Add callbacks if they're supported (they may not be in all versions)
    if (typeof SpeechModule.speak === 'function') {
      // Try to add callbacks - they may not be supported but won't break if they are
      speakOptions.onDone = () => {
        console.log('TTS: Speech completed (onDone callback)');
        isSpeaking = false;
      };
      speakOptions.onStopped = () => {
        console.log('TTS: Speech stopped (onStopped callback)');
        isSpeaking = false;
      };
      speakOptions.onError = (error: any) => {
        console.error('TTS: Speech error (onError callback):', error);
        isSpeaking = false;
      };
    }
    
    // Call speak - this is synchronous but starts async audio playback
    SpeechModule.speak(text, speakOptions);
    console.log('TTS: speak() called successfully');
    
    // Primary reset mechanism: Use timeout to reset flag
    // This is more reliable than callbacks which may not fire on audio errors
    // Use realistic duration based on text length
    const estimatedDuration = Math.max(1000, text.length * 100);
    setTimeout(() => {
      if (isSpeaking) {
        console.debug('TTS: Resetting speaking flag after estimated duration');
        isSpeaking = false;
      }
    }, estimatedDuration);
  } catch (error) {
    console.error('TTS speak error:', error);
    isSpeaking = false; // Always reset on error
    throw error; // Re-throw to allow caller to handle
  }
}

export async function stop() {
  // Always reset speaking flag first
  isSpeaking = false;
  
  const initialized = await ensureInitialized();
  if (!initialized || !SpeechModule) {
    return; // no-op if not available
  }
  
  try {
    SpeechModule.stop();
    console.debug('TTS: stop() called');
  } catch (error) {
    // Ignore stop errors - might not be speaking
    console.debug('TTS stop error (ignored):', error);
  }
}

/**
 * Force reset the speaking flag - useful for recovery
 */
export function resetSpeakingFlag() {
  isSpeaking = false;
  console.debug('TTS: Speaking flag manually reset');
}

/**
 * Preload TTS by doing a quick test speak
 * This ensures the native module is fully initialized and ready
 * Call this when a session starts to avoid delay on first button press
 */
export async function warmupTts(): Promise<void> {
  try {
    const initialized = await ensureInitialized();
    if (!initialized || !SpeechModule) {
      console.warn('TTS: Cannot warmup - module not initialized');
      return;
    }
    
    if (isWarmedUp) {
      console.debug('TTS: Already warmed up, skipping');
      return;
    }
    
    // Do a quick test speak with a very short phrase to warm up the native module
    // This initializes the TTS engine and loads the voice, eliminating first-use delay
    // Use a short Italian word since most of our content is Italian
    const testText = 'a';
    
    return new Promise<void>((resolve) => {
      try {
        // Reset flag before warmup
        isSpeaking = false;
        
        let resolved = false;
        const resolveOnce = () => {
          if (!resolved) {
            resolved = true;
            isSpeaking = false;
            isWarmedUp = true; // Mark as warmed up
            console.log('TTS: Warmup completed successfully');
            resolve();
          }
        };
        
        console.log('TTS: Starting warmup...');
        
        // Speak a very short phrase to initialize the audio system
        SpeechModule.speak(testText, {
          language: 'it-IT',
          rate: 3.0, // Very fast rate to minimize delay
          onDone: () => {
            console.log('TTS: Warmup speech completed');
            isSpeaking = false;
            // Wait a bit before resolving to ensure audio system is fully ready
            setTimeout(() => resolveOnce(), 200);
          },
          onStopped: () => {
            console.log('TTS: Warmup speech stopped');
            isSpeaking = false;
            setTimeout(() => resolveOnce(), 200);
          },
          onError: (error: any) => {
            console.warn('TTS warmup error:', error);
            isSpeaking = false;
            // Still mark as warmed up even if there's an error
            setTimeout(() => resolveOnce(), 200);
          },
        });
        
        // Stop after a brief moment - we just want to initialize, not play full audio
        setTimeout(() => {
          try {
            SpeechModule?.stop();
            isSpeaking = false;
            // Give it time to fully initialize
            setTimeout(() => resolveOnce(), 300);
          } catch (error) {
            isSpeaking = false;
            setTimeout(() => resolveOnce(), 300);
            // Ignore errors
          }
        }, 150); // Give it enough time to start initializing
        
        // Fallback timeout to ensure we always resolve
        setTimeout(() => {
          if (!resolved) {
            console.warn('TTS: Warmup timeout - marking as warmed up anyway');
            resolveOnce();
          }
        }, 1000);
      } catch (error) {
        isSpeaking = false; // Always reset on error
        isWarmedUp = true; // Mark as warmed up even on error
        console.warn('TTS: Warmup error, but marking as warmed up:', error);
        resolve();
      }
    });
  } catch (error) {
    isSpeaking = false; // Ensure flag is reset
    isWarmedUp = true; // Mark as warmed up even on error
    console.warn('Failed to warmup TTS:', error);
    // Continue anyway - speak() will handle it
  }
}
