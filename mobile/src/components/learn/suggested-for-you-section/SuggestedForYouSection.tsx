import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ModuleSuggestion } from '@/services/api/learn';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  suggestion: ModuleSuggestion;
  onPress: () => void;
};

export function SuggestedForYouSection({ suggestion, onPress }: Props) {
  const { theme } = useAppTheme();
  const { module: mod, reason } = suggestion;
  const imageUrl = mod.imageUrl ?? null;

  const gradientColors: [string, string] = [theme.colors.primary, theme.colors.ctaCardAccent];

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Suggested for you</Text>
          <View style={[styles.badge, { backgroundColor: theme.colors.primary + '18' }]}>
            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>Personalised</Text>
          </View>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View course: ${mod.title}. ${reason}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            opacity: pressed ? 0.97 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        <View style={styles.cardInner}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.coverImage}
              resizeMode="cover"
              accessible={false}
            />
          ) : null}
          <LinearGradient
            colors={imageUrl ? ['transparent', 'rgba(0,0,0,0.85)'] : gradientColors}
            style={styles.gradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            <View style={styles.content}>
              <View style={[styles.iconWrap, { backgroundColor: theme.colors.ctaCardAccent }]}>
                <Ionicons name="sparkles" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.moduleTitle, { color: '#FFFFFF' }]} numberOfLines={2}>
                {mod.title}
              </Text>
              <Text style={[styles.reason, { color: 'rgba(255,255,255,0.92)' }]} numberOfLines={2}>
                {reason}
              </Text>
              <View style={styles.ctaRow}>
                <Text style={styles.ctaText}>View course</Text>
                <View style={[styles.arrowWrap, { backgroundColor: theme.colors.ctaCardAccent }]}>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: baseTheme.typography.semiBold,
    letterSpacing: 0.3,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cardInner: {
    minHeight: 200,
    position: 'relative',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    minHeight: 200,
    justifyContent: 'flex-end',
    padding: 24,
  },
  content: {
    gap: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  moduleTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  reason: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 2,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  ctaText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  arrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
