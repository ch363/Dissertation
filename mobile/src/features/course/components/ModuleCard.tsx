import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export type ModuleStatus = 'Not started' | 'In progress' | 'Completed';

export interface ModuleCardProps {
  title: string;
  description: string;
  imageUrl: string;
  level?: string;
  duration?: string;
  lessons?: string;
  status?: ModuleStatus;
  onPress: () => void;
  style?: ViewStyle;
  accessibilityLabel: string;
}

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1596247290824-e9f12b8c574f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400';

export function ModuleCard({
  title,
  description,
  imageUrl,
  level,
  duration,
  lessons,
  status = 'Not started',
  onPress,
  style,
  accessibilityLabel,
}: ModuleCardProps) {
  const { theme } = useAppTheme();
  const hasMeta = level ?? duration ?? lessons ?? status === 'In progress';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.outer,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.inner}>
        <View style={[styles.thumb, { backgroundColor: theme.colors.border }]}>
          <Image
            source={{ uri: imageUrl || PLACEHOLDER_IMAGE }}
            style={styles.thumbImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.content}>
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text
            style={[styles.description, { color: theme.colors.mutedText }]}
            numberOfLines={1}
          >
            {description}
          </Text>

          {hasMeta ? (
            <View style={styles.metaRow}>
              {level != null && level !== '' ? (
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: theme.colors.primary + '18' },
                  ]}
                >
                  <Text
                    style={[styles.pillText, { color: theme.colors.primary }]}
                    numberOfLines={1}
                  >
                    {level}
                  </Text>
                </View>
              ) : null}
              {duration != null && duration !== '' ? (
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: theme.colors.border },
                  ]}
                >
                  <Text
                    style={[styles.pillText, { color: theme.colors.mutedText }]}
                    numberOfLines={1}
                  >
                    {duration}
                  </Text>
                </View>
              ) : null}
              {lessons != null && lessons !== '' ? (
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: theme.colors.border },
                  ]}
                >
                  <Text
                    style={[styles.pillText, { color: theme.colors.mutedText }]}
                    numberOfLines={1}
                  >
                    {lessons}
                  </Text>
                </View>
              ) : null}
              {status === 'In progress' ? (
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: theme.colors.success + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: theme.colors.success },
                    ]}
                    numberOfLines={1}
                  >
                    In progress
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.chevronWrap,
            { backgroundColor: theme.colors.border },
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.mutedText}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pressed: {
    opacity: 0.96,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    padding: 16,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  description: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillText: {
    fontFamily: baseTheme.typography.medium,
    fontSize: 12,
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
