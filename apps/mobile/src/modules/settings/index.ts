/** Theme and preferences facade — public API for UI layers. */
export {
	/** React context provider for app theme. */
	ThemeProvider,
	/** Hook to access theme object and toggle/mode controls. */
	useAppTheme,
} from '../../providers/ThemeProvider';

export {
	/** Read whether TTS is enabled (defaults to true). */
	getTtsEnabled,
	/** Persist TTS enabled flag. */
	setTtsEnabled,
	/** Read saved TTS rate (defaults to 0.95, clamped 0.5–1.0). */
	getTtsRate,
	/** Persist TTS rate (clamped 0.5–1.0). */
	setTtsRate,
} from '../../lib/prefs';

/** Safe speech wrapper; methods are no-ops if native module is unavailable. */
export * as Speech from '../../lib/speech';
