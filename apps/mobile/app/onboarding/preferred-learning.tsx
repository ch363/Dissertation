import { router } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

import { Stepper, Option, PrimaryButton, StickyCTA, WhyWeAskLink } from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';

import { theme } from '@/theme';

export default function PreferredLearning() {
  const { answers, setAnswerAndSave } = useOnboarding();
  const selected = answers.learningStyles ?? [];

  const toggle = (key: string) => {
    const has = selected.includes(key);
    const next = (has ? selected.filter((k) => k !== key) : [...selected, key]).slice(0, 2);
    setAnswerAndSave('learningStyles', next);
  };

  const options = [
    { key: 'visual', icon: '👀', label: 'Seeing pictures, diagrams, or written text' },
    { key: 'auditory', icon: '👂', label: 'Hearing sounds or spoken words' },
    { key: 'writing', icon: '✍️', label: 'Writing/typing out answers' },
    { key: 'acting', icon: '🎭', label: 'Acting it out / speaking it aloud' },
  ];

  const onNext = () => router.push('/onboarding/memory-habits');
  const onSkip = () => router.push('/onboarding/memory-habits');

  return (
    <View style={styles.container}>
      <Stepper current={2} total={9} />
      <Text style={styles.title}>Preferred Ways of Learning (choose up to 2)</Text>
      <WhyWeAskLink />
      {options.map((o) => (
        <Option
          key={o.key}
          label={o.label}
          selected={selected.includes(o.key)}
          onPress={() => toggle(o.key)}
          icon={o.icon}
          multiple
        />
      ))}
      <StickyCTA>
        <PrimaryButton title="Next" onPress={onNext} disabled={selected.length === 0} />
        <View style={{ height: 8 }} />
        <PrimaryButton title="Skip / Not sure" onPress={onSkip} />
      </StickyCTA>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.typography.semiBold,
    fontSize: 22,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  // next button styles moved to shared components
});
