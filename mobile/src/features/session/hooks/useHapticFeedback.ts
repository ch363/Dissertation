import * as Haptics from 'expo-haptics';
import { createLogger } from '@/services/logging';

const logger = createLogger('HapticFeedback');

function isHapticsUsable(): boolean {
  return !!(
    Haptics.ImpactFeedbackStyle &&
    typeof Haptics.impactAsync === 'function'
  );
}

export type HapticStyle = 'light' | 'medium' | 'heavy';

export function useHapticFeedback() {
  const triggerHaptic = async (style: HapticStyle = 'medium') => {
    if (!isHapticsUsable()) return;
    try {
      let feedbackStyle;
      switch (style) {
        case 'light':
          feedbackStyle = Haptics.ImpactFeedbackStyle.Light;
          break;
        case 'heavy':
          feedbackStyle = Haptics.ImpactFeedbackStyle.Heavy;
          break;
        case 'medium':
        default:
          feedbackStyle = Haptics.ImpactFeedbackStyle.Medium;
          break;
      }

      await Haptics.impactAsync(feedbackStyle);
    } catch (error) {
      logger.debug('Haptic feedback failed', { error });
    }
  };

  const triggerSuccess = () => triggerHaptic('light');

  const triggerError = () => triggerHaptic('heavy');

  const triggerSelection = () => triggerHaptic('medium');

  return {
    triggerHaptic,
    triggerSuccess,
    triggerError,
    triggerSelection,
  };
}
