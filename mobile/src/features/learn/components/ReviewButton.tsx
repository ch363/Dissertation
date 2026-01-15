import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Button } from '@/components/ui/Button';
import { getProgressSummary, type ProgressSummary } from '@/services/api/progress';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function ReviewButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  accessibilityLabel,
}: Props) {
  const { theme } = useAppTheme();
  const [dueReviewCount, setDueReviewCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDueReviewCount() {
      try {
        setLoading(true);
        const summary: ProgressSummary = await getProgressSummary(null);
        setDueReviewCount(summary.dueReviewCount || 0);
      } catch (error) {
        console.error('Failed to fetch due review count:', error);
        setDueReviewCount(0);
      } finally {
        setLoading(false);
      }
    }

    fetchDueReviewCount();
  }, []);

  const showBadge = !loading && dueReviewCount > 0;

  return (
    <View style={[styles.container, style]}>
      <Button
        title={title}
        onPress={onPress}
        variant={variant}
        disabled={disabled}
        style={styles.button}
        accessibilityLabel={accessibilityLabel}
      />
      {showBadge && (
        <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
          <Text style={styles.badgeText}>
            {dueReviewCount > 99 ? '99+' : dueReviewCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  button: {
    // Button styles are handled by the Button component
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: baseTheme.typography.bold,
    lineHeight: 14,
  },
});
