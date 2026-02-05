/**
 * Strategy Pattern Implementations for Delivery Methods
 * 
 * Each strategy encapsulates the behavior for a specific delivery method.
 * This demonstrates the Strategy Pattern and Open/Closed Principle:
 * - Open for extension: New delivery methods can be added by creating new strategies
 * - Closed for modification: Existing strategies don't need to change
 */

export { MultipleChoiceStrategy } from './multiple-choice.strategy';
export { FillBlankStrategy } from './fill-blank.strategy';
export { TextTranslationStrategy } from './text-translation.strategy';

// Additional strategies would be added here:
// export { FlashcardStrategy } from './flashcard.strategy';
// export { SpeechToTextStrategy } from './speech-to-text.strategy';
// export { TextToSpeechStrategy } from './text-to-speech.strategy';
