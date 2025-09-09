import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../src/theme';

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.max(0, Math.min(1, current / total));
  return (
    <View style={styles.barWrap}>
      <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

export function Option({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    height: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#E9F3FF',
  },
  optionText: {
    color: theme.colors.text,
    fontFamily: theme.typography.regular,
  },
  optionTextSelected: {
    fontFamily: theme.typography.semiBold,
  },
});
