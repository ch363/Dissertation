import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, RefreshControl, Image, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { LoadingScreen, StaticCard } from '@/components/ui';
import { routes } from '@/services/navigation/routes';
import { HelpButton } from '@/components/navigation';
import { SKILL_CONFIG, DEFAULT_SKILL_CONFIG } from '@/features/profile/profileConstants';
import { useProfileData } from '@/features/profile/hooks/useProfileData';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { createProfileScreenStyles } from './profileScreenStyles';

const TAB_BAR_HEIGHT = 84;

export default function Profile() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createProfileScreenStyles(theme), [theme]);
  const params = useLocalSearchParams<{ edit?: string }>();
  const hasOpenedEditFromParams = useRef(false);
  const {
    displayName,
    avatarUrl,
    dashboard,
    mastery,
    loading,
    refreshing,
    onRefresh,
    XP_PER_LEVEL,
    currentXP,
    currentLevel,
    xpInLevel,
    progressToNext,
    activityItems,
  } = useProfileData();

  const router = useRouter();
  useEffect(() => {
    if (!params.edit) {
      hasOpenedEditFromParams.current = false;
      return;
    }
    if (loading) return;
    if (hasOpenedEditFromParams.current) return;
    hasOpenedEditFromParams.current = true;
    router.push(routes.tabs.profile.edit);
  }, [params.edit, loading, router]);

  if (loading) {
    return <LoadingScreen title="Loading content" />;
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        styles.scrollContent,
        {
          paddingTop: insets.top,
          paddingBottom: baseTheme.spacing.xl + insets.bottom + TAB_BAR_HEIGHT,
          paddingLeft: baseTheme.spacing.lg + insets.left,
          paddingRight: baseTheme.spacing.lg + insets.right,
        },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
        <LinearGradient
          colors={[theme.colors.profileHeader, theme.colors.profileHeader]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { shadowColor: theme.colors.profileHeader }]}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={[theme.colors.ctaCardAccent, theme.colors.profileHeader]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradientBorder}
                >
                  <View style={styles.avatarInner}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    ) : (
                      <Text style={[styles.avatarText, { color: theme.colors.profileHeader }]}>{(displayName || 'U').charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                </LinearGradient>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>L{currentLevel}</Text>
                </View>
              </View>

              <View style={styles.headerInfo}>
                <Text style={styles.headerName}>{displayName || 'User'}</Text>
                <View style={styles.headerStats}>
                  <Text style={styles.headerStatText}>Level {currentLevel}</Text>
                  <Text style={styles.headerStatDot}>•</Text>
                  <Text style={styles.headerStatText}>{currentXP} XP</Text>
                </View>
              </View>
            </View>

            <View style={styles.headerRight}>
              <HelpButton
                variant="elevated"
                accessibilityLabel="Help, profile"
                accessibilityHint="Opens help information"
              />
              <Pressable
                onPress={() => {
                  Alert.alert(
                    'Profile',
                    undefined,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Edit profile',
                        onPress: () => router.push(routes.tabs.profile.edit),
                      },
                    ],
                    { cancelable: true }
                  );
                }}
                style={({ pressed }) => [styles.headerMenuButton, pressed && styles.headerMenuButtonPressed]}
                accessibilityLabel="More options"
                accessibilityHint="Opens menu with Edit profile"
                accessibilityRole="button"
              >
                <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <View style={styles.weeklyProgress}>
            <View style={styles.weeklyProgressHeader}>
              <View style={styles.weeklyProgressLeft}>
                <Ionicons
                  name={dashboard && dashboard.weeklyXPChange >= 0 ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={dashboard && dashboard.weeklyXPChange >= 0 ? '#86EFAC' : '#FCA5A5'}
                />
                <Text style={styles.weeklyProgressTitle}>This Week</Text>
              </View>
              <Text style={styles.weeklyProgressXP}>{dashboard?.weeklyXP || 0} XP</Text>
            </View>
            <Text style={styles.weeklyProgressSubtext}>
              {typeof dashboard?.weeklyXPChange === 'number'
                ? dashboard.weeklyXPChange !== 0
                  ? `${dashboard.weeklyXPChange > 0 ? '+' : ''}${dashboard.weeklyXPChange}% XP vs last week`
                  : 'Same XP as last week'
                : 'No comparison yet'}
            </Text>
          </View>
        </LinearGradient>

        {dashboard && (
          <View style={styles.statsSection}>
            <View style={styles.statsRowPrimary}>
              <View style={styles.statCardSlot}>
                {dashboard.dueReviewCount === 0 ? (
                  <View
                    style={[styles.statCard, styles.statCardWhite, styles.statCardDisabled]}
                    accessibilityRole="text"
                    accessibilityLabel="Due reviews: 0. Nothing to review. Not available."
                  >
                    <View style={styles.statCardContent}>
                      <View style={styles.statCardMain}>
                        <View style={[styles.statIconContainer, styles.statIconRedAction]}>
                          <Ionicons name="time-outline" size={22} color="#DC2626" />
                        </View>
                        <Text style={styles.statValue}>{dashboard.dueReviewCount}</Text>
                        <Text style={styles.statLabel}>Due Reviews</Text>
                        <Text style={styles.statActionSublabel}>Nothing to review</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <Link href={routes.tabs.review} asChild style={styles.statCardSlotInner}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Due reviews: ${dashboard.dueReviewCount}. Tap to start reviews.`}
                      style={({ pressed }) => [styles.statCardTouchable, pressed && styles.statCardPressed]}
                    >
                      <View style={[styles.statCard, styles.statCardWhite, styles.statCardActionable]}>
                        <View style={styles.statCardContent}>
                          <View style={styles.statCardMain}>
                            <View style={[styles.statIconContainer, styles.statIconRedAction]}>
                              <Ionicons name="time-outline" size={22} color="#DC2626" />
                            </View>
                            <Text style={styles.statValue}>{dashboard.dueReviewCount}</Text>
                            <Text style={styles.statLabel}>Due Reviews</Text>
                            <Text style={styles.statActionSublabel}>Tap to start</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedText} />
                        </View>
                      </View>
                    </Pressable>
                  </Link>
                )}
              </View>

              <View style={styles.statCardSlot}>
                <View style={[styles.statCard, styles.statCardWhite]}>
                  <View style={[styles.statIconContainer, styles.statIconPurple]}>
                    <Ionicons name="time-outline" size={22} color="#9333EA" />
                  </View>
                  <Text style={styles.statValue}>{dashboard.studyTimeMinutes ?? 0}m</Text>
                  <Text style={styles.statLabel}>Study time (30d)</Text>
                </View>
              </View>

              <View style={styles.statCardSlot}>
                <View style={[styles.statCard, styles.statCardWhite]}>
                  <View style={[styles.statIconContainer, styles.statIconOrange]}>
                    <Ionicons name="flame" size={22} color={theme.colors.error} />
                  </View>
                  <Text style={styles.statValue}>{dashboard.streak || 0}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Level Progress</Text>
          </View>

          <View style={styles.levelInfo}>
            <View style={styles.levelLeft}>
              <LinearGradient
                colors={['#FBBF24', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.trophyContainer}
              >
                <Ionicons name="trophy" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.levelText}>Level {currentLevel}</Text>
            </View>
            <View style={styles.levelRight}>
              <Text style={styles.xpProgress}>
                {xpInLevel} / {XP_PER_LEVEL} XP
              </Text>
              <Text style={styles.xpToNext}>
                {XP_PER_LEVEL - xpInLevel} XP to Level {currentLevel + 1}
              </Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressToNext * 100}%` }]}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressBarGradient}
                />
              </View>
              <View style={[styles.milestone, { left: '25%' }]} />
              <View style={[styles.milestone, { left: '50%' }]} />
              <View style={[styles.milestone, { left: '75%' }]} />
            </View>
          </View>

          <View style={styles.progressStats}>
            <View style={styles.progressStatItem}>
              <View style={styles.progressStatIconBlue}>
                <Ionicons name="trophy-outline" size={16} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.progressStatLabel}>Total XP</Text>
                <Text style={styles.progressStatValue}>{currentXP}</Text>
              </View>
            </View>

            <View style={styles.progressDivider} />

            <View style={styles.progressStatItem}>
              <View style={styles.progressStatIconGray}>
                <Ionicons name="checkmark-done-outline" size={16} color={theme.colors.mutedText} />
              </View>
              <View>
                <Text style={styles.progressStatLabel}>Accuracy (30d)</Text>
                <Text style={styles.progressStatValue}>
                  {typeof dashboard?.accuracyPercentage === 'number' ? `${Math.round(dashboard.accuracyPercentage)}%` : '—'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.skillSection}>
          <View style={styles.skillHeader}>
            <View style={styles.skillHeaderLeft}>
              <Text style={styles.sectionTitle}>Skill Mastery</Text>
              <View style={styles.skillBadge}>
                <Text style={[styles.skillBadgeText, { color: theme.colors.primary }]}>{(mastery || []).length}</Text>
              </View>
            </View>
            <View style={styles.viewAllButtonWrap}>
              <Link href="/profile/skills" asChild>
                <Pressable accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.viewAllButton, pressed && styles.viewAllButtonPressed]}>
                  <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View all</Text>
                  <View style={styles.viewAllChevronWrap}>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                  </View>
                </Pressable>
              </Link>
            </View>
          </View>

          <View style={styles.skillsList}>
            {(mastery || []).length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateIcon}>
                  <Ionicons name="school-outline" size={40} color={theme.colors.mutedText} />
                </View>
                <Text style={styles.emptyStateText}>
                  Complete lessons to unlock mastery tracking
                </Text>
              </View>
            ) : (
              (mastery || []).slice(0, 3).map((skill) => {
                const config = SKILL_CONFIG[skill.skillType] ?? { ...DEFAULT_SKILL_CONFIG, name: skill.skillType };

                const progress = Math.min(100, Math.round((skill.averageMastery || 0) * 100));
                const level = Math.max(1, Math.ceil((skill.averageMastery || 0) * 5));

                return (
                  <Pressable
                    key={skill.skillType}
                    style={({ pressed }) => [styles.skillCard, pressed && styles.skillCardPressed]}
                    accessibilityRole="button"
                  >
                    <View style={styles.skillCardHeader}>
                      <Text style={styles.skillEmoji}>{config.icon}</Text>
                      <View style={styles.skillCardInfo}>
                        <View style={styles.skillCardTop}>
                          <Text style={styles.skillName}>{config.name}</Text>
                          <View style={styles.skillLevelBadge}>
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text style={styles.skillLevelText}>Level {level}</Text>
                          </View>
                        </View>
                        <Text style={styles.skillSubtext}>
                          {skill.masteredCount || 0} / {skill.totalCount || 0} questions mastered
                        </Text>
                      </View>
                    </View>

                    <View style={styles.skillProgressContainer}>
                      <Text style={styles.skillProgressPercent}>{progress}%</Text>
                      <View style={styles.skillProgressBg}>
                        <LinearGradient
                          colors={config.colors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.skillProgressFill, { width: `${progress}%` }]}
                        />
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <View style={styles.activityHeaderLeft}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {activityItems.length > 0 && (
                <View style={styles.activityBadge}>
                  <Text style={styles.activityBadgeText}>{activityItems.length}</Text>
                </View>
              )}
            </View>
            <View style={styles.viewAllButtonWrap}>
              <Link href={routes.tabs.profile.reviews} asChild>
                <Pressable accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.viewAllButton, pressed && styles.viewAllButtonPressed]}>
                  <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View all</Text>
                  <View style={styles.viewAllChevronWrap}>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                  </View>
                </Pressable>
              </Link>
            </View>
          </View>

          {activityItems.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="time-outline" size={40} color={theme.colors.mutedText} />
              </View>
              <Text style={styles.emptyStateText}>
                Complete lessons and reviews to see your activity here
              </Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {activityItems.slice(0, 4).map((item, index) => {
                const iconColors = [
                  { bg: theme.colors.primary + '25', color: theme.colors.primary },
                  { bg: '#D97706' + '25', color: '#D97706' },
                  { bg: '#EA580C' + '25', color: '#EA580C' },
                  { bg: '#16A34A' + '25', color: '#16A34A' },
                ];
                const colors = iconColors[index % iconColors.length];

                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [styles.activityItem, pressed && styles.activityItemPressed]}
                    accessibilityRole="button"
                  >
                    <View style={[styles.activityIcon, { backgroundColor: colors.bg }]}>
                      <Ionicons name={item.icon} size={20} color={colors.color} />
                    </View>

                    <View style={styles.activityContent}>
                      <View style={styles.activityTitleRow}>
                        <Text style={styles.activityTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                      </View>
                      <Text style={styles.activitySubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                      <View style={styles.activityTime}>
                        <Ionicons name="time-outline" size={10} color={theme.colors.mutedText} />
                        <Text style={styles.activityTimeText}>
                          {new Date(item.time).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.activityXpBadge}>
                      <Text style={[styles.activityXpText, { color: theme.colors.primary }]}>+15 XP</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <StaticCard title="Preferences & account" titleVariant="subtle" style={[styles.settingsSection, { borderColor: theme.colors.primary + '30' }]}>
          <Link href={routes.tabs.settings.root} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              style={({ pressed }) => [styles.settingsRow, pressed && styles.settingsRowPressed]}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.settingsRowIconGradient}
              >
                <Ionicons name="settings-outline" size={26} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.settingsRowContent}>
                <Text style={[styles.settingsRowLabel, { color: theme.colors.text }]}>Settings</Text>
                <Text style={[styles.settingsRowSubtitle, { color: theme.colors.mutedText }]}>Speech, session defaults, sign out</Text>
              </View>
              <View style={styles.settingsRowChevron}>
                <Ionicons name="chevron-forward" size={22} color={theme.colors.primary} />
              </View>
            </Pressable>
          </Link>
        </StaticCard>

    </ScrollView>
  );
}

