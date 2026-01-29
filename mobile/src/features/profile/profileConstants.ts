/** Skill type to display config (name, icon, gradient colors) for profile mastery UI */
export const SKILL_CONFIG: Record<
  string,
  { name: string; icon: string; colors: [string, string] }
> = {
  VOCAB: { name: 'Vocabulary', icon: '📚', colors: ['#A855F7', '#9333EA'] },
  GRAMMAR: { name: 'Grammar', icon: '✍️', colors: ['#22C55E', '#16A34A'] },
  LISTENING: { name: 'Listening', icon: '🎧', colors: ['#3B82F6', '#2563EB'] },
  SPEAKING: { name: 'Speaking', icon: '🎤', colors: ['#F59E0B', '#D97706'] },
  READING: { name: 'Reading', icon: '📖', colors: ['#EC4899', '#DB2777'] },
  WRITING: { name: 'Writing', icon: '✏️', colors: ['#8B5CF6', '#7C3AED'] },
};

export const DEFAULT_SKILL_CONFIG: { name: string; icon: string; colors: [string, string] } = {
  name: '',
  icon: '📖',
  colors: ['#3B82F6', '#2563EB'],
};
