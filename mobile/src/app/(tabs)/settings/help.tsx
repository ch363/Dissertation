import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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

function FaqItem({
  question,
  answer,
  theme,
  isLast,
  isExpanded,
  onToggle,
}: {
  question: string;
  answer: string;
  theme: ReturnType<typeof useAppTheme>['theme'];
  isLast?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View
      style={[
        styles.faqItem,
        { borderColor: theme.colors.border },
        isLast && styles.faqItemLast,
      ]}
    >
      <TouchableOpacity
        onPress={onToggle}
        style={styles.faqButton}
        activeOpacity={0.7}
      >
        <Text style={[styles.faqQuestion, { color: theme.colors.text }]}>{question}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.mutedText}
          style={styles.faqChevron}
        />
      </TouchableOpacity>
      {isExpanded && (
        <Text style={[styles.faqAnswer, { color: theme.colors.mutedText }]}>{answer}</Text>
      )}
    </View>
  );
}

export default function HelpScreen() {
  const { theme } = useAppTheme();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  
  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const faqData = [
    {
      question: "How does review work?",
      answer: "Fluentia uses spaced repetition: items you struggle with appear more often, and ones you know well appear less often. Do your scheduled reviews on the Learn tab to keep vocabulary strong.",
    },
    {
      question: "Can I change session length or exercise types?",
      answer: "Yes. Go to Settings → Session defaults to set your preferred session length and which exercise types (e.g. translate, listen) you want in each session.",
    },
    {
      question: "What is Adaptivity?",
      answer: "When Adaptivity is on, the app adjusts lesson difficulty and when reviews are due based on your answers. Turn it off in Settings → Learning if you prefer fixed schedules.",
    },
    {
      question: "Where can I see my progress?",
      answer: "Profile shows your overall progress, skills and review history. You can also see today's plan and streak on Home.",
    },
    {
      question: "How do I sign out?",
      answer: "Open Settings, scroll to the Account section and tap Sign out. You'll need to sign in again to use your account on this device.",
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
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
        <Text style={[styles.screenTitle, { color: theme.colors.text }]}>Help & FAQ</Text>
      </View>

      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Getting Started */}
        <SectionHeader title="Getting started" icon="book-outline" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.instructionRow}>
            <LinearGradient
              colors={[theme.colors.primary, `${theme.colors.primary}DD`, `${theme.colors.primary}BB`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.stepBadge}
            >
              <Text style={styles.stepText}>1</Text>
            </LinearGradient>
            <View style={styles.instructionContent}>
              <Text style={[styles.instructionTitle, { color: theme.colors.text }]}>Home</Text>
              <Text style={[styles.instructionBody, { color: theme.colors.mutedText }]}>
                See your streak, today's plan and suggested next steps. Tap a lesson or 'Start session' to learn.
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.instructionRow}>
            <LinearGradient
              colors={[theme.colors.primary, `${theme.colors.primary}DD`, `${theme.colors.primary}BB`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.stepBadge}
            >
              <Text style={styles.stepText}>2</Text>
            </LinearGradient>
            <View style={styles.instructionContent}>
              <Text style={[styles.instructionTitle, { color: theme.colors.text }]}>Learn</Text>
              <Text style={[styles.instructionBody, { color: theme.colors.mutedText }]}>
                Browse lessons and your learning path. Start a lesson or head to Review to practise vocabulary.
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.instructionRow}>
            <LinearGradient
              colors={[theme.colors.primary, `${theme.colors.primary}DD`, `${theme.colors.primary}BB`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.stepBadge}
            >
              <Text style={styles.stepText}>3</Text>
            </LinearGradient>
            <View style={styles.instructionContent}>
              <Text style={[styles.instructionTitle, { color: theme.colors.text }]}>Sessions</Text>
              <Text style={[styles.instructionBody, { color: theme.colors.mutedText }]}>
                Complete exercises (e.g. translate, listen, type). Your progress and reviews are adapted over time.
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.instructionRow}>
            <LinearGradient
              colors={[theme.colors.primary, `${theme.colors.primary}DD`, `${theme.colors.primary}BB`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.stepBadge}
            >
              <Text style={styles.stepText}>4</Text>
            </LinearGradient>
            <View style={styles.instructionContent}>
              <Text style={[styles.instructionTitle, { color: theme.colors.text }]}>Profile</Text>
              <Text style={[styles.instructionBody, { color: theme.colors.mutedText }]}>
                View stats, skills and review history. Edit your profile and preferences from Settings.
              </Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <SectionHeader title="Tips for success" icon="sparkles-outline" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {[
            "Do a little every day — short sessions help retention more than rare long ones.",
            "Keep reviews on — the app schedules them based on how well you know each item.",
            "Use Speech in Settings to hear pronunciations and tune speed to your level.",
          ].map((tip, index, arr) => (
            <View key={index}>
              <View style={styles.tipRow}>
                <View style={[styles.tipDot, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <View style={[styles.tipDotInner, { backgroundColor: theme.colors.primary }]} />
                </View>
                <Text style={[styles.tipText, { color: theme.colors.mutedText }]}>
                  {tip}
                </Text>
              </View>
              {index < arr.length - 1 && <View style={[styles.tipDivider, { backgroundColor: theme.colors.border }]} />}
            </View>
          ))}
        </View>

        {/* FAQs */}
        <SectionHeader title="Frequently asked" icon="help-circle-outline" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {faqData.map((faq, index) => (
            <FaqItem
              key={index}
              theme={theme}
              question={faq.question}
              answer={faq.answer}
              isLast={index === faqData.length - 1}
              isExpanded={expandedFAQ === index}
              onToggle={() => toggleFAQ(index)}
            />
          ))}
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
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    overflow: 'hidden',
    shadowColor: '#0D1B2A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  stepText: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  instructionContent: {
    flex: 1,
    paddingTop: 4,
  },
  instructionTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15.5,
    lineHeight: 20,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  instructionBody: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 20,
    opacity: 0.6,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingVertical: 4,
  },
  tipDot: {
    width: 28,
    height: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tipText: {
    flex: 1,
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    lineHeight: 23,
    paddingTop: 2,
  },
  tipDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
    opacity: 0.4,
  },
  faqItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  faqButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15.5,
    lineHeight: 22,
    paddingRight: 16,
    letterSpacing: -0.2,
  },
  faqChevron: {
    marginTop: 2,
  },
  faqAnswer: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    lineHeight: 23,
    paddingBottom: 20,
  },
  faqItemLast: {
    borderBottomWidth: 0,
  },
  bottomSpacer: { height: 24 },
});
