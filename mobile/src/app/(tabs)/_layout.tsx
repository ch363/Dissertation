import { Tabs, router } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarButton } from '@/components/navigation/TabBarButton';
import { routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const allowed = new Set(['home/index', 'learn', 'learn/index', 'settings', 'profile']);
  const visibleRoutes = state.routes.filter((route: any) => allowed.has(route.name));
  const focusedKey = state.routes?.[state.index]?.key;

  const targetPathForRouteName = (routeName: string) => {
    if (routeName.includes('learn')) return routes.tabs.learn;
    if (routeName.includes('settings')) return routes.tabs.settings.root;
    if (routeName.includes('profile')) return routes.tabs.profile.root;
    return routes.tabs.home;
  };

  const iconNameForRoute = (route: any) => {
    const rn: string = String(route.name ?? '');
    if (rn.includes('learn')) return 'book';
    if (rn.includes('settings')) return 'cog';
    if (rn.includes('profile')) return 'person';
    return 'home';
  };

  return (
    <View
      style={[
        styles.tabBarWrapper,
        {
          backgroundColor: theme.colors.background,
          shadowColor: theme.colors.text,
          paddingTop: baseTheme.spacing.xs,
          paddingBottom: insets.bottom + baseTheme.spacing.xs, // paint safe area
        },
      ]}
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {visibleRoutes.map((route: any, idx: number) => {
          const isFocused = route.key === focusedKey;
          const onPress = () => {
            const routeName = String(route.name ?? '');
            const targetPath = targetPathForRouteName(routeName);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (event.defaultPrevented) return;
            // If the tab is already focused and its nested navigator is already at its root,
            // do nothing (avoids a redundant navigation animation / screen re-mount).
            const nestedStateIndex = (route as any)?.state?.index;
            const isAtTabRoot = nestedStateIndex === undefined || nestedStateIndex === 0;
            if (isFocused && isAtTabRoot) return;
            // Always jump to the tab's root route so deep stacks can't "trap" users.
            // Also supports "tap tab again to pop-to-top".
            router.replace(targetPath);
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
        initialRouteName="home/index"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: theme.colors.background },
          tabBarBackground: () => (
            <View style={{ flex: 1, backgroundColor: theme.colors.background }} />
          ),
        }}
      >
        <Tabs.Screen name="home/index" options={{ title: 'Home' }} />
        <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    zIndex: 2,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: baseTheme.spacing.sm,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
});
