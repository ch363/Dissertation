import { createLogger } from '@/services/logging';

const logger = createLogger('HapticFeedback');
let HapticsModule: typeof import('expo-haptics') | null = null;

async function getHapticsModule() {
  if (!HapticsModule) {
    try {
      HapticsModule = await import('expo-haptics');
    } catch (error) {
      logger.debug('expo-haptics not available, haptic feedback disabled', { error });
    }
  }
  return HapticsModule;
}

export type HapticStyle = 'light' | 'medium' | 'heavy';

export function useHapticFeedback() {
  const triggerHaptic = async (style: HapticStyle = 'medium') => {
    try {
      const Haptics = await getHapticsModule();
      if (!Haptics) return;

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
