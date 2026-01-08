import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarButton } from '@/components/navigation/TabBarButton';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const allowed = new Set(['home/index', 'learn/index', 'settings', 'profile']);
  const visibleRoutes = state.routes.filter((route: any) => allowed.has(route.name));

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
          backgroundColor: '#FFFFFF',
          shadowColor: '#0D1B2A',
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
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Tabs
        initialRouteName="home/index"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          // Also enforce white bar background (we use a custom bar, but keep defaults consistent)
          tabBarStyle: { backgroundColor: '#FFFFFF' },
          tabBarBackground: () => <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />,
        }}
      >
        <Tabs.Screen name="home/index" options={{ title: 'Home' }} />
        <Tabs.Screen name="learn/index" options={{ title: 'Learn' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />

        {/* Hide non-tab routes from the bar but keep them routable */}
        <Tabs.Screen name="learn/[lessonId]/start" options={{ href: null }} />
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
    backgroundColor: '#FFFFFF',

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
    backgroundColor: '#FFFFFF',
  },
});
