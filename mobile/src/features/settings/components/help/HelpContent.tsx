/**
 * Shared Help content: Getting started + Tips.
 * Used on the Settings Help screen and the Onboarding Help screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
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
    <View style={helpStyles.sectionHeaderRow}>
      <View style={[helpStyles.iconBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <Text style={[helpStyles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
    </View>
  );
}

export function HelpContent() {
  const { theme } = useAppTheme();

  return (
    <>
      {/* Getting Started */}
      <SectionHeader title="Getting started" icon="book-outline" theme={theme} />
      <View style={[helpStyles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={helpStyles.instructionRow}>
          <LinearGradient
            colors={[theme.colors.primary, `${theme.colors.primary}DD`, `${theme.colors.primary}BB`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={helpStyles.stepBadge}
          >
            <Text style={helpStyles.stepText}>1</Text>
          </LinearGradient>
          <View style={helpStyles.instructionContent}>
            <Text style={[helpStyles.instructionTitle, { color: theme.colors.text }]}>Home</Text>
            <Text style={[helpStyles.instructionBody, { color: theme.colors.mutedText }]}>
              See your streak, today's plan and suggested next steps. Tap a lesson or 'Start session' to learn.
            </Text>
          </View>
        </View>
        <View style={[helpStyles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={helpStyles.instructionRow}>
          <LinearGradient
            colors={[theme.colors.primary, `${theme.colors.primary}DD`, `${theme.colors.primary}BB`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={helpStyles.stepBadge}
          >
            <Text style={helpStyles.stepText}>2</Text>
          </LinearGradient>
          <View style={helpStyles.instructionContent}>
            <Text style={[helpStyles.instructionTitle, { color: theme.colors.text }]}>Learn</Text>
            <Text style={[helpStyles.instructionBody, { color: theme.colors.mutedText }]}>
              Browse lessons and your learning path. Start a lesson or head to Review to practise vocabulary.
            </Text>
          </View>
        </View>
        <View style={[helpStyles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={helpStyles.instructionRow}>
          <LinearGradient
            colors={[theme.colors.primary, `${theme.colors.primary}DD`, `${theme.colors.primary}BB`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={helpStyles.stepBadge}
          >
            <Text style={helpStyles.stepText}>3</Text>
          </LinearGradient>
          <View style={helpStyles.instructionContent}>
            <Text style={[helpStyles.instructionTitle, { color: theme.colors.text }]}>Sessions</Text>
            <Text style={[helpStyles.instructionBody, { color: theme.colors.mutedText }]}>
              Complete exercises (e.g. translate, listen, type). Your progress and reviews are adapted over time.
            </Text>
          </View>
        </View>
        <View style={[helpStyles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={helpStyles.instructionRow}>
          <LinearGradient
            colors={[theme.colors.primary, `${theme.colors.primary}DD`, `${theme.colors.primary}BB`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={helpStyles.stepBadge}
          >
            <Text style={helpStyles.stepText}>4</Text>
          </LinearGradient>
          <View style={helpStyles.instructionContent}>
            <Text style={[helpStyles.instructionTitle, { color: theme.colors.text }]}>Profile</Text>
            <Text style={[helpStyles.instructionBody, { color: theme.colors.mutedText }]}>
              View stats, skills and review history. Edit your profile and preferences from Settings.
            </Text>
          </View>
        </View>
      </View>

      {/* Tips */}
      <SectionHeader title="Tips for success" icon="sparkles-outline" theme={theme} />
      <View style={[helpStyles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {[
          "Do a little every day — short sessions help retention more than rare long ones.",
          "Keep reviews on — the app schedules them based on how well you know each item.",
          "Use Speech in Settings to hear pronunciations and tune speed to your level.",
        ].map((tip, index, arr) => (
          <View key={index}>
            <View style={helpStyles.tipRow}>
              <View style={[helpStyles.tipDot, { backgroundColor: `${theme.colors.primary}15` }]}>
                <View style={[helpStyles.tipDotInner, { backgroundColor: theme.colors.primary }]} />
              </View>
              <Text style={[helpStyles.tipText, { color: theme.colors.mutedText }]}>{tip}</Text>
            </View>
            {index < arr.length - 1 && (
              <View style={[helpStyles.tipDivider, { backgroundColor: theme.colors.border }]} />
            )}
          </View>
        ))}
      </View>
    </>
  );
}

const helpStyles = StyleSheet.create({
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
});
