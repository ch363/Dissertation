import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

const PROGRESS_BAR_HEIGHT = 6;
const PROGRESS_BAR_RADIUS = PROGRESS_BAR_HEIGHT / 2;
const ICON_SIZE = 52;
const ICON_RADIUS = 14;
const BULLET_SIZE = 4;

type Props = {
  /** Concrete topic (e.g. "Focus: Travel"). */
  topic: string;
  /** Optional "Why" line for non-premium layout. */
  why?: string;
  /** Optional secondary line for non-premium layout. */
  secondaryLine?: string;
  /** Premium hero line: "Dining Out • 6 min" (lesson + time). */
  primaryLine?: string;
  /** Premium support line (lighter): "Next lesson in Travel". */
  supportLine?: string;
  /** Premium progress copy: "Not started • 3 lessons" or "2/3 complete". */
  progressLine?: string;
  /** 0–1 for mini progress bar. */
  progressPercent?: number;
  /** When set, whole card is tappable to start this lesson. */
  onPress?: () => void;
  /** Lesson id for accessibility. */
  lessonId?: string;
  /** Optional "why this focus" copy for tiny Why? affordance. */
  whyAffordance?: string;
};

export const HomeWhyThisNext = React.memo(function HomeWhyThisNext({
  topic,
  why,
  secondaryLine,
  primaryLine,
  supportLine,
  progressLine,
  progressPercent,
  onPress,
  lessonId,
  whyAffordance,
}: Props) {
  const { theme, isDark } = useAppTheme();
  const useTopicAsTitle = topic.startsWith('Focus: ');
  const hasLessonData = primaryLine != null && primaryLine !== '';
  const quietLine =
    !hasLessonData && why != null && why !== ''
      ? why
      : !hasLessonData && secondaryLine != null && secondaryLine !== ''
        ? secondaryLine
        : null;

  // Animated values
  const overlayOpacity = useRef(new Animated.Value(0.3)).current;
  const shimmerPosition = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (!useTopicAsTitle) return;

    // Animated overlay pulse - opacity from 0.3 to 0.6 to 0.3
    Animated.loop(
      Animated.sequence([
        Animated.timing(overlayOpacity, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Shimmer effect on icon - translateX from -100% to 200%
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerPosition, {
          toValue: 2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(shimmerPosition, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [useTopicAsTitle, overlayOpacity, shimmerPosition]);

  const handleWhyPress = () => {
    if (whyAffordance?.trim()) {
      Alert.alert('Why this focus?', whyAffordance.trim(), [{ text: 'OK', style: 'default' }]);
    }
  };

  const progressValue =
    typeof progressPercent === 'number' && progressPercent >= 0 && progressPercent <= 1
      ? progressPercent
      : null;

  // Premium card for all Focus states
  if (useTopicAsTitle) {
    const content = (
      <View style={styles.premiumContainer}>
        {/* Base gradient background - much lighter, brighter gradient */}
        <LinearGradient
          colors={isDark ? [theme.colors.card, theme.colors.background, theme.colors.card] : ['#F5F7FF', '#FFFFFF', '#FBF9FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.baseGradient}
        />
        
        {/* Animated overlay gradient - very subtle */}
        <Animated.View style={[styles.overlayGradient, { opacity: overlayOpacity }]}>
          <LinearGradient
            colors={['rgba(224, 231, 255, 0.15)', 'transparent', 'rgba(237, 233, 254, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        
        {/* Border with glow - indigo-200/60 border */}
        <View style={styles.glowBorder} />

        {/* Main content */}
        <View style={styles.premiumContent}>
          {/* Header with premium icon */}
          <View style={styles.premiumHeader}>
            <View style={styles.iconWrapper}>
              <LinearGradient
                colors={['#6366F1', '#5855D6', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumIconBox}
              >
                {/* Shimmer effect - animates from left to right */}
                <Animated.View
                  style={[
                    styles.shimmer,
                    {
                      transform: [
                        {
                          translateX: shimmerPosition.interpolate({
                            inputRange: [-1, 2],
                            outputRange: [-ICON_SIZE, ICON_SIZE * 2],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
                
                <Ionicons
                  name="sparkles"
                  size={26}
                  color="#FFFFFF"
                  accessible={false}
                  importantForAccessibility="no"
                  style={styles.iconAbsolute}
                />
              </LinearGradient>
            </View>
            
            <View style={styles.titleWrapper}>
              <Text
                style={[styles.premiumTitle, { color: theme.colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.3}
              >
                {topic}
              </Text>
            </View>
          </View>

          {/* Gradient divider */}
          <LinearGradient
            colors={['transparent', '#C7D2FE', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.premiumDivider}
          />

          {/* Next Lesson Info */}
          <View style={styles.lessonRow}>
            <View style={styles.lessonInfo}>
              {hasLessonData ? (
                <>
                  <Text
                    style={[styles.lessonTitle, { color: theme.colors.text }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    maxFontSizeMultiplier={1.3}
                  >
                    Next lesson: {primaryLine}
                  </Text>
                  
                  {progressLine != null && progressLine !== '' ? (
                    <View style={styles.metaRow}>
                      <Text
                        style={[styles.metaText, { color: theme.colors.mutedText }]}
                        numberOfLines={1}
                        maxFontSizeMultiplier={1.3}
                      >
                        {progressLine.split(' • ')[0]}
                      </Text>
                      <View style={[styles.bullet, { backgroundColor: theme.colors.mutedText }]} />
                      <Text
                        style={[styles.metaText, { color: theme.colors.mutedText }]}
                        numberOfLines={1}
                        maxFontSizeMultiplier={1.3}
                      >
                        {progressLine.split(' • ')[1]}
                      </Text>
                    </View>
                  ) : null}

                  {/* Premium Progress Bar */}
                  {progressValue !== null ? (
                    <View style={styles.progressContainer}>
                      <LinearGradient
                        colors={isDark ? [theme.colors.border, theme.colors.card] : ['#E5E7EB', '#F3F4F6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.progressTrack}
                      >
                        {progressValue > 0 ? (
                          <LinearGradient
                            colors={['#6366F1', '#5855D6', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                              styles.progressFill,
                              { width: `${Math.round(progressValue * 100)}%` },
                            ]}
                          />
                        ) : null}
                      </LinearGradient>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text
                  style={[styles.fallbackText, { color: theme.colors.mutedText }]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  maxFontSizeMultiplier={1.3}
                >
                  {why || secondaryLine || 'Keep up your learning momentum'}
                </Text>
              )}
            </View>

            {onPress ? (
              <View style={styles.ctaWrapper}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ctaCircle}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#FFFFFF"
                    style={{ fontWeight: 'bold' }}
                  />
                </LinearGradient>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );

    if (onPress) {
      return (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [pressed && styles.cardPressed]}
          accessibilityLabel={`Focus: ${topic}. ${primaryLine ?? ''}. Double tap to start lesson.`}
          accessibilityRole="button"
          accessibilityHint="Starts the next lesson"
        >
          {content}
        </Pressable>
      );
    }

    return content;
  }

  // This should never be reached since we now always use premium design for Focus
  return null;
});

const styles = StyleSheet.create({
  cardPressed: {
    opacity: 0.96,
  },
  // Premium card container
  premiumContainer: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
  },
  // Base gradient background
  baseGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Animated overlay gradient
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Border with glow effect
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(199, 210, 254, 0.6)',
    shadowColor: '#6366F1',
    shadowOpacity: 0.12,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  // Content
  premiumContent: {
    position: 'relative',
    padding: 16,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconWrapper: {
    // Container for icon to handle shadows properly
  },
  premiumIconBox: {
    position: 'relative',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: ICON_SIZE,
  },
  shimmerGradient: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  iconAbsolute: {
    position: 'relative',
    zIndex: 10,
  },
  titleWrapper: {
    flex: 1,
  },
  premiumTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 21,
    lineHeight: 25,
    letterSpacing: -0.4,
  },
  // Gradient divider
  premiumDivider: {
    height: 1,
    marginBottom: 12,
  },
  // Lesson row
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
    lineHeight: 19,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    lineHeight: 18,
  },
  bullet: {
    width: BULLET_SIZE,
    height: BULLET_SIZE,
    borderRadius: BULLET_SIZE / 2,
  },
  fallbackText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 15,
    lineHeight: 20,
  },
  // Progress bar
  progressContainer: {
    marginTop: 12,
  },
  progressTrack: {
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: PROGRESS_BAR_RADIUS,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: PROGRESS_BAR_RADIUS,
    shadowColor: '#6366F1',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  // CTA button
  ctaWrapper: {
    marginLeft: 16,
    flexShrink: 0,
  },
  ctaCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
