import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { RecordButton } from './RecordButton';

import { listeningStyles, pronunciationStyles, CardColors } from '../shared';

import { ContentContinueButton, SpeakerButton } from '@/components/ui';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  expected: string;
  translation?: string;
  cardColors: CardColors;
  isPlaying: boolean;
  isRecording: boolean;
  hasRecorded: boolean;
  recordedAudioUri: string | null;
  isPronunciationProcessing: boolean;
  isIOSSimulator: boolean;
  recordingError: string | null;
  onPlayAudio: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCheckAnswer: (audioUri?: string) => void;
};

/**
 * Text-to-speech delivery mode for ListeningCard.
 * User sees text and records their pronunciation.
 * 
 * Delivery method: text → speech recording
 */
export function ListeningSpeakMode({
  expected,
  translation,
  cardColors,
  isPlaying,
  isRecording,
  hasRecorded,
  recordedAudioUri,
  isPronunciationProcessing,
  isIOSSimulator,
  recordingError,
  onPlayAudio,
  onStartRecording,
  onStopRecording,
  onCheckAnswer,
}: Props) {
  return (
    <View style={listeningStyles.pronunciationContainer}>
      <Text style={[pronunciationStyles.instruction, { color: cardColors.instruction }]}>
        SPEAK THIS PHRASE
      </Text>

      <View
        style={[
          pronunciationStyles.inputMiddle,
          {
            borderLeftWidth: 3,
            borderLeftColor: cardColors.border,
            paddingLeft: baseTheme.spacing.sm,
            borderRadius: baseTheme.radius.sm,
          },
        ]}
      >
        {/* Phrase with speaker button */}
        <View style={pronunciationStyles.phraseRow}>
          <View
            style={[pronunciationStyles.phraseBlock, pronunciationStyles.phraseBlockInInput]}
            collapsable={false}
          >
            <Text
              style={pronunciationStyles.phrase}
              numberOfLines={4}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {expected}
            </Text>
            {translation && (
              <Text style={pronunciationStyles.translation} numberOfLines={2}>
                ({translation})
              </Text>
            )}
          </View>
          <SpeakerButton
            size={64}
            isPlaying={isPlaying}
            onPress={onPlayAudio}
            accessibilityLabel="Listen to pronunciation"
          />
        </View>

        {/* Record button */}
        <RecordButton
          isRecording={isRecording}
          isPronunciationProcessing={isPronunciationProcessing}
          onPressIn={onStartRecording}
          onPressOut={onStopRecording}
          compact
        />

        {/* Tip box */}
        <View style={[pronunciationStyles.tipBox, pronunciationStyles.tipBoxInInput]}>
          <Ionicons
            name="bulb-outline"
            size={20}
            color={baseTheme.colors.mutedText}
            style={pronunciationStyles.tipIcon}
          />
          <Text style={pronunciationStyles.tipText}>
            Find a quiet space for best results
          </Text>
        </View>
      </View>

      {/* iOS Simulator warning */}
      {isIOSSimulator && (
        <View style={listeningStyles.simulatorWarning}>
          <Text style={listeningStyles.warningText}>
            ⚠️ iOS Simulator: Microphone may not work
          </Text>
          <Text style={listeningStyles.warningSubtext}>
            Try: System Settings → Privacy → Microphone → Allow Xcode
          </Text>
        </View>
      )}

      {/* Error message */}
      {recordingError && (
        <Text style={listeningStyles.errorText} accessibilityRole="alert">
          {recordingError}
        </Text>
      )}

      {/* Continue button */}
      <ContentContinueButton
        title={
          isPronunciationProcessing
            ? 'Processing…'
            : hasRecorded
              ? 'Continue'
              : 'Record to continue'
        }
        onPress={() => {
          if (!hasRecorded || !recordedAudioUri || !onCheckAnswer) return;
          onCheckAnswer(recordedAudioUri);
        }}
        disabled={!hasRecorded || isPronunciationProcessing}
        accessibilityLabel={
          isPronunciationProcessing
            ? 'Processing…'
            : hasRecorded
              ? 'Continue'
              : 'Record to continue'
        }
      />
    </View>
  );
}
