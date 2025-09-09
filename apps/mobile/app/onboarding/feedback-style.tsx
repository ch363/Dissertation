import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../src/theme';
import { ProgressBar, Option, PrimaryButton } from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';
import { useState } from 'react';

export default function FeedbackStyle() {
  const { setAnswer } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);

  const options = [
    { key: 'gentle', label: '🌤️ Gentle encouragement' },
    { key: 'direct', label: '🧭 Direct and corrective' },
    { key: 'detailed', label: '🔍 Detailed explanations' },
  ];

  const onNext = () => {
    setAnswer('feedback', selected ?? '');
    router.push('/onboarding/session-style');
  };

  return (
    <View style={styles.container}>
      <ProgressBar current={6} total={9} />
      <Text style={styles.title}>Feedback style</Text>
      {options.map((o) => (
        <Option key={o.key} label={o.label} selected={selected === o.key} onPress={() => setSelected(o.key)} />
      ))}
  <PrimaryButton title="Next" onPress={onNext} disabled={!selected} />
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
