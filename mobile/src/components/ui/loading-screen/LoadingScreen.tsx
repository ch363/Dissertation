import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export type LoadingScreenProps = {
  /** Single line of loading text (e.g. "Loading content") */
  title: string;
  /** Optional; design shows single line only - kept for API compatibility, not rendered */
  subtitle?: string;
  safeArea?: boolean;
};

const SPINNER_SIZE = 64;
const SPINNER_R = 28;
const STROKE_WIDTH = 1.5;
const DASH_ARRAY = '140 40';

function LoadingSpinner() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2000,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.spinnerWrap, { transform: [{ rotate: '-90deg' }] }]}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={SPINNER_SIZE} height={SPINNER_SIZE} viewBox={`0 0 ${SPINNER_SIZE} ${SPINNER_SIZE}`}>
          <Defs>
            <LinearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <Stop offset="100%" stopColor="#4f46e5" stopOpacity={0.9} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={SPINNER_SIZE / 2}
            cy={SPINNER_SIZE / 2}
            r={SPINNER_R}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={STROKE_WIDTH}
          />
          <Circle
            cx={SPINNER_SIZE / 2}
            cy={SPINNER_SIZE / 2}
            r={SPINNER_R}
            fill="none"
            stroke="url(#spinnerGradient)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={DASH_ARRAY}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

export function LoadingScreen({ title, safeArea = true }: LoadingScreenProps) {
  const { theme } = useAppTheme();

  const content = (
    <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <View style={styles.spinnerContainer}>
        <LoadingSpinner />
      </View>
      <Text
        style={[styles.title, { color: theme.colors.mutedText }]}
        accessibilityRole="header"
      >
        {title}
      </Text>
    </View>
  );

  if (safeArea) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        {content}
      </SafeAreaView>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  spinnerContainer: {
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    marginBottom: 32,
  },
  spinnerWrap: {
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
  },
  title: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    textAlign: 'center',
  },
});
