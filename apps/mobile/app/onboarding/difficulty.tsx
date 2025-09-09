import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../src/theme';
import { ProgressBar, Option, PrimaryButton, SecondaryButton } from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';
import { useState } from 'react';

export default function Difficulty() {
  const { setAnswer } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);

  const options = [
    { key: 'easy', label: '🙂 Keep it easy' },
    { key: 'balanced', label: '⚖️ Balanced challenge' },
    { key: 'hard', label: '🔥 Push me hard' },
  ];

  const onNext = () => {
    setAnswer('difficulty', selected ?? '');
    router.push('/onboarding/gamification');
  };

  return (
    <View style={styles.container}>
      <ProgressBar current={4} total={9} />
      <Text style={styles.title}>Preferred difficulty</Text>
      {options.map((o) => (
        <Option key={o.key} label={o.label} selected={selected === o.key} onPress={() => setSelected(o.key)} />
      ))}
  <PrimaryButton title="Next" onPress={onNext} disabled={!selected} />
  <SecondaryButton title="Back" onPress={() => router.back()} />
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
