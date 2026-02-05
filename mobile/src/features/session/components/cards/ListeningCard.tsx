import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';

import { getListeningCardColors } from '../../constants/cardTypeColors';
import { useAudioRecording } from '../../hooks/useAudioRecording';

import {
  ListeningSpeakMode,
  ListeningTypeMode,
  PronunciationLoading,
  PronunciationResult,
  listeningStyles,
} from './listening';

import { useTtsAudio } from '@/hooks/useTtsAudio';
import { createLogger } from '@/services/logging';
import { announce } from '@/utils/a11y';
import { ListeningCard as ListeningCardType, PronunciationResult as PronunciationResultType } from '@/types/session';

const logger = createLogger('ListeningCard');

type Props = {
  card: ListeningCardType;
  userAnswer?: string;
  onAnswerChange?: (answer: string) => void;
  showResult?: boolean;
  isCorrect?: boolean;
  grammaticalCorrectness?: number | null;
  onCheckAnswer?: (audioUri?: string) => void;
  onContinue?: () => void;
  pronunciationResult?: PronunciationResultType | null;
  isPronunciationProcessing?: boolean;
  onPracticeAgain?: () => void;
};

/**
 * ListeningCard component for "Type What You Hear" and "Speak This Phrase" modes.
 *
 * This component orchestrates between different sub-components:
 * - ListeningTypeMode: Type what you hear
 * - ListeningSpeakMode: Record pronunciation
 * - PronunciationLoading: Processing state
 * - PronunciationResult: Pronunciation feedback
 */
export function ListeningCard({
  card,
  userAnswer = '',
  onAnswerChange,
  showResult = false,
  isCorrect,
  grammaticalCorrectness: _grammaticalCorrectness,
  onCheckAnswer,
  onContinue,
  pronunciationResult,
  isPronunciationProcessing = false,
  onPracticeAgain,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const mode = card.mode || 'type';
  const cardColors = getListeningCardColors(mode);

  // Use TTS audio hook for playback
  const tts = useTtsAudio();

  // Handle recording completion - process pronunciation immediately
  const handleRecordingComplete = useCallback(
    (uri: string) => {
      onCheckAnswer?.(uri);
    },
    [onCheckAnswer],
  );

  // Use audio recording hook with speech recognition settings
  const recording = useAudioRecording({
    useSpeechRecognitionSettings: true,
    onRecordingComplete: handleRecordingComplete,
  });

  // Announce recording errors
  useEffect(() => {
    if (recording.recordingError) {
      announce(recording.recordingError);
    }
  }, [recording.recordingError]);

  // Reset recording state when card changes
  useEffect(() => {
    recording.reset();
  }, [card.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Play audio using TTS
  const handlePlayAudio = useCallback(async () => {
    if (isPlaying) return;

    try {
      setIsPlaying(true);
      const textToSpeak = card.expected || card.audioUrl || '';

      if (!textToSpeak) {
        setIsPlaying(false);
        return;
      }

      // Small delay to ensure any previous speech stops
      await tts.stop();
      await new Promise((resolve) => setTimeout(resolve, 100));

      await tts.speak(textToSpeak, 'it-IT');

      // Reset playing state after estimated duration
      const estimatedDuration = Math.max(2000, textToSpeak.length * 150);
      setTimeout(() => setIsPlaying(false), estimatedDuration);
    } catch (error) {
      logger.error('Failed to play audio', error as Error);
      announce('Failed to play audio.');
      setIsPlaying(false);
    }
  }, [isPlaying, card.expected, card.audioUrl, tts]);

  // Play individual word audio
  const handlePlayWordAudio = useCallback(
    async (word: string) => {
      try {
        await tts.stop();
        await new Promise((resolve) => setTimeout(resolve, 100));
        await tts.speak(word, 'it-IT');
      } catch (error) {
        logger.error('Failed to play word audio', error as Error);
        announce('Failed to play word audio.');
      }
    },
    [tts],
  );

  // Handle practice again
  const handlePracticeAgain = useCallback(() => {
    recording.reset();
    onPracticeAgain?.();
  }, [recording, onPracticeAgain]);

  // Speak mode rendering
  if (mode === 'speak') {
    // Loading state
    if (isPronunciationProcessing) {
      return (
        <View style={listeningStyles.pronunciationContainer}>
          <PronunciationLoading cardColors={cardColors} />
        </View>
      );
    }

    // Result state
    if (showResult && pronunciationResult) {
      return (
        <PronunciationResult
          expected={card.expected ?? ''}
          translation={card.translation}
          pronunciationResult={pronunciationResult}
          cardColors={cardColors}
          onPlayWordAudio={handlePlayWordAudio}
          onPracticeAgain={handlePracticeAgain}
          onContinue={onContinue}
        />
      );
    }

    // Input state
    return (
      <ListeningSpeakMode
        expected={card.expected ?? ''}
        translation={card.translation}
        cardColors={cardColors}
        isPlaying={isPlaying}
        isRecording={recording.isRecording}
        hasRecorded={recording.hasRecorded}
        recordedAudioUri={recording.recordedAudioUri}
        isPronunciationProcessing={isPronunciationProcessing}
        isIOSSimulator={recording.isIOSSimulator}
        recordingError={recording.recordingError}
        onPlayAudio={handlePlayAudio}
        onStartRecording={recording.startRecording}
        onStopRecording={recording.stopRecording}
        onCheckAnswer={onCheckAnswer ?? (() => {})}
      />
    );
  }

  // Type mode rendering
  return (
    <ListeningTypeMode
      expected={card.expected ?? ''}
      cardColors={cardColors}
      userAnswer={userAnswer}
      onAnswerChange={onAnswerChange}
      showResult={showResult}
      isCorrect={isCorrect}
      isPlaying={isPlaying}
      onPlayAudio={handlePlayAudio}
      onCheckAnswer={onCheckAnswer}
    />
  );
}
