import { router } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';

import {
  Stepper,
  Option,
  PrimaryButton,
  StickyCTA,
  WhyWeAskLink,
  QuestionScreen,
} from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';

import { theme } from '@/theme';

export default function FeedbackStyle() {
  const { answers, setAnswerAndSave } = useOnboarding();
  const selected = answers.feedback ?? null;

  const options = [
    { key: 'gentle', icon: '🌤️', label: 'Gentle encouragement' },
    { key: 'direct', icon: '🧭', label: 'Direct and corrective' },
    { key: 'detailed', icon: '🔍', label: 'Detailed explanations' },
  ];

  const onNext = () => router.push('/onboarding/7_session-style');
  const onSkip = () => router.push('/onboarding/7_session-style');

  return (
    <QuestionScreen
      footer={
        <StickyCTA>
          <PrimaryButton title="Next" onPress={onNext} disabled={!selected} />
          <View style={{ height: 8 }} />
          <PrimaryButton title="Skip / Not sure" onPress={onSkip} />
        </StickyCTA>
      }
    >
      <Stepper current={6} total={9} />
      <Text style={styles.title}>Feedback style</Text>
      <WhyWeAskLink />
      {options.map((o) => (
        <Option
          key={o.key}
          label={o.label}
          selected={selected === o.key}
          onPress={() => setAnswerAndSave('feedback', o.key)}
          icon={o.icon}
        />
      ))}
    </QuestionScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: theme.typography.semiBold,
    fontSize: 22,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  // next button styles moved to shared components
});
