import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  AppState,
  AppStateStatus,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

const PROGRESS_BAR_HEIGHT = 6;
const PROGRESS_BAR_RADIUS = PROGRESS_BAR_HEIGHT / 2;
const ICON_SIZE = 56;
const ICON_RADIUS = 16;
const BULLET_SIZE = 4;

// Blue palette for Focus card (with shimmer)
const FOCUS_ICON_GRADIENT = ['#3B82F6', '#2563EB', '#60A5FA'] as const;
const FOCUS_CARD_BG_LIGHT = ['#EFF6FF', '#FFFFFF', '#F5F7FF'] as const;
const FOCUS_OVERLAY = ['rgba(219, 234, 254, 0.4)', 'transparent', 'rgba(219, 234, 254, 0.4)'] as const;
const FOCUS_DIVIDER = ['transparent', '#BFDBFE', 'transparent'] as const;
const FOCUS_PROGRESS = ['#3B82F6', '#2563EB', '#60A5FA'] as const;

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
  /** Increment when the screen gains focus so we restart shimmer (tab/foreground). */
  screenFocusKey?: number;
};

export const HomeWhyThisNext = React.memo(function HomeWhyThisNext({
  topic,
  why,
  secondaryLine,
  primaryLine,
  supportLine: _supportLine,
  progressLine,
  progressPercent,
  onPress,
  lessonId: _lessonId,
  whyAffordance: _whyAffordance,
  screenFocusKey,
}: Props) {
  const { theme, isDark } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const useTopicAsTitle =
    typeof topic === 'string' && topic.startsWith('Focus: ');
  const hasLessonData = primaryLine != null && primaryLine !== '';

  // Animated values
  const overlayOpacity = useRef(new Animated.Value(0.3)).current;
  const shimmerPosition = useRef(new Animated.Value(-1)).current;
  const overlayLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const shimmerLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const startFocusAnimations = React.useCallback(() => {
    overlayLoopRef.current?.stop();
    shimmerLoopRef.current?.stop();
    overlayOpacity.setValue(0.3);
    shimmerPosition.setValue(-1);

    overlayLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(overlayOpacity, {
          toValue: 0.6,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    shimmerLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerPosition, {
          toValue: 2,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(shimmerPosition, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    overlayLoopRef.current.start();
    shimmerLoopRef.current.start();
  }, [overlayOpacity, shimmerPosition]);

  const stopFocusAnimations = React.useCallback(() => {
    overlayLoopRef.current?.stop();
    shimmerLoopRef.current?.stop();
    overlayLoopRef.current = null;
    shimmerLoopRef.current = null;
  }, []);

  // Start on mount and whenever screen gains focus (tab switch back to Home)
  useEffect(() => {
    if (!useTopicAsTitle) return;

    if (!reduceMotion) {
      startFocusAnimations();
    }
    return () => {
      stopFocusAnimations();
    };
  }, [useTopicAsTitle, reduceMotion, startFocusAnimations, stopFocusAnimations, screenFocusKey]);

  // Restart when app comes back to foreground
  useEffect(() => {
    if (!useTopicAsTitle || reduceMotion) return;

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        startFocusAnimations();
      }
    });
    return () => sub.remove();
  }, [useTopicAsTitle, reduceMotion, startFocusAnimations]);

  // Fallback: restart shimmer every 30s so it never stays stopped (e.g. native layer quirk)
  useEffect(() => {
    if (!useTopicAsTitle || reduceMotion) return;

    const interval = setInterval(() => {
      startFocusAnimations();
    }, 30000);
    return () => clearInterval(interval);
  }, [useTopicAsTitle, reduceMotion, startFocusAnimations]);

  const progressValue =
    typeof progressPercent === 'number' && progressPercent >= 0 && progressPercent <= 1
      ? progressPercent
      : null;

  // Premium card for all Focus states
  if (useTopicAsTitle) {
    const content = (
      <View style={styles.premiumContainer}>
        {/* Base gradient: indigo-50 → white → purple-50 (matches web) */}
        <LinearGradient
          colors={isDark ? [theme.colors.card, theme.colors.background, theme.colors.card] : [...FOCUS_CARD_BG_LIGHT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.baseGradient}
        />
        
        {/* Animated overlay: indigo-100/40 → transparent → purple-100/40, opacity 0.3 → 0.6 → 0.3 */}
        <Animated.View style={[styles.overlayGradient, { opacity: overlayOpacity }]}>
          <LinearGradient
            colors={FOCUS_OVERLAY}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        
        {/* Border glow - indigo-200/60 */}
        <View style={[styles.glowBorder, !isDark && styles.glowBorderLight]} />

        {/* Main content */}
        <View style={styles.premiumContent}>
          {/* Header with premium icon */}
          <View style={styles.premiumHeader}>
            <View style={styles.iconWrapper}>
              <LinearGradient
                colors={FOCUS_ICON_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumIconBox}
              >
                {/* Shimmer: gradient from-transparent via-white/30 to-transparent, x: -100% → 200% (matches web) */}
                <Animated.View
                  pointerEvents="none"
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
                  size={28}
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

          {/* Divider: transparent → indigo-200 → transparent */}
          <LinearGradient
            colors={FOCUS_DIVIDER}
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
                    (() => {
                      const parts = String(progressLine).split(' • ');
                      const first = parts[0] ?? '';
                      const second = parts[1];
                      return (
                        <View style={styles.metaRow}>
                          <Text
                            style={[styles.metaText, { color: theme.colors.mutedText }]}
                            numberOfLines={1}
                            maxFontSizeMultiplier={1.3}
                          >
                            {first}
                          </Text>
                          <View style={[styles.bullet, { backgroundColor: theme.colors.mutedText }]} />
                          {second != null && second !== '' ? (
                            <Text
                              style={[styles.metaText, { color: theme.colors.mutedText }]}
                              numberOfLines={1}
                              maxFontSizeMultiplier={1.3}
                            >
                              {second}
                            </Text>
                          ) : null}
                        </View>
                      );
                    })()
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
                            colors={FOCUS_PROGRESS}
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
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color="#2563EB"
                  style={styles.ctaArrow}
                />
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
  // Border with glow effect (blue)
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    shadowColor: '#2563EB',
    shadowOpacity: 0.12,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  glowBorderLight: {
    borderColor: 'rgba(191, 219, 254, 0.6)',
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
    shadowColor: '#2563EB',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ICON_SIZE,
    height: ICON_SIZE,
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
    shadowColor: '#2563EB',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  // CTA arrow (no background)
  ctaWrapper: {
    marginLeft: 16,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaArrow: {},
});
