import { Stack } from 'expo-router';
import { theme } from '../../src/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitle: '',
  headerBackVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
