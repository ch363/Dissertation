import { StackActions } from '@react-navigation/native';
import { Stack, useNavigation } from 'expo-router';
import React, { useEffect } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAppTheme } from '@/services/theme/ThemeProvider';

export default function LearnLayout() {
  const { theme } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const navigation = useNavigation();

  // When user taps the Learn tab while already in this stack, pop to the Learn root.
  useEffect(() => {
    const parent = navigation.getParent();
    const unsub = parent?.addListener?.('tabPress', () => {
      navigation.dispatch(StackActions.popToTop());
    });
    return () => (typeof unsub === 'function' ? unsub() : undefined);
  }, [navigation]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.background },
        // Respect the user's Reduce Motion preference.
        animation: reduceMotion ? 'none' : 'default',
        animationDuration: reduceMotion ? 0 : 300,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Learn' }} />
      <Stack.Screen name="list" options={{ title: 'Lessons', headerBackTitle: 'Learn' }} />
    </Stack>
  );
}
