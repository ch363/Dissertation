import { createLogger } from '@/services/logging';

const logger = createLogger('TTS');

type SpeakOptions = {
  language?: string;
  rate?: number;
};

let SpeechModule: typeof import('expo-speech') | null = null;
let preloadPromise: Promise<void> | null = null;
let isInitialized = false;
let isSpeaking = false;
let isWarmedUp = false;

export async function preloadSpeech(): Promise<void> {
  if (isInitialized && SpeechModule) {
    return;
  }
  
  if (preloadPromise) {
    return preloadPromise;
  }
  
  preloadPromise = (async () => {
    try {
      SpeechModule = await import('expo-speech');
      await new Promise(resolve => setTimeout(resolve, 100));
      isInitialized = true;
      logger.info('TTS module preloaded successfully');
    } catch (error) {
      logger.warn('Failed to preload expo-speech', { error });
      isInitialized = false;
    }
  })();
  
  return preloadPromise;
}

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
  
  try {
    SpeechModule = await import('expo-speech');
    await new Promise(resolve => setTimeout(resolve, 100));
    isInitialized = true;
    return true;
  } catch (error) {
    logger.error('TTS initialization error', error as Error);
    return false;
  }
}

/**
 * Normalize text for TTS so engines (e.g. iOS AVSpeechSynthesizer) pronounce correctly.
 * - NFC normalization for consistent handling of accented chars (e.g. È).
 * - Replace smart/curly apostrophes with ASCII apostrophe so phrases like "l'una" are pronounced properly.
 */
function normalizeTextForTts(text: string): string {
  if (!text || text.trim().length === 0) return text;
  const normalized = text.normalize('NFC');
  return normalized
    .replace(/\u2019/g, "'")  // RIGHT SINGLE QUOTATION MARK (common in "l'una")
    .replace(/\u2018/g, "'")  // LEFT SINGLE QUOTATION MARK
    .replace(/\u2032/g, "'")   // PRIME
    .replace(/\u00B4/g, "'"); // ACUTE ACCENT when used as apostrophe
}

export async function speak(text: string, options?: SpeakOptions) {
  const initialized = await ensureInitialized();
  if (!initialized || !SpeechModule) {
    logger.error('TTS not available - module not initialized');
    isSpeaking = false;
    return;
  }

  const normalizedText = normalizeTextForTts(text);
  if (!normalizedText || normalizedText.trim().length === 0) {
    logger.warn('TTS: Empty text provided');
    isSpeaking = false;
    return;
  }
  
  if (isSpeaking) {
    try {
      SpeechModule.stop();
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      logger.debug('TTS stop error (ignored)', { error });
    }
  }
  
  isSpeaking = false;
  
  if (!isWarmedUp) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  try {
    isSpeaking = true;
    logger.info('TTS: Speaking', { textPreview: normalizedText.substring(0, 30) });

    const speakOptions: any = {
      language: options?.language,
      rate: options?.rate || 1.0,
    };

    if (typeof SpeechModule.speak === 'function') {
      speakOptions.onDone = () => {
        logger.info('TTS: Speech completed (onDone callback)');
        isSpeaking = false;
      };
      speakOptions.onStopped = () => {
        logger.info('TTS: Speech stopped (onStopped callback)');
        isSpeaking = false;
      };
      speakOptions.onError = (error: any) => {
        logger.error('TTS: Speech error (onError callback)', error as Error);
        isSpeaking = false;
      };
    }

    SpeechModule.speak(normalizedText, speakOptions);
    logger.info('TTS: speak() called successfully');

    const estimatedDuration = Math.max(1000, normalizedText.length * 100);
    setTimeout(() => {
      if (isSpeaking) {
        logger.debug('TTS: Resetting speaking flag after estimated duration');
        isSpeaking = false;
      }
    }, estimatedDuration);
  } catch (error) {
    logger.error('TTS speak error', error as Error);
    isSpeaking = false;
    throw error;
  }
}

export async function stop() {
  isSpeaking = false;
  
  const initialized = await ensureInitialized();
  if (!initialized || !SpeechModule) {
    return;
  }
  
  try {
    SpeechModule.stop();
    logger.debug('TTS: stop() called');
  } catch (error) {
    logger.debug('TTS stop error (ignored)', { error });
  }
}

export function resetSpeakingFlag() {
  isSpeaking = false;
  logger.debug('TTS: Speaking flag manually reset');
}

export async function warmupTts(): Promise<void> {
  try {
    const initialized = await ensureInitialized();
    if (!initialized || !SpeechModule) {
      logger.warn('TTS: Cannot warmup - module not initialized');
      return;
    }
    
    if (isWarmedUp) {
      logger.debug('TTS: Already warmed up, skipping');
      return;
    }
    
    const testText = 'a';
    
    return new Promise<void>((resolve) => {
      try {
        isSpeaking = false;
        
        let resolved = false;
        const resolveOnce = () => {
          if (!resolved) {
            resolved = true;
            isSpeaking = false;
            isWarmedUp = true;
            logger.info('TTS: Warmup completed successfully');
            resolve();
          }
        };
        
        logger.info('TTS: Starting warmup...');
        
        SpeechModule.speak(testText, {
          language: 'it-IT',
          rate: 3.0,
          onDone: () => {
            logger.info('TTS: Warmup speech completed');
            isSpeaking = false;
            setTimeout(() => resolveOnce(), 200);
          },
          onStopped: () => {
            logger.info('TTS: Warmup speech stopped');
            isSpeaking = false;
            setTimeout(() => resolveOnce(), 200);
          },
          onError: (error: any) => {
            logger.warn('TTS warmup error', { error });
            isSpeaking = false;
            setTimeout(() => resolveOnce(), 200);
          },
        });
        
        setTimeout(() => {
          try {
            SpeechModule?.stop();
            isSpeaking = false;
            setTimeout(() => resolveOnce(), 300);
          } catch (error) {
            isSpeaking = false;
            setTimeout(() => resolveOnce(), 300);
          }
        }, 150);
        
        setTimeout(() => {
          if (!resolved) {
            logger.warn('TTS: Warmup timeout - marking as warmed up anyway');
            resolveOnce();
          }
        }, 1000);
      } catch (error) {
        isSpeaking = false;
        isWarmedUp = true;
        logger.warn('TTS: Warmup error, but marking as warmed up', { error });
        resolve();
      }
    });
  } catch (error) {
    isSpeaking = false;
    isWarmedUp = true;
    logger.warn('Failed to warmup TTS', { error });
  }
}
