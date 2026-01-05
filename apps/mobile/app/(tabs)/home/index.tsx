import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCompletedModules } from '../../../src/lib/progress';
import { useAppTheme } from '../../../src/providers/ThemeProvider';

import { theme as baseTheme } from '@/theme';

export default function HomeScreen() {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const done = await getCompletedModules();
      setCompleted(done);
    })();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Curved top background */}
        <View style={[styles.topBg, { backgroundColor: isDark ? '#0F1C2A' : '#EAF4FF' }]} />

        {/* Floating settings button at the top-right */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Settings"
          onPress={() => router.push('/settings')}
          hitSlop={12}
          style={styles.settingsFloating}
        >
          <Ionicons name="settings-outline" size={22} color={theme.colors.mutedText} />
        </Pressable>

        {/* Centered logo + title */}
        <View style={[styles.logoRow, { marginTop: Math.max(insets.top, 12) + 8 }]}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoXL}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.brand, { color: theme.colors.text }]}>Fluentia</Text>

        {/* Modules list */}
        <ModuleList
          completed={completed}
          onLocked={() => Alert.alert('Locked', 'Complete the previous module to unlock this one.')}
        />
      </View>
    </SafeAreaView>
  );
}

function ModuleList({ completed, onLocked }: { completed: string[]; onLocked: () => void }) {
  const { isDark } = useAppTheme();
  const modules = [
    { title: 'Basics', slug: 'basics', icon: 'star' as const },
    { title: 'Common Phrases', slug: 'common-phrases', icon: 'ellipse' as const },
    { title: 'Travel', slug: 'travel', icon: 'ellipse' as const },
    { title: 'Food', slug: 'food', icon: 'lock-closed' as const },
  ];

  const isUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevSlug = modules[index - 1].slug;
    return completed.includes(prevSlug);
  };

  return (
    <View style={{ marginTop: baseTheme.spacing.lg }}>
      {modules.map((m, idx) => {
        const unlocked = isUnlocked(idx);
        const disabled = !unlocked;
        return (
          <Pressable
            key={m.slug}
            onPress={() => (disabled ? onLocked() : router.push(`/course/${m.slug}`))}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            style={[
              styles.modulePill,
              { backgroundColor: isDark ? 'rgba(70,120,150,0.4)' : '#B7EBFF' },
              disabled && styles.modulePillLocked,
            ]}
          >
            <View
              style={[
                styles.moduleIconCircle,
                { backgroundColor: isDark ? '#27566c' : '#8DE0F7' },
                disabled && { opacity: 0.5 },
              ]}
            >
              <Ionicons name={m.icon} size={18} color="#0E607D" />
            </View>
            <Text
              style={[
                styles.moduleTitle,
                { color: isDark ? '#D6E1EA' : '#0D1B2A' },
                disabled && { opacity: 0.7 },
              ]}
            >
              {m.title}
            </Text>
            <View style={styles.moduleShine} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: baseTheme.colors.background,
    paddingHorizontal: baseTheme.spacing.lg,
    paddingTop: baseTheme.spacing.lg,
  },
  // Background for the top section
  topBg: {
    position: 'absolute',
    top: -220,
    right: -160,
    width: 480,
    height: 360,
    backgroundColor: '#EAF4FF',
    borderBottomLeftRadius: 280,
    borderBottomRightRadius: 280,
    transform: [{ rotate: '18deg' }],
  },
  logoRow: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoXL: { width: 96, height: 96, marginTop: 0 },
  settingsFloating: {
    position: 'absolute',
    right: 16,
    top: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  brand: {
    marginTop: 8,
    fontFamily: baseTheme.typography.bold,
    fontSize: 34,
    color: baseTheme.colors.text,
    textAlign: 'center',
  },
  flowBackdrop: { position: 'absolute', left: 0, right: 0, top: 140, bottom: 0 },
  pathContainer: { marginTop: baseTheme.spacing.lg, height: 320, width: '100%' },
  node: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#2FA9C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  nodeAccent: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#6AD2E9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  floatingBookmark: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CBE6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modulePill: {
    marginHorizontal: 0,
    marginVertical: 10,
    backgroundColor: '#B7EBFF',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#006D8F',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    overflow: 'hidden',
  },
  modulePillLocked: {
    backgroundColor: 'rgba(183,235,255,0.5)',
  },
  moduleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8DE0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  moduleTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 20,
    color: '#0D1B2A',
  },
  moduleShine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '55%',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});
