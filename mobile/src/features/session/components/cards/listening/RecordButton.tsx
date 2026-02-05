import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { pronunciationStyles } from './listeningStyles';

import { useRecordingPulse } from '@/features/session/hooks/useRecordingPulse';

type Props = {
  isRecording: boolean;
  isPronunciationProcessing: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
  compact?: boolean;
};

/**
 * Animated record button with pulse effect when recording.
 * Respects reduced motion preferences via useRecordingPulse hook.
 */
export function RecordButton({
  isRecording,
  isPronunciationProcessing,
  onPressIn,
  onPressOut,
  compact = false,
}: Props) {
  const pulseAnim = useRecordingPulse(isRecording);

  return (
    <View style={[
      pronunciationStyles.recordSection,
      compact && pronunciationStyles.recordSectionInInput,
    ]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRecording ? 'Release to stop recording' : 'Hold to record'}
          accessibilityHint={
            isRecording ? undefined : 'Press and hold the button while you speak'
          }
          accessibilityState={{ selected: isRecording, disabled: isPronunciationProcessing }}
          style={[
            pronunciationStyles.recordButton,
            isRecording && pronunciationStyles.recordButtonActive,
          ]}
          onPressIn={() => {
            if (!isRecording && !isPronunciationProcessing) onPressIn();
          }}
          onPressOut={() => {
            if (isRecording) onPressOut();
          }}
          disabled={isPronunciationProcessing}
        >
          <Ionicons name="mic" size={44} color="#fff" />
        </Pressable>
      </Animated.View>
      <Text style={pronunciationStyles.recordHint}>
        Hold to record your pronunciation
      </Text>
    </View>
  );
}
