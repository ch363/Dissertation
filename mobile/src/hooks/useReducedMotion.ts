import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => {
        if (mounted) setReducedMotion(!!enabled);
      })
      .catch(() => {});

    // RN versions differ: sometimes returns subscription with remove(), sometimes not.
    // @ts-ignore - version compatibility
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled: boolean) => {
      setReducedMotion(!!enabled);
    });

    return () => {
      mounted = false;
      // @ts-ignore - version compatibility
      sub?.remove?.();
    };
  }, []);

  return reducedMotion;
}

