/**
 * Sound Effects Service
 * 
 * Provides global sound effects for user interactions, particularly
 * success sounds when answers are correct.
 * 
 * Uses expo-speech to generate simple tones since we don't have expo-av installed.
 * For a production app, consider installing expo-av and using actual sound files.
 */

import * as Speech from 'expo-speech';

let isPlayingSuccess = false;
let isPlayingError = false;

/**
 * Plays a success sound when user gets an answer correct.
 * Uses a two-tone chime pattern for a pleasant success indication.
 */
export async function playSuccessSound(): Promise<void> {
  if (isPlayingSuccess) return; // Prevent overlapping sounds
  
  try {
    isPlayingSuccess = true;
    
    // Stop any ongoing speech first
    await Speech.stop();
    
    // Play a pleasant two-tone success chime
    // First tone: higher pitch
    await Speech.speak(' ', {
      pitch: 1.4,
      rate: 3.5,
      language: 'en-US',
    });
    
    // Stop first tone quickly and play second tone
    setTimeout(async () => {
      await Speech.stop();
      await Speech.speak(' ', {
        pitch: 1.6,
        rate: 3.5,
        language: 'en-US',
      });
      
      // Reset playing state after both tones
      setTimeout(() => {
        Speech.stop();
        isPlayingSuccess = false;
      }, 120);
    }, 80);
  } catch (error) {
    // Silently fail - sound effects are non-critical
    console.debug('Failed to play success sound:', error);
    isPlayingSuccess = false;
  }
}

/**
 * Plays an error sound when user gets an answer incorrect.
 * Uses a lower-pitched, single-tone sound to indicate failure.
 */
export async function playErrorSound(): Promise<void> {
  if (isPlayingError) return; // Prevent overlapping sounds
  
  try {
    isPlayingError = true;
    
    // Stop any ongoing speech first
    await Speech.stop();
    
    // Play a lower-pitched, single-tone error sound
    await Speech.speak(' ', {
      pitch: 0.8, // Lower pitch for error
      rate: 2.5,
      language: 'en-US',
    });
    
    // Reset playing state after sound
    setTimeout(() => {
      Speech.stop();
      isPlayingError = false;
    }, 150);
  } catch (error) {
    // Silently fail - sound effects are non-critical
    console.debug('Failed to play error sound:', error);
    isPlayingError = false;
  }
}
