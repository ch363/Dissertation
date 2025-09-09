import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../src/theme';
import { ProgressBar, Option, PrimaryButton } from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';
import { useState } from 'react';

export default function ExperienceLevel() {
  const { setAnswer } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);

  const options = [
    { key: 'beginner', label: '🌱 Beginner' },
    { key: 'intermediate', label: '🌿 Intermediate' },
    { key: 'advanced', label: '🌳 Advanced' },
  ];

  const onFinish = () => {
    setAnswer('experience', selected ?? '');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <ProgressBar current={9} total={9} />
      <Text style={styles.title}>What’s your experience level?</Text>
      {options.map((o) => (
        <Option key={o.key} label={o.label} selected={selected === o.key} onPress={() => setSelected(o.key)} />
      ))}
  <PrimaryButton title="Finish" onPress={onFinish} disabled={!selected} />
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
