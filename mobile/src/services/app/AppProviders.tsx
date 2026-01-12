import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingProvider } from '@/features/onboarding/providers/OnboardingProvider';
import { SupabaseConfigGate } from '@/services/api/SupabaseConfigGate';
import { AuthProvider } from '@/services/auth/AuthProvider';
import { RouteGuard } from '@/services/navigation/RouteGuard';
import { ThemeProvider } from '@/services/theme/ThemeProvider';

type Props = {
  children: React.ReactNode;
};

export function AppProviders({ children }: Props) {
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
