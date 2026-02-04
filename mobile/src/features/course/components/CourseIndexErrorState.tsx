import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

interface CourseIndexErrorStateProps {
  onRetry?: () => void;
}

export function CourseIndexErrorState({ onRetry }: CourseIndexErrorStateProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.error + '20' }]}>
        <Ionicons name="cloud-offline" size={32} color={theme.colors.error} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>Connection lost</Text>
      <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
        Check your internet connection and try again
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.colors.primary },
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: baseTheme.spacing.lg,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 14,
  },
});
