import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './AuthProvider';
import { RouteGuard } from './RouteGuard';
import { SupabaseConfigGate } from './SupabaseConfigGate';
import { ThemeProvider } from './ThemeProvider';
import { OnboardingProvider } from '../onboarding/OnboardingContext';

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
