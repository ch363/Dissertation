import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

const SPEAKER_GRADIENT = ['#2563eb', '#4f46e5'] as const; // blue-600 to indigo-600 (same as TeachCard)

export type SpeakerButtonProps = {
  /** Diameter of the circular button in pixels. Default 80. */
  size?: number;
  /** Whether audio is currently playing (shows pause icon and active ring). */
  isPlaying?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Show a small hint below the button (e.g. "Tap to listen"). */
  showTapHint?: boolean;
  /** Hint text when showTapHint is true. Default "Tap to listen". */
  tapHintText?: string;
};

export function SpeakerButton({
  size = 80,
  isPlaying = false,
  onPress,
  accessibilityLabel = isPlaying ? 'Playing audio' : 'Play pronunciation',
  accessibilityHint,
  showTapHint = false,
  tapHintText = 'Tap to listen',
}: SpeakerButtonProps) {
  const ctx = useAppTheme();
  const theme = ctx?.theme ?? baseTheme;
  const radius = size / 2;
  const iconSize = Math.round(size * 0.4);

  // Single size/border object so the circle is never lost when merging styles.
  const sizeStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    overflow: 'hidden' as const,
  };

  return (
    <View style={styles.wrap}>
      {/* Clip wrapper: forces everything (highlight, shadow, content) into a circle */}
      <View style={[styles.clipCircle, sizeStyle]}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.button,
            sizeStyle,
            pressed && { opacity: 0.9, borderRadius: radius },
          ]}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityRole="button"
        >
          {/* Gradient fill – same size as button so it stays centered */}
          <View style={[StyleSheet.absoluteFill, sizeStyle]} pointerEvents="none">
            <LinearGradient colors={SPEAKER_GRADIENT} style={StyleSheet.absoluteFill} />
          </View>
          {/* Active ring as separate overlay – avoids border offset on Pressable */}
          {isPlaying ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                sizeStyle,
                {
                  borderWidth: 4,
                  borderColor: 'rgba(96, 165, 250, 0.5)',
                  borderRadius: radius,
                },
              ]}
              pointerEvents="none"
            />
          ) : null}
          {/* Icon centered in full button area */}
          <View style={[StyleSheet.absoluteFill, styles.iconWrap]}>
            <Ionicons name={isPlaying ? 'pause' : 'volume-high'} size={iconSize} color="#fff" />
          </View>
        </Pressable>
      </View>
      {showTapHint && !isPlaying ? (
        <View style={styles.tapHintPill}>
          <Text style={[styles.tapHint, { color: theme.colors.mutedText }]}>{tapHintText}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    position: 'relative',
  },
  clipCircle: {
    overflow: 'hidden',
  },
  button: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // No shadow on the button – shadow often renders as a square halo on iOS
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    // Fill button so icon is centered in the full circle
  },
  tapHintPill: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'center',
  },
  tapHint: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 12,
  },
});
