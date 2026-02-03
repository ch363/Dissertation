import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';

import { FaqContent } from '@/features/settings/components/faq/FaqContent';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

function SectionHeader({
  title,
  icon,
  theme,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme: ReturnType<typeof useAppTheme>['theme'];
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={[styles.iconBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
    </View>
  );
}

export default function FaqScreen() {
  const { theme } = useAppTheme();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const handleBack = useCallback(() => {
    if (returnTo && typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.includes('/settings/faq')) {
      router.replace(returnTo as any);
    } else {
      router.back();
    }
  }, [returnTo]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: theme.colors.text }]}>FAQ</Text>
      </View>

      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Frequently asked" icon="help-circle-outline" theme={theme} />
        <FaqContent />
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  bottomSpacer: { height: 24 },
});
