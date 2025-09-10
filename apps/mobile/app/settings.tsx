import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { theme as baseTheme } from '../src/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '../src/providers/ThemeProvider';

export default function SettingsScreen() {
  const { theme, isDark, setMode } = useAppTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Top-right back arrow to return to Home */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          hitSlop={12}
          onPress={() => router.replace('/(tabs)/home')}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.mutedText} />
        </Pressable>

        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
        <View style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={(v) => setMode(v ? 'dark' : 'light')}
            trackColor={{ true: theme.colors.primary }}
          />
        </View>
        <View style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Notifications</Text>
          <Switch value={true} onValueChange={() => {}} trackColor={{ true: theme.colors.primary }} />
        </View>
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
