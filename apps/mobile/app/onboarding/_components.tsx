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

export function PrimaryButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.primaryBtn, disabled && styles.btnDisabled]} accessibilityState={{ disabled }}>
      <Text style={styles.primaryBtnText}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.secondaryBtn}>
      <Text style={styles.secondaryBtnText}>{title}</Text>
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
  primaryBtn: {
    marginTop: theme.spacing.sm,
    paddingVertical: 14,
    textAlign: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  secondaryBtn: {
    marginTop: theme.spacing.xl,
    paddingVertical: 14,
    textAlign: 'center',
    backgroundColor: 'transparent',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: theme.colors.text,
    fontFamily: theme.typography.regular,
  },
});
