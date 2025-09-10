import { Tabs } from 'expo-router';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { theme as baseTheme } from '../../src/theme';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const visibleNames = new Set(['home/index', 'learn/index', 'profile/index', 'settings']);
  const visibleRoutes = state.routes.filter((r: any) => visibleNames.has(r.name));
  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          // Reduce bottom whitespace under icons while still respecting the home indicator
          paddingBottom: 8 + Math.max(insets.bottom - 20, 0),
        },
      ]}
  > 
      {visibleRoutes.map((route: any) => {
        const index = state.routes.findIndex((r: any) => r.key === route.key);
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

        // Map route to icon asset
        let source;
        if (route.name === 'home/index') source = require('../../assets/Home_icon.png');
        else if (route.name === 'learn/index') source = require('../../assets/Exercie_logo.png');
        else if (route.name === 'profile/index') source = require('../../assets/Profile_logo.png');
        else if (route.name === 'settings') source = require('../../assets/Settings_logo.png');

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
            <Image source={source} style={styles.icon} resizeMode="contain" />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

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
        name="profile/index"
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
        style={{ position: 'absolute', left: 0, right: 0, bottom: barHeight - 14, zIndex: 999 }}
      >
        <Svg width={width} height={80} viewBox="0 0 360 80" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={baseTheme.colors.primary} stopOpacity="0.35" />
              <Stop offset="1" stopColor={baseTheme.colors.primary} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path
            d="M0 64 C 90 24, 180 72, 270 32 S 360 56, 360 30 L 360 0 L 0 0 Z"
            fill="url(#waveGrad)"
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  paddingHorizontal: baseTheme.spacing.lg,
  paddingTop: baseTheme.spacing.sm,
    borderTopWidth: 1,
  borderTopLeftRadius: 40,
  borderTopRightRadius: 40,
  overflow: 'visible',
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
