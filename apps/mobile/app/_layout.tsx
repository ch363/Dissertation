import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useAppTheme } from '../src/providers/ThemeProvider';
import { OnboardingProvider } from '../src/onboarding/OnboardingContext';
import { AuthProvider } from '../src/providers/AuthProvider';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { theme } from '@/theme';

export default function RootLayout() {
  // Load fonts
  const [loaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });

  if (!loaded) return null;

  return (
    <AuthProvider>
    <OnboardingProvider>
      <ThemeProvider>
        <SafeAreaProvider>
          <ThemedStack />
        </SafeAreaProvider>
      </ThemeProvider>
    </OnboardingProvider>
    </AuthProvider>
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
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}
