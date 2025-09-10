import { Tabs } from 'expo-router';

import { theme } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedText,
        tabBarStyle: { backgroundColor: theme.colors.card },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="learn/index" options={{ title: 'Learn' }} />
      <Tabs.Screen name="progress/index" options={{ title: 'Progress' }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
