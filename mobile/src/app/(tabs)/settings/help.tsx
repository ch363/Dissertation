import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HelpContent } from '@/features/settings/components/help/HelpContent';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export default function HelpScreen() {
  const { theme } = useAppTheme();
  const handleBack = useCallback(() => router.back(), []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Back to Settings"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.colors.text }]}>Help</Text>
      </View>

      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HelpContent />
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: baseTheme.spacing.lg,
    paddingVertical: baseTheme.spacing.md,
    marginBottom: 4,
  },
  backBtn: {
    marginRight: 12,
    marginLeft: -8,
    padding: 8,
    borderRadius: 12,
  },
  screenTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: baseTheme.spacing.lg,
    paddingTop: 4,
    paddingBottom: 120,
    gap: 20,
  },
  bottomSpacer: { height: 24 },
});
