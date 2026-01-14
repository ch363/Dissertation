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
  if (isPlayingSuccess) {
    console.debug('Sound: Success sound already playing, skipping');
    return; // Prevent overlapping sounds
  }
  
  try {
    console.debug('Sound: Playing success sound');
    isPlayingSuccess = true;
    
    // Stop any ongoing speech first
    Speech.stop();
    
    // Small delay to ensure stop completes
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Play a pleasant two-tone success chime using vowel sounds
    // First tone: higher pitch - use "ah" sound for better audibility
    Speech.speak('ah', {
      pitch: 1.5,
      rate: 4.5,
      language: 'en-US',
    });
    
    // Stop first tone quickly and play second tone
    setTimeout(() => {
      Speech.stop();
      // Small delay before second tone
      setTimeout(() => {
        // Second tone: even higher pitch - use "eh" sound
        Speech.speak('eh', {
          pitch: 1.8,
          rate: 4.5,
          language: 'en-US',
        });
        
        // Reset playing state after both tones complete
        setTimeout(() => {
          Speech.stop();
          isPlayingSuccess = false;
          console.debug('Sound: Success sound completed');
        }, 250);
      }, 50);
    }, 150);
  } catch (error) {
    // Log error for debugging
    console.warn('Failed to play success sound:', error);
    isPlayingSuccess = false;
  }
}

/**
 * Plays an error sound when user gets an answer incorrect.
 * Uses a lower-pitched, single-tone sound to indicate failure.
 */
export async function playErrorSound(): Promise<void> {
  if (isPlayingError) {
    console.debug('Sound: Error sound already playing, skipping');
    return; // Prevent overlapping sounds
  }
  
  try {
    console.debug('Sound: Playing error sound');
    isPlayingError = true;
    
    // Stop any ongoing speech first
    Speech.stop();
    
    // Small delay to ensure stop completes
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Play a lower-pitched, single-tone error sound using "oh" sound for better audibility
    Speech.speak('oh', {
      pitch: 0.6, // Lower pitch for error
      rate: 3.5,
      language: 'en-US',
    });
    
    // Reset playing state after sound completes
    setTimeout(() => {
      Speech.stop();
      isPlayingError = false;
      console.debug('Sound: Error sound completed');
    }, 300);
  } catch (error) {
    // Log error for debugging
    console.warn('Failed to play error sound:', error);
    isPlayingError = false;
  }
}
