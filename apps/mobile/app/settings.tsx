import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { theme as baseTheme } from '../src/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useCallback } from 'react';
import { useAppTheme } from '../src/providers/ThemeProvider';
import { supabase } from '../src/lib/supabase';

export default function SettingsScreen() {
  const { theme, isDark, setMode } = useAppTheme();
  const navigation = useNavigation();
  // If this screen is rendered inside tab bar, no custom back button
  const showBack = typeof navigation?.canGoBack === 'function' && navigation.canGoBack();

  const handleBack = useCallback(() => {
    try {
      // Prefer going back if we have a stack history
      // @ts-ignore - navigation type from expo-router bridges React Navigation
      if (navigation?.canGoBack?.() === true) {
        // @ts-ignore
        navigation.goBack();
        return;
      }
    } catch {}
    try {
      router.replace('/(tabs)/home');
    } catch {
      router.push('/(tabs)/home');
    }
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Top-right back arrow to return to Home */}
  {showBack && (
  <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          hitSlop={12}
          onPress={handleBack}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.mutedText} />
  </Pressable>
  )}

        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
        <View style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={(v) => setMode(v ? 'dark' : 'light')}
            trackColor={{ true: theme.colors.primary }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Speech Settings"
          onPress={() => router.push('/speech')}
          style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <Text style={[styles.label, { color: theme.colors.text }]}>Speech</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
        </Pressable>
        <View style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Notifications</Text>
          <Switch value={true} onValueChange={() => {}} trackColor={{ true: theme.colors.primary }} />
        </View>

        {/* Developer tools */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open DB Health"
          onPress={() => router.push('/db-health')}
          style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <Text style={[styles.label, { color: theme.colors.text }]}>DB Health</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace('/');
          }}
          style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <Text style={[styles.label, { color: theme.colors.text }]}>Sign out</Text>
          <Ionicons name="log-out-outline" size={18} color={theme.colors.mutedText} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: baseTheme.colors.background },
  container: { flex: 1, backgroundColor: baseTheme.colors.background, padding: baseTheme.spacing.lg },
  backBtn: {
    position: 'absolute',
    right: 16,
    top: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  zIndex: 10,
  },
  title: { fontFamily: baseTheme.typography.bold, fontSize: 22, color: baseTheme.colors.text, marginBottom: baseTheme.spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: baseTheme.colors.card,
    borderRadius: baseTheme.radius.md,
    padding: baseTheme.spacing.md,
    marginBottom: baseTheme.spacing.md,
    borderWidth: 1,
    borderColor: baseTheme.colors.border,
  },
  label: { fontFamily: baseTheme.typography.regular, color: baseTheme.colors.text },
});
