import { OptionQuestion } from './_components';
import { useOnboarding } from '../../src/onboarding/OnboardingContext';

export default function MemoryHabits() {
  const { answers, setAnswerAndSave } = useOnboarding();

  const options = [
    { key: 'spaced', icon: '🗓️', label: 'Spaced repetition (flashcards, reviews)' },
    { key: 'mnemonics', icon: '🧠', label: 'Mnemonics & stories' },
    { key: 'immersion', icon: '🌍', label: 'Context & immersion' },
    { key: 'writing', icon: '📝', label: 'Rewriting and note-taking' },
  ];

  return (
    <OptionQuestion
      step={3}
      title="How do you usually remember best?"
      options={options}
      selected={answers.memoryHabit ?? null}
      onChange={(next) => {
        const nextKey = next[0];
        if (nextKey) setAnswerAndSave('memoryHabit', nextKey);
      }}
      nextRoute="/onboarding/4_difficulty"
    />
  );
}
