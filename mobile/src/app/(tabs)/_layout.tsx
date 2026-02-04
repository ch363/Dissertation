import { Tabs, router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarButton } from '@/components/navigation';
import { hasOnboarding } from '@/services/api/onboarding';
import { useAuth } from '@/services/auth/AuthProvider';
import { routes } from '@/services/navigation/routes';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { CustomTabBarProps, Route, TabIconName } from '@/types/navigation.types';

function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const allowed = new Set(['home/index', 'learn', 'learn/index', 'profile']);
  const visibleRoutes = state.routes.filter((route: Route) => allowed.has(route.name));
  const focusedKey = state.routes?.[state.index]?.key;
  const currentRouteName = state.routes?.[state.index]?.name ?? '';

  // Hide tab bar on sub-screens (only show on main tabs)
  // Also check if we're on a nested screen within a stack (e.g., learn/list, profile/edit)
  const currentRoute = state.routes[state.index];
  const isOnMainTab = allowed.has(currentRouteName);
  const isOnNestedScreen = currentRoute?.state?.index !== undefined && currentRoute.state.index > 0;
  
  const shouldShowTabBar = isOnMainTab && !isOnNestedScreen;
  if (!shouldShowTabBar) {
    return null;
  }

  const targetPathForRouteName = (routeName: string) => {
    // Use /learn (no /index) so the learn stack shows its index screen. Using /learn/index
    // would match the dynamic route [lessonId]=index and render LessonOverviewScreen with invalid id.
    if (routeName.includes('learn')) return '/(tabs)/learn';
    if (routeName.includes('profile')) return routes.tabs.profile.root;
    return routes.tabs.home;
  };

  const iconNameForRoute = (route: Route): TabIconName => {
    const rn: string = String(route.name ?? '');
    if (rn.includes('learn')) return 'book';
    if (rn.includes('profile')) return 'person';
    return 'home';
  };

  return (
    <View
      style={[
        styles.tabBarWrapper,
        {
          backgroundColor: theme.colors.card,
          shadowColor: theme.colors.border,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.card,
          },
        ]}
      >
        {visibleRoutes.map((route: Route) => {
          const isFocused =
            route.key === focusedKey || (currentRouteName === 'settings' && route.name === 'profile');
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
            const nestedStateIndex = route.state?.index;
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
  const { session } = useAuth();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!session?.user?.id || checkedRef.current) return;
    let cancelled = false;
    checkedRef.current = true;
    hasOnboarding(session.user.id).then((done) => {
      if (!cancelled && !done) router.replace(routes.onboarding.welcome);
    }).finally(() => {
      if (cancelled) checkedRef.current = false;
    });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

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
        <Tabs.Screen name="settings" options={{ title: 'Settings', href: null }} />
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 2,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: baseTheme.spacing.md,
    paddingTop: baseTheme.spacing.md,
    paddingBottom: baseTheme.spacing.sm,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});
