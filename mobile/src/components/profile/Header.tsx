import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  title: string;
  subtitle?: string;
  avatarUrl?: string | null;
  onAvatarPress?: () => void;
  right?: React.ReactNode;
};

export function ProfileHeader({ title, subtitle, avatarUrl, onAvatarPress, right }: Props) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onAvatarPress}
        hitSlop={8}
        style={styles.avatarWrap}
        accessibilityRole="button"
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.colors.border }]} />
        )}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: theme.colors.mutedText }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden' },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  title: { fontFamily: baseTheme.typography.bold, fontSize: 22 },
  subtitle: { marginTop: 2, fontFamily: baseTheme.typography.regular },
});
