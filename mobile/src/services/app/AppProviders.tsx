import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingProvider } from '@/features/onboarding/providers/OnboardingProvider';
import { SupabaseConfigGate } from '@/services/api/SupabaseConfigGate';
import { clearSessionPlanCache } from '@/services/api/session-plan-cache';
import { preloadLearnScreenData } from '@/services/api/learn-screen-cache';
import { preloadProfileScreenData } from '@/services/api/profile-screen-cache';
import { AuthProvider, useAuth } from '@/services/auth/AuthProvider';
import { RouteGuard } from '@/services/navigation/RouteGuard';
import { ThemeProvider } from '@/services/theme/ThemeProvider';
import { preloadSpeech, warmupTts } from '@/services/tts';
import { createLogger } from '@/services/logging';

const Logger = createLogger('AppProviders');

type Props = {
  children: React.ReactNode;
};

function PreloadManager({ children }: Props) {
  const { user, loading: authLoading, profile } = useAuth();

  // Clear session plan cache on app startup to ensure fresh data
  useEffect(() => {
    clearSessionPlanCache();
    Logger.info('Session plan cache cleared on app startup');
  }, []);

  // Preload and warmup TTS module when app starts - do it immediately
  // This ensures the audio system is ready before any user interaction
  useEffect(() => {
    const initializeTts = async () => {
      try {
        // First, preload the module
        await preloadSpeech();
        Logger.info('TTS module preloaded at app startup');
        
        // Then warmup the audio system by doing a test speak
        // This initializes the native audio device and eliminates first-click delay
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay after preload
        await warmupTts();
        Logger.info('TTS warmed up successfully at app startup - ready for first click');
      } catch (error) {
        Logger.warn('Failed to initialize TTS at app startup', { error });
        // Continue anyway - TTS will initialize on first use
      }
    };
    
    // Start initialization immediately, don't wait
    initializeTts();
  }, []);

  // Preload all tab screen data when user is authenticated
  // This happens immediately in the background so tabs load instantly
  // We preload as soon as user is authenticated, even if profile isn't loaded yet
  useEffect(() => {
    if (!authLoading && user) {
      // Start preloading immediately - no delay needed
      // Preload both Learn and Profile screens in parallel
      Promise.all([
        preloadLearnScreenData().catch((error) => {
          Logger.warn('Failed to preload Learn screen data (non-critical)', { error });
        }),
        preloadProfileScreenData(profile?.id || null).catch((error) => {
          Logger.warn('Failed to preload Profile screen data (non-critical)', { error });
        }),
      ]).then(() => {
        Logger.info('All tab screens preloaded successfully');
      });
    }
  }, [user, authLoading, profile?.id]);

  return <>{children}</>;
}

export function AppProviders({ children }: Props) {
  return (
    <ThemeProvider>
      <SupabaseConfigGate>
        <AuthProvider>
          <PreloadManager>
            <OnboardingProvider>
              <RouteGuard>
                <SafeAreaProvider>{children}</SafeAreaProvider>
              </RouteGuard>
            </OnboardingProvider>
          </PreloadManager>
        </AuthProvider>
      </SupabaseConfigGate>
    </ThemeProvider>
  );
}
