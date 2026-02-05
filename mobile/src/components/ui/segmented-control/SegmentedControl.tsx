import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type SegmentValue = 'review' | 'learn';

type Props = {
  value: SegmentValue;
  onChange: (value: SegmentValue) => void;
  color?: string;
  containerColor?: string;
  pillColor?: string;
};

const SEGMENT_HEIGHT = 44;
const SEGMENT_RADIUS = 10;
const CONTAINER_PADDING = 3;
const ANIMATION_DURATION = 250;

export function SegmentedControl({ value, onChange, color, containerColor, pillColor }: Props) {
  const { theme } = useAppTheme();
  const pillPosition = useRef(new Animated.Value(value === 'review' ? 0 : 1)).current;
  const [segmentWidth, setSegmentWidth] = React.useState(0);

  const textColor = color ?? theme.colors.onPrimary;
  const bgColor = containerColor ?? 'rgba(255, 255, 255, 0.15)';
  const activePillColor = pillColor ?? 'rgba(255, 255, 255, 0.3)';

  useEffect(() => {
    Animated.timing(pillPosition, {
      toValue: value === 'review' ? 0 : 1,
      duration: ANIMATION_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();
  }, [value, pillPosition]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    const calculatedWidth = (width - CONTAINER_PADDING * 2) / 2;
    setSegmentWidth(calculatedWidth);
  };

  const pillTranslateX = pillPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, segmentWidth],
  });

  return (
    <View
      style={[styles.container, { backgroundColor: bgColor }]}
      onLayout={handleLayout}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 && (
        <Animated.View
          style={[
            styles.pill,
            {
              backgroundColor: activePillColor,
              width: segmentWidth,
              transform: [{ translateX: pillTranslateX }],
            },
          ]}
          pointerEvents="none"
        />
      )}

      <Pressable
        style={styles.segment}
        onPress={() => onChange('review')}
        accessibilityRole="tab"
        accessibilityLabel="Review mode"
        accessibilityState={{ selected: value === 'review' }}
        accessibilityHint="Switch to review mode"
      >
        <Text
          style={[
            styles.segmentText,
            { color: textColor },
            value === 'review' && styles.segmentTextActive,
          ]}
          numberOfLines={1}
        >
          Review
        </Text>
      </Pressable>

      <Pressable
        style={styles.segment}
        onPress={() => onChange('learn')}
        accessibilityRole="tab"
        accessibilityLabel="Learn mode"
        accessibilityState={{ selected: value === 'learn' }}
        accessibilityHint="Switch to learn mode"
      >
        <Text
          style={[
            styles.segmentText,
            { color: textColor },
            value === 'learn' && styles.segmentTextActive,
          ]}
          numberOfLines={1}
        >
          Learn
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: SEGMENT_HEIGHT,
    borderRadius: SEGMENT_RADIUS,
    padding: CONTAINER_PADDING,
    position: 'relative',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pill: {
    position: 'absolute',
    left: CONTAINER_PADDING,
    top: CONTAINER_PADDING,
    height: SEGMENT_HEIGHT - CONTAINER_PADDING * 2,
    borderRadius: SEGMENT_RADIUS - CONTAINER_PADDING,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
    letterSpacing: 0.3,
    opacity: 0.8,
  },
  segmentTextActive: {
    opacity: 1,
  },
});
