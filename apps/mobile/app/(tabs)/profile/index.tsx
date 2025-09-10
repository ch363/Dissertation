import { View, Text, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme as baseTheme } from '../../../src/theme';
import { useAppTheme } from '../../../src/providers/ThemeProvider';

export default function Profile() {
  const { theme } = useAppTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Profile & Settings</Text>
  {/* Theme toggles moved to Settings */}
        <View style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Adaptivity</Text>
          <Switch value={true} onValueChange={() => {}} trackColor={{ true: theme.colors.primary }} />
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
  container: {
    flex: 1,
    backgroundColor: baseTheme.colors.background,
    padding: baseTheme.spacing.lg,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    color: baseTheme.colors.text,
    marginBottom: baseTheme.spacing.lg,
  },
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
  label: {
    fontFamily: baseTheme.typography.regular,
    color: baseTheme.colors.text,
  },
});
