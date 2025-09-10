import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { OnboardingProvider } from '../src/onboarding/OnboardingContext';
import { AuthProvider } from '../src/providers/AuthProvider';
import { theme } from '../src/theme';

export default function RootLayout() {
  // Load fonts
  const [loaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Optional Android-specific tweaks
    }
  }, []);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <OnboardingProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack>
      </OnboardingProvider>
    </AuthProvider>
  );
}
