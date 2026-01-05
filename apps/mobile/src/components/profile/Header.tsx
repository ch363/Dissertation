import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';

import { theme as baseTheme } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  avatarUrl?: string | null;
  onAvatarPress?: () => void;
  right?: React.ReactNode;
};

export function ProfileHeader({ title, subtitle, avatarUrl, onAvatarPress, right }: Props) {
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
          <View style={[styles.avatar, styles.avatarPlaceholder]} />
        )}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden' },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: { backgroundColor: baseTheme.colors.border },
  title: { fontFamily: baseTheme.typography.bold, fontSize: 22, color: baseTheme.colors.text },
  subtitle: { color: baseTheme.colors.mutedText, marginTop: 2 },
});
