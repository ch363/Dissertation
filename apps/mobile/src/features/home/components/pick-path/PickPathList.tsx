import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_BORDER, OUTER_CARD_RADIUS, softShadow } from '@/components/home/homeStyles';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type PathItem = {
  title: string;
  lessons: string;
  locked?: boolean;
  lockCopy?: string;
  route: string;
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
      <SurfaceCard
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: CARD_BORDER,
          },
        ]}
      >
        {items.map((item, idx) => {
          const disabled = !!item.locked;
          return (
            <React.Fragment key={item.title}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                accessibilityLabel={`${item.title}, ${item.lessons}${disabled ? ', locked' : ''}`}
                disabled={disabled}
                onPress={() => onPressItem(item.route)}
                style={[styles.row, disabled && { opacity: 0.7 }]}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name={disabled ? 'lock-closed' : 'star'}
                      size={18}
                      color={disabled ? theme.colors.mutedText : '#1B6ED4'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
                      {item.lessons}
                    </Text>
                    {disabled && item.lockCopy ? (
                      <Text style={[styles.lockCopy, { color: theme.colors.mutedText }]}>
                        {item.lockCopy}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedText} />
              </Pressable>
              {idx < items.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          );
        })}
      </SurfaceCard>
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
  card: {
    paddingVertical: baseTheme.spacing.sm,
    paddingHorizontal: baseTheme.spacing.sm,
    borderRadius: OUTER_CARD_RADIUS,
    backgroundColor: '#FFFFFF',
    ...softShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: baseTheme.spacing.md + 2,
    minHeight: 64,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    marginTop: 2,
  },
  lockCopy: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: CARD_BORDER,
    marginLeft: 60,
  },
});
