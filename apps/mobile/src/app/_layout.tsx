import { useFonts } from '@expo-google-fonts/inter';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';

import { AppProviders } from '@/services/app/AppProviders';
import { RouteGuard } from '@/services/navigation/RouteGuard';
import { useAppTheme } from '@/services/theme/ThemeProvider';

// Surface unhandled JS errors to Metro so we can see the stack in logs.
const globalAny = global as typeof globalThis & { ErrorUtils?: any };
const originalGlobalHandler = globalAny.ErrorUtils?.getGlobalHandler?.();
globalAny.ErrorUtils?.setGlobalHandler?.((error: any, isFatal: boolean) => {
  console.error('GlobalError', {
    isFatal,
    message: (error as any)?.message,
    stack: (error as any)?.stack,
  });
  originalGlobalHandler?.(error, isFatal);
});

// Optional: allow all warnings to surface while debugging crashes
LogBox.ignoreLogs([]);

export default function RootLayout() {
  // Load fonts
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
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
    </Stack>
  );
}
