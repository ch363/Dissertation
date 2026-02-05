import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Hook for managing pulse animation on recording buttons.
 * Respects user's reduced motion preferences.
 *
 * @param isActive - Whether the pulse animation should be active
 * @returns Animated value for scale transform
 */
export function useRecordingPulse(isActive: boolean): Animated.Value {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      pulseAnim.setValue(1);
      return;
    }

    if (isActive) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();

      return () => {
        animation.stop();
        pulseAnim.setValue(1);
      };
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive, pulseAnim, reduceMotion]);

  return pulseAnim;
}
