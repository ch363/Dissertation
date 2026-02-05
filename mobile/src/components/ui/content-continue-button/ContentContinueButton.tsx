import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

import { Button } from '@/components/ui/button/Button';

const CONTENT_BUTTON_MIN_HEIGHT = 56;
const CONTENT_BUTTON_RADIUS = 20;

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

/**
 * Standard bottom-of-page continue button for all content flows (session, summary,
 * completion, lesson, onboarding). Use this so the next action is visually
 * consistent across the app.
 */
export function ContentContinueButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: Props) {
  return (
    <Button
      title={title}
      onPress={onPress}
      variant="primary"
      disabled={disabled}
      loading={loading}
      style={[styles.button, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: CONTENT_BUTTON_MIN_HEIGHT,
    borderRadius: CONTENT_BUTTON_RADIUS,
  },
});
