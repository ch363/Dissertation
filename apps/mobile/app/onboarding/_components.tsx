import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import type { AccessibilityRole } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/theme';

type OptionItem = { key: string; label: string; icon?: string };
type SelectedValue = string | string[] | null | undefined;

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 1;
  const raw = safeCurrent / safeTotal;
  const pct = Math.max(0, Math.min(1, Number.isFinite(raw) ? raw : 0));
  return (
    <View style={styles.barWrap}>
      <View style={[styles.barFill, { flex: pct }]} />
      <View style={{ flex: 1 - pct }} />
    </View>
  );
}

export function QuestionScreen({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const contentPaddingBottom = (footer ? theme.spacing.xl * 2.2 : theme.spacing.lg) + insets.bottom;
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, { paddingBottom: contentPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={styles.stickyWrap}>
          <View style={styles.fade} pointerEvents="none" />
          <View style={[styles.stickyInner, { paddingBottom: theme.spacing.md + insets.bottom }]}>
            {footer}
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <View
      style={styles.stepperWrap}
      accessibilityRole="header"
      accessibilityLabel={`Step ${current} of ${total}`}
    >
      <Text style={styles.stepperText}>{`Step ${current} of ${total}`}</Text>
      <ProgressBar current={current} total={total} />
    </View>
  );
}

export function Option({
  label,
  selected,
  onPress,
  icon,
  multiple,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: string; // optional emoji/icon
  multiple?: boolean; // for accessibility role
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
      accessibilityRole={(multiple ? 'checkbox' : 'radio') as AccessibilityRole}
      accessibilityState={{ checked: !!selected }}
      accessibilityLabel={label}
      hitSlop={8}
    >
      <View style={styles.optionInner}>
        <View style={styles.optionIconCol}>
          {icon ? <Text style={styles.optionIcon}>{icon}</Text> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  style,
  textStyle,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.primaryBtn, disabled && styles.btnDisabled, style]}
      accessibilityState={{ disabled }}
      accessibilityRole="button"
      hitSlop={8}
    >
      <Text style={[styles.primaryBtnText, textStyle]}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.secondaryBtn} accessibilityRole="button" hitSlop={8}>
      <Text style={styles.secondaryBtnText}>{title}</Text>
    </Pressable>
  );
}

export function StickyCTA({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>;
}

export function Spacer({ size = theme.spacing.sm }: { size?: number }) {
  return <View style={{ height: size }} />;
}

export function QuestionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.questionTitle}>{children}</Text>;
}

export function WhyWeAskLink() {
  const [open, setOpen] = React.useState(false);
  return (
    <View style={{ marginBottom: 8 }}>
      <Pressable accessibilityRole="link" onPress={() => setOpen(true)} hitSlop={8}>
        <Text style={styles.whyLink}>Why we ask?</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} />
          <View style={styles.sheet} accessibilityRole={'dialog' as AccessibilityRole}>
            <View
              style={{
                height: 4,
                width: 40,
                backgroundColor: '#ddd',
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 12,
              }}
            />
            <Text style={styles.sheetTitle}>Why we ask</Text>
            <Text style={styles.sheetBody}>
              We use your answers to tailor lessons and practice. You can change any of these later
              in Settings.
            </Text>
            <PrimaryButton title="Got it" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function OptionQuestion({
  step,
  title,
  options,
  selected,
  onChange,
  nextRoute,
  onNext,
  onSkip,
  nextLabel = 'Next',
  showSkip = true,
  totalSteps = 9,
  multiple = false,
  maxSelections,
  canProceed,
}: {
  step: number;
  title: string;
  options: OptionItem[];
  selected: SelectedValue;
  onChange: (next: string[]) => void;
  nextRoute?: string;
  onNext?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  showSkip?: boolean;
  totalSteps?: number;
  multiple?: boolean;
  maxSelections?: number;
  canProceed?: boolean;
}) {
  const selectedKeys = normalizeSelected(selected);
  const allowAdvance = typeof canProceed === 'boolean' ? canProceed : selectedKeys.length > 0;

  const goNext = React.useCallback(() => {
    if (onNext) return onNext();
    if (nextRoute) router.push(nextRoute);
  }, [nextRoute, onNext]);

  const goSkip = React.useCallback(() => {
    if (onSkip) return onSkip();
    if (nextRoute) router.push(nextRoute);
  }, [nextRoute, onSkip]);

  const handleSelect = (key: string) => {
    const next = computeNextSelection(selectedKeys, key, multiple, maxSelections);
    onChange(next);
  };

  return (
    <QuestionScreen
      footer={
        <StickyCTA>
          <PrimaryButton title={nextLabel} onPress={goNext} disabled={!allowAdvance} />
          {showSkip ? (
            <>
              <Spacer size={8} />
              <PrimaryButton title="Skip / Not sure" onPress={goSkip} />
            </>
          ) : null}
        </StickyCTA>
      }
    >
      <Stepper current={step} total={totalSteps} />
      <QuestionTitle>{title}</QuestionTitle>
      <WhyWeAskLink />
      {options.map((o) => (
        <Option
          key={o.key}
          label={o.label}
          selected={selectedKeys.includes(o.key)}
          onPress={() => handleSelect(o.key)}
          icon={o.icon}
          multiple={multiple}
        />
      ))}
    </QuestionScreen>
  );
}

export function normalizeSelected(value: SelectedValue): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

export function computeNextSelection(
  selected: string[],
  key: string,
  multiple: boolean,
  maxSelections?: number
): string[] {
  if (!multiple) return [key];
  const exists = selected.includes(key);
  let next = exists ? selected.filter((k) => k !== key) : [...selected, key];
  if (maxSelections && next.length > maxSelections) {
    next = next.slice(next.length - maxSelections);
  }
  return next;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screenContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  stepperWrap: {
    marginBottom: theme.spacing.md,
  },
  stepperText: {
    color: theme.colors.text,
    opacity: 0.7,
    marginBottom: theme.spacing.xs,
    fontSize: 14,
    fontFamily: theme.typography.regular,
  },
  questionTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 22,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  barWrap: {
    height: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  option: {
    paddingVertical: 12, // slightly reduced vertical padding
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card || '#fff',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    minHeight: 56, // >= 48x48 target
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#E9F3FF',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconCol: {
    width: 28, // fixed width so text lines up
    alignItems: 'center',
    marginRight: 8,
  },
  optionIcon: {
    fontSize: 20, // 20–24 per spec
  },
  optionText: {
    color: theme.colors.text,
    fontFamily: theme.typography.regular,
    fontSize: 16,
    includeFontPadding: false,
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
    minHeight: 48, // touch target
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
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
    minHeight: 48,
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: theme.colors.text,
    fontFamily: theme.typography.regular,
    fontSize: 16,
  },
  stickyWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: theme.colors.background || '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  },
  stickyInner: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  whyLink: {
    color: theme.colors.primary,
    fontFamily: theme.typography.regular,
    fontSize: 14,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 8,
  },
  sheetBody: {
    fontFamily: theme.typography.regular,
    fontSize: 15,
    color: theme.colors.text,
    opacity: 0.9,
    marginBottom: theme.spacing.md,
  },
});
