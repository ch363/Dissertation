import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingProvider } from '@/features/onboarding/providers/OnboardingProvider';
import { SupabaseConfigGate } from '@/services/api/SupabaseConfigGate';
import { clearSessionPlanCache } from '@/services/api/session-plan-cache';
import { AuthProvider } from '@/services/auth/AuthProvider';
import { RouteGuard } from '@/services/navigation/RouteGuard';
import { ThemeProvider } from '@/services/theme/ThemeProvider';
import { preloadSpeech, warmupTts } from '@/services/tts';

type Props = {
  children: React.ReactNode;
};

export function AppProviders({ children }: Props) {
  // Clear session plan cache on app startup to ensure fresh data
  useEffect(() => {
    clearSessionPlanCache();
    console.log('Session plan cache cleared on app startup');
  }, []);

  // Preload and warmup TTS module when app starts - do it immediately
  // This ensures the audio system is ready before any user interaction
  useEffect(() => {
    const initializeTts = async () => {
      try {
        // First, preload the module
        await preloadSpeech();
        console.log('TTS module preloaded at app startup');
        
        // Then warmup the audio system by doing a test speak
        // This initializes the native audio device and eliminates first-click delay
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay after preload
        await warmupTts();
        console.log('TTS warmed up successfully at app startup - ready for first click');
      } catch (error) {
        console.warn('Failed to initialize TTS at app startup:', error);
        // Continue anyway - TTS will initialize on first use
      }
    };
    
    // Start initialization immediately, don't wait
    initializeTts();
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
