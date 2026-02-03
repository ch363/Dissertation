import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View } from 'react-native';

import { TappableCard, MetaRow, SegmentedControl } from '@/components/ui';
import { estimateReviewMinutes } from '@/features/home/utils/estimateReviewMinutes';
import { useAppTheme } from '@/services/theme/ThemeProvider';

function getReviewMinutes(action: { dueCount: number; estimatedReviewMinutes?: number }): number {
  return action.estimatedReviewMinutes != null && action.estimatedReviewMinutes > 0
    ? action.estimatedReviewMinutes
    : estimateReviewMinutes(action.dueCount);
}

export type HomePrimaryAction =
  | {
      kind: 'review';
      label: 'Start Review';
      subtitle: string;
      dueCount: number;
      /** From backend when available; otherwise client fallback. */
      estimatedReviewMinutes?: number;
    }
  | {
      kind: 'continue';
      label: 'Continue Lesson';
      subtitle: string;
      detailLine?: string;
    }
  | {
      kind: 'startNext';
      label: string;
      subtitle: string;
      detailLine?: string;
    };

type Props = {
  action: HomePrimaryAction;
  learnAction?: HomePrimaryAction;
  onPress: (mode: 'review' | 'learn') => void;
};

export function HomePrimaryCtaCard({ action, learnAction, onPress }: Props) {
  const { isDark } = useAppTheme();
  // Primary card uses white/blue-100 text
  const metaColor = isDark ? '#dbeafe' : '#dbeafe'; // blue-100
  
  // When primary is review and we have a learn action, show segment and default to review; otherwise follow primary.
  const initialMode: 'review' | 'learn' =
    action.kind === 'review' ? 'review' : learnAction ? 'learn' : 'learn';
  const [mode, setMode] = useState<'review' | 'learn'>(initialMode);

  // Select which action to display based on mode
  const currentAction = mode === 'review' ? action : (learnAction ?? action);

  // Format meta row based on action type
  let metaRow: React.ReactNode = null;
  if (currentAction.kind === 'review') {
    // Format: "Quick review • ~3–5 min • 14 due"
    const minutes = getReviewMinutes(currentAction);
    const metaText = `Quick review • ~${minutes} min • ${currentAction.dueCount} due`;
    metaRow = <MetaRow text={metaText} textColor={metaColor} />;
  } else if ('detailLine' in currentAction && currentAction.detailLine) {
    metaRow = <MetaRow text={currentAction.detailLine} icon="time-outline" textColor={metaColor} />;
  }

  const icon: keyof typeof Ionicons.glyphMap =
    currentAction.kind === 'review' ? 'refresh' : currentAction.kind === 'continue' ? 'play' : 'book-outline';

  const accessibilityLabel =
    currentAction.kind === 'review'
      ? `Start Review, ${currentAction.dueCount} due, about ${getReviewMinutes(currentAction)} minutes`
      : currentAction.label;

  // Show segmented control only if we have both review and learn actions
  const showSegmentedControl = action.kind === 'review' && learnAction != null;

  const segmentedControl = showSegmentedControl ? (
    <SegmentedControl
      value={mode}
      onChange={(newMode) => setMode(newMode)}
      color="#FFFFFF"
    />
  ) : null;

  return (
    <View>
      <TappableCard
        overline="NEXT UP"
        title={currentAction.label}
        subtitle={currentAction.kind === 'review' ? undefined : currentAction.subtitle}
        leftIcon={icon}
        onPress={() => onPress(currentAction.kind === 'review' ? 'review' : 'learn')}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Double tap to start"
        segmentedControl={segmentedControl}
        metaRow={metaRow}
        variant="primary"
      />
    </View>
  );
}
