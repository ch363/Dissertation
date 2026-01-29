import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui';
import { routes } from '@/services/navigation/routes';
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
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
    </View>
  );
}

function FaqItem({
  question,
  answer,
  theme,
  isLast,
}: {
  question: string;
  answer: string;
  theme: ReturnType<typeof useAppTheme>['theme'];
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.faqItem,
        { borderColor: theme.colors.border },
        isLast && styles.faqItemLast,
      ]}
    >
      <Text style={[styles.faqQuestion, { color: theme.colors.text }]}>{question}</Text>
      <Text style={[styles.faqAnswer, { color: theme.colors.mutedText }]}>{answer}</Text>
    </View>
  );
}

export default function HelpScreen() {
  const { theme } = useAppTheme();
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <IconButton
          accessibilityLabel="Back to Settings"
          onPress={handleBack}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </IconButton>
        <Text style={[styles.screenTitle, { color: theme.colors.text }]}>Help & FAQ</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <SectionHeader title="Getting started" icon="book-outline" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.instructionRow}>
            <View style={[styles.stepBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.stepText}>1</Text>
            </View>
            <Text style={[styles.instructionBody, { color: theme.colors.text }]}>
              <Text style={styles.instructionBold}>Home</Text> — See your streak, today’s plan and suggested next steps. Tap a lesson or “Start session” to learn.
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.instructionRow}>
            <View style={[styles.stepBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <Text style={[styles.instructionBody, { color: theme.colors.text }]}>
              <Text style={styles.instructionBold}>Learn</Text> — Browse lessons and your learning path. Start a lesson or head to Review to practise vocabulary.
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.instructionRow}>
            <View style={[styles.stepBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <Text style={[styles.instructionBody, { color: theme.colors.text }]}>
              <Text style={styles.instructionBold}>Sessions</Text> — Complete exercises (e.g. translate, listen, type). Your progress and reviews are adapted over time.
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.instructionRow}>
            <View style={[styles.stepBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.stepText}>4</Text>
            </View>
            <Text style={[styles.instructionBody, { color: theme.colors.text }]}>
              <Text style={styles.instructionBold}>Profile</Text> — View stats, skills and review history. Edit your profile and preferences from Settings.
            </Text>
          </View>
        </View>

        {/* Tips */}
        <SectionHeader title="Tips for success" icon="bulb-outline" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={[styles.tipText, { color: theme.colors.text }]}>
              Do a little every day — short sessions help retention more than rare long ones.
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={[styles.tipText, { color: theme.colors.text }]}>
              Keep reviews on — the app schedules them based on how well you know each item.
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={[styles.tipText, { color: theme.colors.text }]}>
              Use Speech in Settings to hear pronunciations and tune speed to your preference.
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={[styles.tipText, { color: theme.colors.text }]}>
              Turn on Adaptivity so difficulty and review timing adjust to your performance.
            </Text>
          </View>
        </View>

        {/* FAQs */}
        <SectionHeader title="Frequently asked questions" icon="help-circle-outline" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <FaqItem
            theme={theme}
            question="How does review work?"
            answer="Fluentia uses spaced repetition: items you struggle with appear more often, and ones you know well appear less often. Do your scheduled reviews on the Learn tab to keep vocabulary strong."
          />
          <FaqItem
            theme={theme}
            question="Can I change session length or exercise types?"
            answer="Yes. Go to Settings → Session defaults to set your preferred session length and which exercise types (e.g. translate, listen) you want in each session."
          />
          <FaqItem
            theme={theme}
            question="What is Adaptivity?"
            answer="When Adaptivity is on, the app adjusts lesson difficulty and when reviews are due based on your answers. Turn it off in Settings → Learning if you prefer fixed schedules."
          />
          <FaqItem
            theme={theme}
            question="Where can I see my progress?"
            answer="Profile shows your overall progress, skills and review history. You can also see today’s plan and streak on Home."
          />
          <FaqItem
            theme={theme}
            question="How do I sign out?"
            answer="Open Settings, scroll to the Account section and tap Sign out. You’ll need to sign in again to use your account on this device."
            isLast
          />
        </View>

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
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: baseTheme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { marginRight: 8 },
  screenTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
  },
  headerSpacer: { width: 36, height: 36 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: baseTheme.spacing.lg,
    paddingTop: baseTheme.spacing.lg,
    paddingBottom: baseTheme.spacing.xl,
    gap: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: baseTheme.spacing.md,
    overflow: 'hidden',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  instructionBody: {
    flex: 1,
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  instructionBold: {
    fontFamily: baseTheme.typography.semiBold,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
    marginLeft: 0,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  faqItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  faqQuestion: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
    marginBottom: 4,
  },
  faqAnswer: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  faqItemLast: {
    borderBottomWidth: 0,
  },
  bottomSpacer: { height: 24 },
});
