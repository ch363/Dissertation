import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../src/theme';
import { ProgressBar, Option, PrimaryButton } from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';
import { useState } from 'react';

export default function PreferredLearning() {
  const { setAnswer } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const has = prev.includes(key);
      const next = has ? prev.filter((k) => k !== key) : [...prev, key];
      return next.slice(0, 2);
    });
  };

  const options = [
    { key: 'visual', label: '👀 Seeing pictures, diagrams, or written text' },
    { key: 'auditory', label: '👂 Hearing sounds or spoken words' },
    { key: 'writing', label: '✍️ Writing/typing out answers' },
    { key: 'acting', label: '🎭 Acting it out / speaking it aloud' },
  ];

  const onNext = () => {
    setAnswer('learningStyles', selected);
    router.push('/onboarding/memory-habits');
  };

  return (
    <View style={styles.container}>
      <ProgressBar current={2} total={9} />
      <Text style={styles.title}>Preferred Ways of Learning (choose up to 2)</Text>
      {options.map((o) => (
        <Option key={o.key} label={o.label} selected={selected.includes(o.key)} onPress={() => toggle(o.key)} />
      ))}
  <PrimaryButton title="Next" onPress={onNext} disabled={selected.length === 0} />
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
