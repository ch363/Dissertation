import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/modules/settings';
import { theme as baseTheme } from '@/theme';

export default function EditProfileScreen() {
  const { theme } = useAppTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Edit Profile</Text>
        <Text style={{ color: theme.colors.mutedText }}>
          TODO: Add fields to change display name, avatar, and bio.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: baseTheme.colors.background },
  container: { flex: 1, padding: baseTheme.spacing.lg },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    marginBottom: baseTheme.spacing.lg,
  },
});
