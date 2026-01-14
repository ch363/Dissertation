import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingProvider } from '@/features/onboarding/providers/OnboardingProvider';
import { SupabaseConfigGate } from '@/services/api/SupabaseConfigGate';
import { AuthProvider } from '@/services/auth/AuthProvider';
import { RouteGuard } from '@/services/navigation/RouteGuard';
import { ThemeProvider } from '@/services/theme/ThemeProvider';
import { preloadSpeech } from '@/services/tts';

type Props = {
  children: React.ReactNode;
};

export function AppProviders({ children }: Props) {
  // Preload TTS module when app starts - do it immediately and wait for it
  useEffect(() => {
    // Preload immediately on mount
    const preload = async () => {
      try {
        await preloadSpeech();
        console.log('TTS preloaded successfully at app startup');
      } catch (error) {
        console.warn('Failed to preload TTS:', error);
      }
    };
    preload();
  }, []);

  return (
    <ThemeProvider>
      <SupabaseConfigGate>
        <AuthProvider>
          <OnboardingProvider>
            <RouteGuard>
              <SafeAreaProvider>{children}</SafeAreaProvider>
            </RouteGuard>
          </OnboardingProvider>
        </AuthProvider>
      </SupabaseConfigGate>
    </ThemeProvider>
  );
}
