import { useCallback, useRef } from 'react';

import { createLogger } from '@/services/logging';
import { getTtsEnabled, getTtsRate } from '@/services/preferences';
import * as SafeSpeech from '@/services/tts';

const logger = createLogger('useTtsAudio');

/**
 * Reusable hook for Text-to-Speech functionality.
 * Handles TTS preferences, speaking, and stopping speech.
 *
 * @example
 * ```tsx
 * const { speak, stop, isSpeaking } = useTtsAudio();
 *
 * const handlePlayAudio = () => {
 *   speak('Hello world', 'en');
 * };
 * ```
 */
export function useTtsAudio() {
  const isSpeakingRef = useRef(false);

  const speak = useCallback(async (text: string, language: string = 'it'): Promise<boolean> => {
    try {
      const enabled = await getTtsEnabled();
      if (!enabled) {
        logger.debug('TTS disabled, skipping speech');
        return false;
      }

      const rate = await getTtsRate();

      isSpeakingRef.current = true;
      await SafeSpeech.speak(text, {
        language,
        rate,
        onDone: () => {
          isSpeakingRef.current = false;
        },
        onStopped: () => {
          isSpeakingRef.current = false;
        },
        onError: () => {
          isSpeakingRef.current = false;
        },
      });

      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to speak text', err);
      isSpeakingRef.current = false;
      return false;
    }
  }, []);

  const stop = useCallback(async (): Promise<void> => {
    try {
      await SafeSpeech.stop();
      isSpeakingRef.current = false;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to stop speech', err);
    }
  }, []);

  return {
    speak,
    stop,
    get isSpeaking() {
      return isSpeakingRef.current;
    },
  };
}
