import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View, Text, Pressable, RefreshControl, ActivityIndicator, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScrollView } from '@/components/ui';
import { routes } from '@/services/navigation/routes';
import { HelpButton } from '@/components/navigation/HelpButton';
import { SKILL_CONFIG, DEFAULT_SKILL_CONFIG } from '@/features/profile/profileConstants';
import { useProfileData } from '@/features/profile/hooks/useProfileData';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { ProfileScreenSkeleton } from '@/features/profile/components/ProfileScreenSkeleton';
import { profileScreenStyles as styles } from './profileScreenStyles';

export default function Profile() {
  const { theme } = useAppTheme();
  const params = useLocalSearchParams<{ edit?: string }>();
  const hasOpenedEditFromParams = useRef(false);
  const {
    displayName,
    avatarUrl,
    progress,
    dashboard,
    recentActivity,
    mastery,
    loading,
    refreshing,
    isEditing,
    editName,
    setEditName,
    editAvatarUrl,
    saving,
    onRefresh,
    handleEditPress,
    openEditModal,
    handleCancel,
    handleSave,
    handlePickImage,
    handleRemoveAvatar,
    XP_PER_LEVEL,
    currentXP,
    currentLevel,
    xpInLevel,
    progressToNext,
    activityItems,
  } = useProfileData();

  // When navigated from Settings with ?edit=1, open Edit Profile modal once data is loaded
  useEffect(() => {
    if (!params.edit) {
      hasOpenedEditFromParams.current = false;
      return;
    }
    if (loading) return;
    if (hasOpenedEditFromParams.current) return;
    hasOpenedEditFromParams.current = true;
    openEditModal();
  }, [params.edit, loading, openEditModal]);

  if (loading) {
    return <ProfileScreenSkeleton />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Sleek Profile Header with Gradient */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { shadowColor: theme.colors.primary }]}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              {/* Avatar with gradient border and level badge */}
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={[theme.colors.ctaCardAccent, theme.colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradientBorder}
                >
                  <View style={styles.avatarInner}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    ) : (
                      <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{(displayName || 'U').charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                </LinearGradient>
                {/* Level badge */}
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>L{currentLevel}</Text>
                </View>
              </View>

              {/* Name and level info */}
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
              <HelpButton iconColor="#FFFFFF" />
              <Pressable
                onPress={handleEditPress}
                style={styles.editButton}
                accessibilityLabel="Edit profile"
                accessibilityRole="button"
              >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Weekly Progress Indicator */}
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
                  ? `${dashboard.weeklyXPChange > 0 ? '+' : ''}${dashboard.weeklyXPChange}% from last week`
                  : 'Same as last week'
                : 'No comparison yet'}
            </Text>
          </View>
        </LinearGradient>

        {/* Stats Cards Grid */}
        {dashboard && (
          <View style={styles.statsSection}>
            {/* Primary Stats - 3 columns */}
            <View style={styles.statsRowPrimary}>
              <Link href={routes.tabs.review} asChild style={styles.statCardWrapper}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Due reviews: ${dashboard.dueReviewCount}`}
                  style={styles.statCard}
                >
                  <View style={[styles.statIconContainer, styles.statIconRed]}>
                    <Ionicons name="time-outline" size={20} color="#DC2626" />
                  </View>
                  <Text style={styles.statValue}>{dashboard.dueReviewCount}</Text>
                  <Text style={styles.statLabel}>Due Reviews</Text>
                  {dashboard.dueReviewCount > 0 && (
                    <Text style={styles.statUrgent}>Review now</Text>
                  )}
                </Pressable>
              </Link>

              <View style={[styles.statCardWrapper, styles.statCard]}>
                <View style={[styles.statIconContainer, styles.statIconPurple]}>
                  <Ionicons name="time" size={20} color="#9333EA" />
                </View>
                <Text style={styles.statValue}>{dashboard.studyTimeMinutes ?? 0}m</Text>
                <Text style={styles.statLabel}>Study Time</Text>
              </View>

              <View style={[styles.statCardWrapper, styles.statCard]}>
                <View style={[styles.statIconContainer, styles.statIconOrange]}>
                  <Ionicons name="flame" size={20} color="#EA580C" />
                </View>
                <Text style={styles.statValue}>{dashboard.streak || 0}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
          </View>
        )}

        {/* Level Progress Section */}
        <View style={styles.progressSection}>
          {/* Header */}
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Level Progress</Text>
            <Link href="/profile/progress" asChild>
              <Pressable accessibilityRole="button" hitSlop={8} style={styles.viewAllButton}>
                <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
              </Pressable>
            </Link>
          </View>

          {/* Level Info */}
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

          {/* Progress Bar */}
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
              {/* Milestone markers */}
              <View style={[styles.milestone, { left: '25%' }]} />
              <View style={[styles.milestone, { left: '50%' }]} />
              <View style={[styles.milestone, { left: '75%' }]} />
            </View>
          </View>

          {/* Stats Row */}
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
              <View style={dashboard && dashboard.dueReviewCount > 0 ? styles.progressStatIconRed : styles.progressStatIconGray}>
                <Ionicons name="time-outline" size={16} color={dashboard && dashboard.dueReviewCount > 0 ? '#DC2626' : '#9CA3AF'} />
              </View>
              <View>
                <Text style={styles.progressStatLabel}>Reviews Due</Text>
                <Text style={[
                  styles.progressStatValue,
                  dashboard && dashboard.dueReviewCount > 0 ? styles.progressStatValueRed : styles.progressStatValueGray
                ]}>
                  {dashboard?.dueReviewCount || 0} pending
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Skill Mastery */}
        <View style={styles.skillSection}>
          <View style={styles.skillHeader}>
            <View style={styles.skillHeaderLeft}>
              <Text style={styles.sectionTitle}>Skill Mastery</Text>
              <View style={styles.skillBadge}>
                <Text style={[styles.skillBadgeText, { color: theme.colors.primary }]}>{(mastery || []).length}</Text>
              </View>
            </View>
            <Link href="/profile/skills" asChild>
              <Pressable accessibilityRole="button" hitSlop={8} style={styles.viewAllButton}>
                <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
              </Pressable>
            </Link>
          </View>

          {/* Skills List */}
          <View style={styles.skillsList}>
            {(mastery || []).slice(0, 3).map((skill) => {
              const config = SKILL_CONFIG[skill.skillType] ?? { ...DEFAULT_SKILL_CONFIG, name: skill.skillType };

              const progress = Math.min(100, Math.round((skill.averageMastery || 0) * 100));
              const level = Math.max(1, Math.ceil((skill.averageMastery || 0) * 5));

              return (
                <Pressable
                  key={skill.skillType}
                  style={styles.skillCard}
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

                  {/* Progress Bar */}
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
            })}
          </View>
        </View>

        {/* Settings — accessible from Profile */}
        <View style={styles.settingsSection}>
          <Link href={routes.tabs.settings.root} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              style={styles.settingsRow}
            >
              <View style={[styles.settingsRowIcon, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="settings-outline" size={22} color={theme.colors.primary} />
              </View>
              <Text style={[styles.settingsRowLabel, { color: theme.colors.text }]}>Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedText} />
            </Pressable>
          </Link>
        </View>

        {/* Recent Activity */}
        {recentActivity && activityItems.length > 0 && (
          <View style={styles.activitySection}>
            <View style={styles.activityHeader}>
              <View style={styles.activityHeaderLeft}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.activityBadge}>
                  <Text style={styles.activityBadgeText}>{activityItems.length}</Text>
                </View>
              </View>
              <Pressable accessibilityRole="button" hitSlop={8} style={styles.viewAllButton}>
                <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>All</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
              </Pressable>
            </View>

            {/* Activity List */}
            <View style={styles.activityList}>
              {activityItems.slice(0, 4).map((item, index) => {
                const iconColors = [
                  { bg: '#EFF6FF', color: theme.colors.primary },
                  { bg: '#FEF3C7', color: '#D97706' },
                  { bg: '#FED7AA', color: '#EA580C' },
                  { bg: '#DCFCE7', color: '#16A34A' },
                ];
                const colors = iconColors[index % iconColors.length];

                return (
                  <Pressable
                    key={index}
                    style={styles.activityItem}
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
                        <Ionicons name="time-outline" size={10} color="#9CA3AF" />
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
          </View>
        )}

      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Pressable accessibilityRole="button" onPress={handleCancel} disabled={saving} style={styles.modalCancelButton}>
              <Text style={[styles.modalCancelText, { color: theme.colors.text }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Profile</Text>
            <Pressable accessibilityRole="button" onPress={handleSave} disabled={saving} style={styles.modalSaveButton}>
              {saving ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={[styles.modalSaveText, { color: theme.colors.primary }]}>Done</Text>
              )}
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                accessibilityHint="Opens your photo library"
                onPress={handlePickImage}
                style={styles.avatarEditContainer}
              >
                {editAvatarUrl ? (
                  <Image source={{ uri: editAvatarUrl }} style={styles.editAvatar} accessible={false} />
                ) : (
                  <View style={[styles.editAvatar, styles.editAvatarPlaceholder, { backgroundColor: theme.colors.border }]}>
                    <Ionicons name="person" size={40} color={theme.colors.mutedText} accessible={false} importantForAccessibility="no" />
                  </View>
                )}
                <View
                  style={[
                    styles.avatarEditBadge,
                    { backgroundColor: theme.colors.primary, borderColor: theme.colors.background },
                  ]}
                  accessible={false}
                  importantForAccessibility="no"
                >
                  <Ionicons name="camera" size={20} color="#fff" accessible={false} importantForAccessibility="no" />
                </View>
              </Pressable>
              {editAvatarUrl && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove profile photo"
                  onPress={handleRemoveAvatar}
                  style={styles.removeAvatarButton}
                >
                  <Text style={[styles.removeAvatarText, { color: theme.colors.error }]}>Remove Photo</Text>
                </Pressable>
              )}
            </View>

            {/* Name Input */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.mutedText}
                autoFocus
                maxLength={50}
                accessibilityLabel="Name"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

