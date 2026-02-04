import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TappableCard } from '@/components/ui';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type PathItem = {
  title: string;
  lessons: string;
  locked?: boolean;
  lockCopy?: string;
  route: string;
  completed?: boolean;
};

type Props = {
  items: PathItem[];
  onPressItem: (route: string) => void;
  headerLabel: string;
};

export function PickPathList({ items, onPressItem, headerLabel }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.header, { color: theme.colors.text }]}>{headerLabel}</Text>
      <View style={styles.cardList}>
        {items.map((item) => {
          const disabled = !!item.locked;
          const subtitle =
            disabled && item.lockCopy ? `${item.lessons}\n${item.lockCopy}` : item.lessons;
          return (
            <TappableCard
              key={item.title}
              title={item.title}
              subtitle={subtitle}
              leftIcon={disabled ? 'lock-closed' : 'star'}
              onPress={() => {
                if (!disabled) onPressItem(item.route);
              }}
              accessibilityLabel={`${item.title}, ${item.lessons}${disabled ? ', locked' : ''}`}
              accessibilityHint={disabled ? undefined : 'Opens this path'}
              style={disabled ? styles.cardDisabled : undefined}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: baseTheme.spacing.sm,
  },
  header: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 20,
  },
  cardList: {
    gap: baseTheme.spacing.sm,
  },
  cardDisabled: {
    opacity: 0.7,
  },
});
