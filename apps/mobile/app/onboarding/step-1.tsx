import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Link, router } from 'expo-router';
import { theme } from '../../src/theme';
import { ProgressBar, Option } from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';
import { useState } from 'react';

export default function Step1() {
  const { setAnswer } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');

  const options = [
    { key: 'travel', label: '🛫 For travel' },
    { key: 'family', label: '👨‍👩‍👧 To connect with family/friends' },
    { key: 'study', label: '🎓 For study/career' },
    { key: 'fun', label: '🎮 For fun/personal growth' },
    { key: 'other', label: '✨ Other (type in)' },
  ];

  const onNext = () => {
    setAnswer('motivation', selected === 'other' ? { key: selected, otherText } : { key: selected ?? '' });
    router.push('/onboarding/step-2');
  };
  return (
    <View style={styles.container}>
      <ProgressBar current={1} total={9} />
      <Text style={styles.title}>Motivation & Goals</Text>
      {options.map((o) => (
        <Option key={o.key} label={o.label} selected={selected === o.key} onPress={() => setSelected(o.key)} />
      ))}
      {selected === 'other' && (
        <TextInput
          style={styles.input}
          placeholder="Tell us your goal"
          value={otherText}
          onChangeText={setOtherText}
          placeholderTextColor={theme.colors.mutedText}
        />
      )}
      <Link href="#" onPress={onNext} style={styles.next}>Next</Link>
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
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  next: {
    marginTop: theme.spacing.xl,
    paddingVertical: 14,
    textAlign: 'center',
    backgroundColor: theme.colors.primary,
    color: '#fff',
    borderRadius: theme.radius.md,
  },
});
