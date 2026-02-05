// Main orchestrator component
export { ListeningCard } from './ListeningCard';

// Delivery method: speech-to-text ("Type What You Hear")
export { ListeningTypeMode } from './speech-to-text';

// Delivery method: text-to-speech ("Speak This Phrase")
export {
  ListeningSpeakMode,
  RecordButton,
  PronunciationLoading,
  PronunciationResult,
} from './text-to-speech';

// Shared styles and types
export { listeningStyles, pronunciationStyles } from './shared';
export type { CardColors } from './shared';
