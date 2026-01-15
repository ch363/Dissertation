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
 * Plays a success sound (ding) when user gets an answer correct.
 * Uses a pleasant two-tone chime pattern similar to other successful sound effects.
 */
export async function playSuccessSound(): Promise<void> {
  if (isPlayingSuccess) {
    console.debug('Sound: Success sound already playing, skipping');
    return; // Prevent overlapping sounds
  }
  
  try {
    console.debug('Sound: Playing success ding sound');
    isPlayingSuccess = true;
    
    // Stop any ongoing speech first
    Speech.stop();
    
    // Small delay to ensure stop completes
    await new Promise(resolve => setTimeout(resolve, 30));
    
    // Play a pleasant two-tone "ding" chime
    // First tone: higher pitch - use "ding" sound
    Speech.speak('ding', {
      pitch: 1.6,
      rate: 5.0,
      language: 'en-US',
    });
    
    // Stop first tone quickly and play second tone for a nice chime effect
    setTimeout(() => {
      Speech.stop();
      // Small delay before second tone
      setTimeout(() => {
        // Second tone: slightly higher pitch for the "ding" completion
        Speech.speak('ding', {
          pitch: 1.9,
          rate: 5.5,
          language: 'en-US',
        });
        
        // Reset playing state after both tones complete
        setTimeout(() => {
          Speech.stop();
          isPlayingSuccess = false;
          console.debug('Sound: Success ding sound completed');
        }, 200);
      }, 40);
    }, 120);
  } catch (error) {
    // Log error for debugging
    console.warn('Failed to play success sound:', error);
    isPlayingSuccess = false;
  }
}

/**
 * Plays an error sound when user gets an answer incorrect.
 * Uses a lower-pitched, buzzer-like sound to indicate failure.
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
    await new Promise(resolve => setTimeout(resolve, 30));
    
    // Play a lower-pitched, buzzer-like error sound
    Speech.speak('buzz', {
      pitch: 0.5, // Lower pitch for error
      rate: 4.0,
      language: 'en-US',
    });
    
    // Reset playing state after sound completes
    setTimeout(() => {
      Speech.stop();
      isPlayingError = false;
      console.debug('Sound: Error sound completed');
    }, 250);
  } catch (error) {
    // Log error for debugging
    console.warn('Failed to play error sound:', error);
    isPlayingError = false;
  }
}
