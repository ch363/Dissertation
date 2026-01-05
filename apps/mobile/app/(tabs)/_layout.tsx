import { Tabs } from 'expo-router';
import React, { useRef } from 'react';
import { Image, Pressable, StyleSheet, View, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/modules/settings';
import { theme as baseTheme } from '@/theme';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes;
  const scalesRef = useRef<Record<string, Animated.Value>>({});
  // Images are not tinted; keep colors out to avoid unused warnings.

  return (
    <View
      style={[
        styles.tabBarWrapper,
        {
          // solid background improves shadow perf
          backgroundColor: theme.colors.card,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 2 },
        },
      ]}
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            paddingBottom: 8 + Math.max(insets.bottom - 20, 0),
          },
        ]}
      >
        {visibleRoutes.map((route: any) => {
          const index = state.routes.findIndex((r: any) => r.key === route.key);
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

          // Animated scale per tab
          if (!scalesRef.current[route.key]) {
            scalesRef.current[route.key] = new Animated.Value(isFocused ? 1 : 0.96);
          }
          Animated.spring(scalesRef.current[route.key], {
            toValue: isFocused ? 1 : 0.96,
            useNativeDriver: true,
            speed: 14,
          }).start();

          // Map route to image asset using href or name
          const href: string | undefined = descriptors[route.key]?.options?.href;
          const rn: string = String(route.name ?? '');
          const isLearn = (href && href.includes('/learn')) || rn.includes('learn');
          const isProfile = (href && href.includes('/profile')) || rn.includes('profile');
          const isSettings = (href && href.includes('/settings')) || rn.includes('settings');
          const source = isLearn
            ? require('../../assets/Exercie_logo.png')
            : isProfile
              ? require('../../assets/Profile_logo.png')
              : isSettings
                ? require('../../assets/Settings_logo.png')
                : require('../../assets/Home_icon.png');

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key]?.options?.title}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
              hitSlop={8}
            >
              <Animated.Image
                source={source}
                style={[styles.icon, { transform: [{ scale: scalesRef.current[route.key] }] }]}
                resizeMode="contain"
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Approx bar height to position wave right above it
  const barPaddingTop = baseTheme.spacing.sm;
  const iconH = 48; // matches styles.icon
  const padBottom = 8 + Math.max(insets.bottom - 20, 0);
  const barHeight = barPaddingTop + iconH + padBottom;

  return (
    <View style={{ flex: 1 }}>
      <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="home/index"
          options={{
            title: 'Home',
            href: '/(tabs)/home',
          }}
        />
        <Tabs.Screen
          name="learn/index"
          options={{
            title: 'Learn',
            href: '/(tabs)/learn',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            href: '/(tabs)/profile',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            href: '/(tabs)/settings',
          }}
        />
      </Tabs>
      {/* Wave overlay positioned above the tab bar */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: barHeight - 14, zIndex: 1 }}
      >
        <Image
          source={require('../../assets/Footer_wave_transparent.png')}
          style={{ width: '100%', height: 90 }}
          resizeMode="stretch"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    borderTopLeftRadius: 52,
    borderTopRightRadius: 52,
    zIndex: 2,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: baseTheme.spacing.lg,
    paddingTop: baseTheme.spacing.lg,
    borderWidth: 1,
    borderTopLeftRadius: 52,
    borderTopRightRadius: 52,
    overflow: 'hidden',
    zIndex: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 48,
    height: 48,
  },
});
