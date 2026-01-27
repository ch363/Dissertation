import { AccessibilityInfo, Platform } from 'react-native';

export function announce(message: string) {
  const text = String(message ?? '').trim();
  if (!text) return;

  try {
    AccessibilityInfo.announceForAccessibility?.(text);

    // Android can sometimes drop the first announcement if triggered mid-transition.
    if (Platform.OS === 'android') {
      setTimeout(() => {
        try {
          AccessibilityInfo.announceForAccessibility?.(text);
        } catch {}
      }, 50);
    }
  } catch {}
}

