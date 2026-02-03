import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HelpButton } from '@/components/navigation';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  onActionPress?: () => void;
};

export function LearnHeader({ onActionPress }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.outer}>
      <View style={[styles.gradient, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <View style={styles.textSection}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Learn</Text>
            <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
              Explore lessons and track your progress
            </Text>
          </View>
          <View style={styles.headerActions}>
            <HelpButton
              variant="elevated"
              accessibilityLabel="Help, learn screen tips"
              accessibilityHint="Opens help information"
            />
            {onActionPress && (
              <Pressable
                onPress={onActionPress}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: pressed ? theme.colors.border : 'transparent',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="More options"
              >
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginBottom: 0,
  },
  gradient: {
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  textSection: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 32,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
    opacity: 0.85,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
