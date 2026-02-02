import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Dimensions } from 'react-native';
import type { AccessibilityRole } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrollView } from '@/components/ui';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme } from '@/services/theme/tokens';

type OptionItem = {
  key: string;
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap | string;
};
type SelectedValue = string | string[] | null | undefined;

function calculateDynamicSizing(numOptions: number, hasSubtitle: boolean) {
  const { height: screenHeight } = Dimensions.get('window');
  
  const stepperHeight = 40;
  const titleHeight = hasSubtitle ? 90 : 55;
  const footerHeight = 140;
  const contentPadding = 40;
  const cardMargins = (numOptions - 1) * 12;
  
  const fixedHeight = stepperHeight + titleHeight + footerHeight + contentPadding + cardMargins;
  const availableHeight = screenHeight - fixedHeight;
  
  const baseCardHeight = Math.floor(availableHeight / numOptions);
  
  const minCardHeight = 64;
  const maxCardHeight = 90;
  
  const cardHeight = Math.max(minCardHeight, Math.min(maxCardHeight, baseCardHeight));
  
  const isCompact = cardHeight <= 70;
  
  return {
    cardHeight,
    cardPaddingVertical: isCompact ? 12 : 14,
    cardPaddingHorizontal: isCompact ? 14 : 16,
    iconSize: isCompact ? 20 : 22,
    iconCircleSize: isCompact ? 40 : 44,
    labelSize: isCompact ? 15 : 16,
    descriptionSize: isCompact ? 13 : 14,
    labelLineHeight: isCompact ? 19 : 20,
    descriptionLineHeight: isCompact ? 17 : 18,
  };
}

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

export function ProgressDots({ current, total }: { current: number; total: number }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.dotsWrap}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i < current;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: isActive ? theme.colors.primary : theme.colors.border },
            ]}
          />
        );
      })}
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
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const contentPaddingBottom = (footer ? theme.spacing.xl * 2 : theme.spacing.lg) + insets.bottom;
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, { paddingBottom: contentPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={styles.stickyWrap}>
          <View style={[styles.fade, { backgroundColor: theme.colors.background }]} pointerEvents="none" />
          <View style={[styles.stickyInner, { paddingBottom: theme.spacing.md + insets.bottom, backgroundColor: theme.colors.background }]}>
            {footer}
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export function Stepper({ current, total }: { current: number; total: number }) {
  const { theme } = useAppTheme();
  return (
    <View
      style={styles.stepperWrap}
      accessibilityRole="header"
      accessibilityLabel={`Step ${current} of ${total}`}
    >
      <View style={styles.stepperRow}>
        <Text style={[styles.stepperText, { color: theme.colors.text }]}>{`Step ${current} of ${total}`}</Text>
        <ProgressDots current={current} total={total} />
      </View>
    </View>
  );
}

export function Option({
  label,
  description,
  selected,
  onPress,
  icon,
  multiple,
  dynamicSizing,
}: {
  label: string;
  description?: string;
  selected?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap | string;
  multiple?: boolean;
  dynamicSizing?: ReturnType<typeof calculateDynamicSizing>;
}) {
  const { theme } = useAppTheme();
  const isDark = theme.colors.background === '#0E141B';
  const selectedBg = isDark ? 'rgba(98, 160, 255, 0.2)' : '#E9F3FF';
  const iconBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  
  const dynamicStyles = dynamicSizing ? {
    minHeight: dynamicSizing.cardHeight,
    paddingVertical: dynamicSizing.cardPaddingVertical,
    paddingHorizontal: dynamicSizing.cardPaddingHorizontal,
  } : {};
  
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        dynamicStyles,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        selected && { ...styles.optionSelected, borderColor: theme.colors.primary, backgroundColor: selectedBg, shadowColor: theme.colors.primary },
      ]}
      accessibilityRole={(multiple ? 'checkbox' : 'radio') as AccessibilityRole}
      accessibilityState={{ checked: !!selected }}
      accessibilityLabel={label}
      hitSlop={8}
    >
      <View style={styles.optionInner}>
        {icon ? (
          <View style={[
            styles.iconCircle, 
            { backgroundColor: iconBgColor },
            dynamicSizing && {
              width: dynamicSizing.iconCircleSize,
              height: dynamicSizing.iconCircleSize,
              borderRadius: dynamicSizing.iconCircleSize / 2,
            }
          ]}>
            <Ionicons
              name={icon as keyof typeof Ionicons.glyphMap}
              size={dynamicSizing?.iconSize || 22}
              color={theme.colors.text}
            />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[
            styles.optionText, 
            { color: theme.colors.text },
            dynamicSizing && {
              fontSize: dynamicSizing.labelSize,
              lineHeight: dynamicSizing.labelLineHeight,
            },
            selected && styles.optionTextSelected
          ]}>
            {label}
          </Text>
          {description ? (
            <Text style={[
              styles.optionDescription, 
              { color: theme.colors.text },
              dynamicSizing && {
                fontSize: dynamicSizing.descriptionSize,
                lineHeight: dynamicSizing.descriptionLineHeight,
              }
            ]}>
              {description}
            </Text>
          ) : null}
        </View>
        <View style={styles.radioContainer}>
          <View style={[styles.radioOuter, { borderColor: selected ? theme.colors.primary : theme.colors.border }]}>
            {selected && <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />}
          </View>
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
  const { theme } = useAppTheme();
  const isDark = theme.colors.background === '#0E141B';
  const buttonBg = disabled 
    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')
    : theme.colors.primary;
  const textColor = disabled 
    ? (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)')
    : '#FFFFFF';
    
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.primaryBtn, { backgroundColor: buttonBg }, style]}
      accessibilityState={{ disabled }}
      accessibilityRole="button"
      hitSlop={8}
    >
      <Text style={[styles.primaryBtnText, { color: textColor }, textStyle]}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  const { theme } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={[styles.secondaryBtn, { borderColor: theme.colors.border }]} accessibilityRole="button" hitSlop={8}>
      <Text style={[styles.secondaryBtnText, { color: theme.colors.text }]}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryTextButton({ title, onPress }: { title: string; onPress: () => void }) {
  const { theme } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={styles.textBtn} accessibilityRole="button" hitSlop={8}>
      <Text style={[styles.textBtnText, { color: theme.colors.text }]}>{title}</Text>
    </Pressable>
  );
}

export function StickyCTA({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>;
}

const SPACER_DEFAULT = 12; // same as theme.spacing.sm, avoid module-level theme ref
export function Spacer({ size = SPACER_DEFAULT }: { size?: number }) {
  return <View style={{ height: size }} />;
}

export function QuestionTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.titleWrap}>
      <Text style={[styles.questionTitle, { color: theme.colors.text }]}>{children}</Text>
      {subtitle ? (
        <Text style={[styles.questionSubtitle, { color: theme.colors.text }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function WhyWeAskLink() {
  const { theme } = useAppTheme();
  const [open, setOpen] = React.useState(false);
  return (
    <View style={{ marginBottom: 8 }}>
      <Pressable accessibilityRole="link" onPress={() => setOpen(true)} hitSlop={8}>
        <Text style={[styles.whyLink, { color: theme.colors.primary }]}>Why we ask?</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: theme.colors.background }]} accessibilityRole={'dialog' as AccessibilityRole}>
            <View
              style={{
                height: 4,
                width: 40,
                backgroundColor: theme.colors.border,
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 12,
              }}
            />
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Why we ask</Text>
            <Text style={[styles.sheetBody, { color: theme.colors.text }]}>
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
  subtitle,
  options,
  selected,
  onChange,
  nextRoute,
  onNext,
  onSkip,
  nextLabel = 'Continue',
  skipLabel = "I'll decide later",
  showSkip = true,
  totalSteps = 9,
  multiple = false,
  maxSelections,
  canProceed,
}: {
  step: number;
  title: string;
  subtitle?: string;
  options: OptionItem[];
  selected: SelectedValue;
  onChange: (next: string[]) => void;
  nextRoute?: string;
  onNext?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  skipLabel?: string;
  showSkip?: boolean;
  totalSteps?: number;
  multiple?: boolean;
  maxSelections?: number;
  canProceed?: boolean;
}) {
  const selectedKeys = normalizeSelected(selected);
  const allowAdvance = typeof canProceed === 'boolean' ? canProceed : selectedKeys.length > 0;

  const dynamicSizing = React.useMemo(
    () => calculateDynamicSizing(options.length, !!subtitle),
    [options.length, subtitle]
  );

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
              <Spacer size={6} />
              <SecondaryTextButton title={skipLabel} onPress={goSkip} />
            </>
          ) : null}
        </StickyCTA>
      }
    >
      <Stepper current={step} total={totalSteps} />
      <QuestionTitle subtitle={subtitle}>{title}</QuestionTitle>
      {options.map((o) => (
        <Option
          key={o.key}
          label={o.label}
          description={o.description}
          selected={selectedKeys.includes(o.key)}
          onPress={() => handleSelect(o.key)}
          icon={o.icon}
          multiple={multiple}
          dynamicSizing={dynamicSizing}
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
  maxSelections?: number,
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
  screen: { flex: 1 },
  screenContent: {
    paddingHorizontal: theme.spacing.lg - 4,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  stepperWrap: {
    marginBottom: theme.spacing.md + 2,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperText: {
    opacity: 0.6,
    fontSize: 15,
    fontFamily: theme.typography.regular,
  },
  dotsWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  titleWrap: {
    marginBottom: theme.spacing.md + 4,
  },
  questionTitle: {
    fontFamily: theme.typography.bold,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 6,
  },
  questionSubtitle: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    lineHeight: 21,
    opacity: 0.7,
  },
  barWrap: {
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  barFill: {
    height: '100%',
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1.5,
    marginBottom: 12,
    minHeight: 68,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  optionSelected: {
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 2,
  },
  optionTextSelected: {
    fontFamily: theme.typography.semiBold,
  },
  optionDescription: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.6,
    marginTop: 2,
  },
  radioContainer: {
    marginLeft: 8,
  },
  radioOuter: {
    width: 23,
    height: 23,
    borderRadius: 11.5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
  },
  primaryBtn: {
    marginTop: theme.spacing.sm,
    paddingVertical: 15,
    textAlign: 'center',
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 17,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  secondaryBtn: {
    marginTop: theme.spacing.xl,
    paddingVertical: 14,
    textAlign: 'center',
    backgroundColor: 'transparent',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
  },
  textBtn: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBtnText: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    opacity: 0.6,
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
    height: 70,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  },
  stickyInner: {
    paddingHorizontal: theme.spacing.lg - 4,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  whyLink: {
    fontFamily: theme.typography.regular,
    fontSize: 14,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    padding: theme.spacing.lg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 18,
    marginBottom: 8,
  },
  sheetBody: {
    fontFamily: theme.typography.regular,
    fontSize: 15,
    opacity: 0.9,
    marginBottom: theme.spacing.md,
  },
});
