import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarButton } from '@/components/navigation';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes;

  const iconNameForRoute = (route: any) => {
    const rn: string = String(route.name ?? '');
    if (rn.includes('learn')) return 'book';
    if (rn.includes('profile')) return 'person';
    if (rn.includes('settings')) return 'settings';
    return 'home';
  };

  return (
    <View
      style={[
        styles.tabBarWrapper,
        {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          shadowColor: '#0D1B2A',
          // Keep the background extending into the home-indicator safe area,
          // but avoid adding extra spacing that makes the bar look oversized.
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.tabBar}>
        {visibleRoutes.map((route: any, idx: number) => {
          const isFocused = state.index === idx;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });
          const label = descriptors[route.key]?.options?.title ?? route.name;
          return (
            <TabBarButton
              key={route.key}
              label={label}
              iconName={iconNameForRoute(route)}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { theme } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Tabs
        initialRouteName="home"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          // Keep defaults consistent with our themed custom bar
          tabBarStyle: { backgroundColor: theme.colors.card },
          tabBarBackground: () => <View style={{ flex: 1, backgroundColor: theme.colors.card }} />,
        }}
      >
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
        <Tabs.Screen name="profile" options={{ title: 'Progress' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: baseTheme.spacing.sm,
    paddingTop: baseTheme.spacing.xs,
    paddingBottom: baseTheme.spacing.xs,
    minHeight: 56,
  },
});
