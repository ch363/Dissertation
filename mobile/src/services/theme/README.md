# Theme (tokens + provider)

## Avoiding "Property 'theme' doesn't exist" (Hermes)

Theme must be available before any screen or layout uses it. To prevent this error:

1. **Entry point** – `expo-entry.js` imports `./src/services/theme/tokens` **before** `expo-router/entry` so tokens (and `theme`) are initialized before any route loads. Do not remove or reorder that import.

2. **Context** – `ThemeProvider` uses a default context value and `useAppTheme()` returns a safe fallback when context is null, so `theme` is never undefined when destructuring.

3. **Module-level styles** – Files that use `theme` in `StyleSheet.create()` at module level rely on tokens being loaded first (see 1). For new code, prefer `useAppTheme()` in the component and `useMemo(() => createStyles(theme), [theme])` so styles are created inside the component tree.

4. **Default parameters** – Do not use `theme` in default parameter values (e.g. `size = theme.spacing.sm`); use a constant (e.g. `SPACER_DEFAULT = 12`) or resolve theme inside the function.
