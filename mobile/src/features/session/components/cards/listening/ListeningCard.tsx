import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';

import { listeningStyles } from './shared';
import { ListeningTypeMode } from './speech-to-text';
import {
  ListeningSpeakMode,
  PronunciationLoading,
  PronunciationResult,
} from './text-to-speech';

import { getListeningCardColors } from '@/features/session/constants/cardTypeColors';
import { useAudioRecording } from '@/features/session/hooks/useAudioRecording';
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
 * ListeningCard component supporting multiple delivery methods:
 * 
 * - speech-to-text: "Type What You Hear" (audio → text input)
 * - text-to-speech: "Speak This Phrase" (text → speech recording)
 * 
 * This component orchestrates between the delivery method sub-components.
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
  const mode = card.mode || 'type';
  const cardColors = getListeningCardColors(mode);

  // Use TTS audio hook for playback
  const { speak, stop, isSpeaking } = useTtsAudio();

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
    const textToSpeak = card.expected || card.audioUrl || '';

    if (!textToSpeak) {
      return;
    }

    try {
      await speak(textToSpeak, 'it-IT');
    } catch (error) {
      logger.error('Failed to play audio', error as Error);
      announce('Failed to play audio.');
    }
  }, [card.expected, card.audioUrl, speak]);

  // Play individual word audio
  const handlePlayWordAudio = useCallback(
    async (word: string) => {
      try {
        await stop();
        await new Promise((resolve) => setTimeout(resolve, 100));
        await speak(word, 'it-IT');
      } catch (error) {
        logger.error('Failed to play word audio', error as Error);
        announce('Failed to play word audio.');
      }
    },
    [stop, speak],
  );

  // Handle practice again
  const handlePracticeAgain = useCallback(() => {
    recording.reset();
    onPracticeAgain?.();
  }, [recording, onPracticeAgain]);

  // ─────────────────────────────────────────────────────────────────────────────
  // TEXT-TO-SPEECH: "Speak This Phrase" mode
  // ─────────────────────────────────────────────────────────────────────────────
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
        isPlaying={isSpeaking}
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

  // ─────────────────────────────────────────────────────────────────────────────
  // SPEECH-TO-TEXT: "Type What You Hear" mode
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <ListeningTypeMode
      expected={card.expected ?? ''}
      translation={card.translation}
      cardColors={cardColors}
      userAnswer={userAnswer}
      onAnswerChange={onAnswerChange}
      showResult={showResult}
      isCorrect={isCorrect}
      isPlaying={isSpeaking}
      onPlayAudio={handlePlayAudio}
      onCheckAnswer={onCheckAnswer}
    />
  );
}
