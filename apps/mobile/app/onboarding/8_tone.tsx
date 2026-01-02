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

export default function Tone() {
  const { answers, setAnswerAndSave } = useOnboarding();
  const selected = answers.tone ?? null;

  const options = [
    { key: 'friendly', icon: '😊', label: 'Friendly' },
    { key: 'professional', icon: '💼', label: 'Professional' },
    { key: 'playful', icon: '🎉', label: 'Playful' },
  ];

  const onNext = () => router.push('/onboarding/9_experience-level');
  const onSkip = () => router.push('/onboarding/9_experience-level');

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
      <Stepper current={8} total={9} />
      <Text style={styles.title}>Tone of voice</Text>
      <WhyWeAskLink />
      {options.map((o) => (
        <Option
          key={o.key}
          label={o.label}
          selected={selected === o.key}
          onPress={() => setAnswerAndSave('tone', o.key)}
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
