import { useFonts } from '@expo-google-fonts/inter';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import { FlatList, LogBox, Platform, ScrollView, SectionList } from 'react-native';
import Toast from 'react-native-toast-message';

import { AppProviders } from '@/services/app/AppProviders';
import { RouteGuard } from '@/services/navigation/RouteGuard';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { createLogger } from '@/services/logging';

const logger = createLogger('RootLayout');

// Disable iOS "rubber-band" bounce and Android overscroll glow globally.
function applyGlobalScrollDefaults() {
  // iOS: `bounces` controls the pull-to-reveal gap.
  // Android: `overScrollMode="never"` removes glow/overscroll.
  const sharedDefaults = {
    bounces: false,
    alwaysBounceVertical: false,
    overScrollMode: 'never',
  } as const;

  // Use `any` to avoid version-specific defaultProps typing differences.
  const apply = (Component: any) => {
    Component.defaultProps = {
      ...(Component.defaultProps ?? {}),
      ...sharedDefaults,
    };
  };

  apply(ScrollView);
  apply(FlatList);
  apply(SectionList);

  // Extra hardening for Android: some components read this prop only at runtime.
  if (Platform.OS === 'android') {
    // no-op; kept to make intent explicit and allow future Android-only additions.
  }
}

applyGlobalScrollDefaults();

// Surface unhandled JS errors to Metro so we can see the stack in logs.
const globalAny = global as typeof globalThis & { ErrorUtils?: any };
const originalGlobalHandler = globalAny.ErrorUtils?.getGlobalHandler?.();
globalAny.ErrorUtils?.setGlobalHandler?.((error: any, isFatal: boolean) => {
  const err = error as Error & { componentStack?: string };
  logger.error('GlobalError', error, {
    isFatal,
    message: err?.message,
    stack: err?.stack,
    componentStack: err?.componentStack,
  });
  originalGlobalHandler?.(error, isFatal);
});

// Optional: allow all warnings to surface while debugging crashes
LogBox.ignoreLogs([]);

export default function RootLayout() {
  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!loaded) return null;

  return (
    <AppProviders>
      <RouteGuard>
        <ThemedStack />
      </RouteGuard>
      <Toast />
    </AppProviders>
  );
}

function ThemedStack() {
  const { theme } = useAppTheme();
  const reduceMotion = useReducedMotion();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
        headerShown: false,
        // Respect the user's Reduce Motion preference.
        animation: reduceMotion ? 'none' : 'default',
        animationDuration: reduceMotion ? 0 : 300, // snappier transitions
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="session" options={{ headerShown: false }} />
      <Stack.Screen name="course" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
    </Stack>
  );
}
