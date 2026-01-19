/** Theme and preferences facade — public API for UI layers. */
export {
  /** React context provider for app theme. */
  ThemeProvider,
  /** Hook to access theme object and toggle/mode controls. */
  useAppTheme,
} from '@/services/theme/ThemeProvider';

export {
  /** Read whether TTS is enabled (defaults to true). */
  getTtsEnabled,
  /** Persist TTS enabled flag. */
  setTtsEnabled,
  /** Read saved TTS rate (defaults to 0.95, clamped 0.5–1.0). */
  getTtsRate,
  /** Persist TTS rate (clamped 0.5–1.0). */
  setTtsRate,
  /** Read whether adaptivity is enabled (defaults to true). */
  getAdaptivityEnabled,
  /** Persist adaptivity enabled flag. */
  setAdaptivityEnabled,
  /** Read whether notifications are enabled (defaults to true). */
  getNotificationsEnabled,
  /** Persist notifications enabled flag. */
  setNotificationsEnabled,

  /** Read default session mode for session plans (defaults to mixed). */
  getSessionDefaultMode,
  /** Persist default session mode for session plans. */
  setSessionDefaultMode,
  /** Read optional default time budget (seconds) for session plans. */
  getSessionDefaultTimeBudgetSec,
  /** Persist optional default time budget (seconds) for session plans. */
  setSessionDefaultTimeBudgetSec,
  /** Read optional default lesson filter for session plans. */
  getSessionDefaultLessonId,
  /** Persist optional default lesson filter for session plans. */
  setSessionDefaultLessonId,
} from '@/services/preferences';

/** Safe speech wrapper; methods are no-ops if native module is unavailable. */
export * as Speech from '@/services/tts';
