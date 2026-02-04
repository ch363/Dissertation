/**
 * FAQ data and list component. Used on the FAQ screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export const FAQ_DATA = [
  {
    question: 'How does review work?',
    answer:
      'Fluentia uses spaced repetition: items you struggle with appear more often, and ones you know well appear less often. Do your scheduled reviews on the Learn tab to keep vocabulary strong.',
  },
  {
    question: 'Can I change session length or exercise types?',
    answer:
      'Yes. Go to Settings → Session defaults to set your preferred session length and which exercise types (e.g. translate, listen) you want in each session.',
  },
  {
    question: 'What is Adaptivity?',
    answer:
      'When Adaptivity is on, the app adjusts lesson difficulty and when reviews are due based on your answers. Turn it off in Settings → Learning if you prefer fixed schedules.',
  },
  {
    question: 'Where can I see my progress?',
    answer:
      "Profile shows your overall progress, skills and review history. You can also see today's plan and streak on Home.",
  },
  {
    question: 'How is my streak calculated?',
    answer:
      'Your streak counts consecutive days where you complete at least one learning activity (e.g. a lesson or a review session). Missing a day resets the streak to zero, but you can start building it again the next day.',
  },
  {
    question: 'What exercise types are there?',
    answer:
      'Sessions can include multiple choice, translation (type or speak), fill-in-the-blank, listening, and pronunciation. You choose which types to enable in Settings → Session defaults.',
  },
  {
    question: 'How does pronunciation checking work?',
    answer:
      'When you do speaking exercises, Fluentia can check your pronunciation using speech recognition. Make sure microphone access is allowed and try a quiet environment. You can adjust speech settings (e.g. playback speed) in Settings → Speech.',
  },
  {
    question: "Why isn't the microphone or speech working?",
    answer:
      'Check that the app has microphone permission in your device settings. On iOS Simulator, speech input may not be available — use a real device for pronunciation practice. Restarting the app or checking Settings → Speech can also help.',
  },
  {
    question: "What's the difference between 'Start session' and doing a lesson?",
    answer:
      "Lessons introduce new content step by step. 'Start session' runs a practice session that mixes review items and optional new material based on your plan. Both count toward your streak and progress.",
  },
  {
    question: 'Can I redo a lesson or skip one?',
    answer:
      'You can replay or revisit lessons from the Learn tab. Progress is saved so you can continue where you left off; the app is designed so you can move at your own pace.',
  },
  {
    question: 'How do I change my password or email?',
    answer:
      "Use the sign-in screen's 'Forgot password?' to receive a reset link. Account details like email are managed through your auth provider; sign out and back in from Settings if you've updated them elsewhere.",
  },
  {
    question: 'How do I sign out?',
    answer:
      "Open Settings, scroll to the Account section and tap Sign out. You'll need to sign in again to use your account on this device.",
  },
  {
    question: 'Is my data private?',
    answer:
      "Your progress and learning data are stored in your account and used only to personalize your experience (e.g. spaced repetition, recommendations). We don't sell your data. See the app's privacy policy for full details.",
  },
] as const;

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
        faqStyles.faqItem,
        { borderColor: theme.colors.border },
        isLast && faqStyles.faqItemLast,
      ]}
    >
      <TouchableOpacity onPress={onToggle} style={faqStyles.faqButton} activeOpacity={0.7}>
        <Text style={[faqStyles.faqQuestion, { color: theme.colors.text }]}>{question}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.mutedText}
          style={faqStyles.faqChevron}
        />
      </TouchableOpacity>
      {isExpanded && (
        <Text style={[faqStyles.faqAnswer, { color: theme.colors.mutedText }]}>{answer}</Text>
      )}
    </View>
  );
}

export function FaqContent() {
  const { theme } = useAppTheme();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const toggleFAQ = useCallback((index: number) => {
    setExpandedFAQ((prev) => (prev === index ? null : index));
  }, []);

  return (
    <View
      style={[
        faqStyles.card,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
    >
      {FAQ_DATA.map((faq, index) => (
        <FaqItem
          key={index}
          theme={theme}
          question={faq.question}
          answer={faq.answer}
          isLast={index === FAQ_DATA.length - 1}
          isExpanded={expandedFAQ === index}
          onToggle={() => toggleFAQ(index)}
        />
      ))}
    </View>
  );
}

const faqStyles = StyleSheet.create({
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
});
