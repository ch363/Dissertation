import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, ActivityIndicator, Modal, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ScrollView } from '@/components/ui';
import { SurfaceCard } from '@/components/ui/SurfaceCard';

import { getMyProfile, upsertMyProfile, getDashboard, getRecentActivity, type DashboardData, type RecentActivity, refreshSignedAvatarUrlFromUrl as refreshAvatarUrl, uploadAvatar } from '@/services/api/profile';
import { getProgressSummary, type ProgressSummary } from '@/services/api/progress';
import { getAllMastery, type SkillMastery } from '@/services/api/mastery';
import { getAvatarUri } from '@/services/cache/avatar-cache';
import { Card } from '@/components/profile/Card';
import { ProfileHeader } from '@/components/profile/Header';
import { ProgressBar } from '@/components/profile/ProgressBar';
import { StatCard } from '@/components/profile/StatCard';
import { ActivityCard } from '@/components/profile/ActivityCard';
import { MasteryCard } from '@/components/profile/MasteryCard';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export default function Profile() {
  const { theme } = useAppTheme();
  const [displayName, setDisplayName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [mastery, setMastery] = useState<SkillMastery[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [profile, dashboardData, recentData, masteryData] = await Promise.all([
        getMyProfile(),
        getDashboard(),
        getRecentActivity(),
        getAllMastery().catch((error) => {
          console.error('Error loading mastery data:', error);
          return [];
        }),
      ]);

      if (profile) {
        // Backend now computes displayName - use it directly
        setDisplayName(profile.displayName || profile.name || 'User');
        setProfileId(profile.id);
        
        if (profile?.avatarUrl) {
          try {
            const fresh = await refreshAvatarUrl(profile.avatarUrl);
            // Use cached avatar if available, otherwise use the refreshed URL
            const avatarUri = await getAvatarUri(profile.id, fresh);
            setAvatarUrl(avatarUri);
          } catch {
            // On error, try to use cached version or fallback to original URL
            const avatarUri = await getAvatarUri(profile.id, profile.avatarUrl);
            setAvatarUrl(avatarUri);
          }
        } else {
          setAvatarUrl(null);
        }
      } else {
        // No profile yet - backend should have provisioned it, but fallback to "User"
        setDisplayName('User');
      }

      const progressData = await getProgressSummary(profile?.id || null);
      setProgress(progressData);
      setDashboard(dashboardData);
      setRecentActivity(recentData);
      setMastery(masteryData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleEditPress = () => {
    setEditName(displayName || '');
    setEditAvatarUrl(avatarUrl);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName(displayName);
    setEditAvatarUrl(avatarUrl);
  };

  const handleSave = async () => {
    if (!profileId) return;
    
    setSaving(true);
    try {
      const updates: { name?: string | null; avatarUrl?: string | null } = {};
      
      if (editName.trim() !== displayName) {
        updates.name = editName.trim() || null;
      }
      
      if (editAvatarUrl !== avatarUrl) {
        updates.avatarUrl = editAvatarUrl;
      }
      
      if (Object.keys(updates).length > 0) {
        await upsertMyProfile(updates);
        await loadData(); // Reload to get fresh data
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && profileId) {
        const uri = result.assets[0].uri;
        
        // Cache the image immediately for instant preview
        try {
          const { cacheAvatarFile } = await import('@/services/cache/avatar-cache');
          const cachedPath = await cacheAvatarFile(uri, profileId);
          setEditAvatarUrl(cachedPath); // Show cached version immediately
        } catch (cacheError) {
          console.error('Error caching avatar:', cacheError);
          // Still show the original URI if caching fails
          setEditAvatarUrl(uri);
        }
        
        // Upload to Supabase Storage in the background
        try {
          const uploadedUrl = await uploadAvatar(uri, profileId);
          // After upload, update to use the Supabase URL (but cached version is already shown)
          setEditAvatarUrl(uploadedUrl);
          // Also update the main avatar URL
          const avatarUri = await getAvatarUri(profileId, uploadedUrl);
          setAvatarUrl(avatarUri);
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          Alert.alert('Upload Error', 'Failed to upload avatar. The image is cached locally. Please try again later.');
          // Keep showing cached version on upload error
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemoveAvatar = () => {
    setEditAvatarUrl(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const XP_PER_LEVEL = 100;
  const currentXP = progress?.xp ?? 0;
  const currentLevel = Math.floor(currentXP / XP_PER_LEVEL) + 1;
  const xpInLevel = currentXP % XP_PER_LEVEL;
  const progressToNext = xpInLevel / XP_PER_LEVEL;

  // Build activity items from recent data
  const activityItems = [];
  if (recentActivity?.recentLesson) {
    activityItems.push({
      title: recentActivity.recentLesson.lesson.title,
      subtitle: `${recentActivity.recentLesson.lesson.module.title} • ${recentActivity.recentLesson.completedTeachings} teachings completed`,
      time: recentActivity.recentLesson.lastAccessedAt,
      icon: 'book-outline' as const,
      route: `/(tabs)/learn/${recentActivity.recentLesson.lesson.id}/start`,
    });
  }
  if (recentActivity?.recentTeaching) {
    activityItems.push({
      title: 'Completed teaching',
      subtitle: `${recentActivity.recentTeaching.teaching.learningLanguageString} • ${recentActivity.recentTeaching.lesson.title}`,
      time: recentActivity.recentTeaching.completedAt,
      icon: 'checkmark-circle-outline' as const,
    });
  }
  if (recentActivity?.recentQuestion) {
    activityItems.push({
      title: 'Reviewed question',
      subtitle: `${recentActivity.recentQuestion.teaching.learningLanguageString} • ${recentActivity.recentQuestion.lesson.title}`,
      time: recentActivity.recentQuestion.lastRevisedAt,
      icon: 'refresh-outline' as const,
    });
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Enhanced Header */}
        <SurfaceCard style={styles.headerCard}>
          <ProfileHeader
            title={displayName || 'Your Profile'}
            subtitle={progress ? `Level ${currentLevel} • ${currentXP} XP` : 'Loading…'}
            avatarUrl={avatarUrl}
            right={
              <Pressable style={styles.editButton} onPress={handleEditPress} accessibilityRole="button">
                <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              </Pressable>
            }
          />
        </SurfaceCard>

        {/* Dashboard Stats */}
        {dashboard && (
          <View style={styles.statsRow}>
            <Link href="/profile/reviews" asChild>
              <Pressable accessibilityRole="button">
                <StatCard
                  label="Due Reviews"
                  value={dashboard.dueReviewCount}
                  icon="time-outline"
                  color={dashboard.dueReviewCount > 0 ? theme.colors.error : theme.colors.mutedText}
                />
              </Pressable>
            </Link>
            <StatCard
              label="Active Lessons"
              value={dashboard.activeLessonCount}
              icon="book-outline"
            />
            <StatCard
              label="Streak"
              value={dashboard.streak || 0}
              icon="flame"
              color={dashboard.streak && dashboard.streak > 0 ? '#FF6B35' : theme.colors.mutedText}
            />
          </View>
        )}

        {/* Level Progress */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: theme.colors.text }]}>Progress to Next Level</Text>
            <Link href="/profile/progress" asChild>
              <Pressable accessibilityRole="button" hitSlop={8}>
                <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All</Text>
              </Pressable>
            </Link>
          </View>
          <ProgressBar
            progress={progressToNext}
            currentLevel={currentLevel}
            currentXP={currentXP}
            xpPerLevel={XP_PER_LEVEL}
          />
          <View style={styles.xpBreakdown}>
            <View style={styles.xpItem}>
              <Ionicons name="trophy-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.xpLabel, { color: theme.colors.mutedText }]}>Total XP: {currentXP}</Text>
            </View>
            {dashboard && dashboard.dueReviewCount > 0 && (
              <View style={styles.xpItem}>
                <Ionicons name="time-outline" size={16} color={theme.colors.error} />
                <Text style={[styles.xpLabel, { color: theme.colors.mutedText }]}>
                  {dashboard.dueReviewCount} reviews due
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Skill Mastery */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Skill Mastery</Text>
            <Link href="/profile/skills" asChild>
              <Pressable accessibilityRole="button" hitSlop={8}>
                <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View</Text>
              </Pressable>
            </Link>
          </View>
          <Card>
            <MasteryCard mastery={mastery || []} />
          </Card>
        </View>

        {/* Recent Activity */}
        {recentActivity && activityItems.length > 0 && (
          <ActivityCard title="Recent Activity" items={activityItems.slice(0, 3)} />
        )}

        {/* Account Settings */}
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: baseTheme.spacing.lg }]}>
            Account
          </Text>
          <SurfaceCard style={styles.accountCard}>
            <Link href="/profile/skills" asChild>
              <Pressable accessibilityRole="button" style={styles.accountItem}>
                <View style={styles.accountItemLeft}>
                  <Ionicons name="school-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.accountLabel, { color: theme.colors.text }]}>Skills</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
              </Pressable>
            </Link>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <Link href="/profile/reviews" asChild>
              <Pressable accessibilityRole="button" style={styles.accountItem}>
                <View style={styles.accountItemLeft}>
                  <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.accountLabel, { color: theme.colors.text }]}>Reviews</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
              </Pressable>
            </Link>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <Pressable accessibilityRole="button" style={styles.accountItem} onPress={handleEditPress}>
              <View style={styles.accountItemLeft}>
                <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.accountLabel, { color: theme.colors.text }]}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
            </Pressable>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <Link href="/profile/progress" asChild>
              <Pressable accessibilityRole="button" style={styles.accountItem}>
                <View style={styles.accountItemLeft}>
                  <Ionicons name="stats-chart-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.accountLabel, { color: theme.colors.text }]}>Progress</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
              </Pressable>
            </Link>
          </SurfaceCard>
        </View>
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
            <Pressable onPress={handleCancel} disabled={saving} style={styles.modalCancelButton}>
              <Text style={[styles.modalCancelText, { color: theme.colors.text }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Profile</Text>
            <Pressable onPress={handleSave} disabled={saving} style={styles.modalSaveButton}>
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
              <Pressable onPress={handlePickImage} style={styles.avatarEditContainer}>
                {editAvatarUrl ? (
                  <Image source={{ uri: editAvatarUrl }} style={styles.editAvatar} />
                ) : (
                  <View style={[styles.editAvatar, styles.editAvatarPlaceholder, { backgroundColor: theme.colors.border }]}>
                    <Ionicons name="person" size={40} color={theme.colors.mutedText} />
                  </View>
                )}
                <View
                  style={[
                    styles.avatarEditBadge,
                    { backgroundColor: theme.colors.primary, borderColor: theme.colors.background },
                  ]}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                </View>
              </Pressable>
              {editAvatarUrl && (
                <Pressable onPress={handleRemoveAvatar} style={styles.removeAvatarButton}>
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
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
  },
  headerCard: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  editButton: {
    padding: baseTheme.spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: baseTheme.spacing.sm,
  },
  progressCard: {
    marginTop: baseTheme.spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: baseTheme.spacing.md,
  },
  progressTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 16,
  },
  viewAllText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
  },
  xpBreakdown: {
    flexDirection: 'row',
    gap: baseTheme.spacing.md,
    marginTop: baseTheme.spacing.md,
    flexWrap: 'wrap',
  },
  xpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.xs,
  },
  xpLabel: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: baseTheme.spacing.sm,
  },
  sectionTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
  },
  accountCard: {
    marginTop: baseTheme.spacing.sm,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: baseTheme.spacing.md,
  },
  accountItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.md,
  },
  accountLabel: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginVertical: baseTheme.spacing.xs,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: baseTheme.spacing.md,
    borderBottomWidth: 1,
  },
  modalCancelButton: {
    padding: baseTheme.spacing.xs,
    minWidth: 60,
  },
  modalCancelText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
  },
  modalTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
  },
  modalSaveButton: {
    padding: baseTheme.spacing.xs,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  modalSaveText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  modalContent: {
    padding: baseTheme.spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: baseTheme.spacing.xl,
  },
  avatarEditContainer: {
    position: 'relative',
    marginBottom: baseTheme.spacing.md,
  },
  editAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  removeAvatarButton: {
    paddingVertical: baseTheme.spacing.sm,
  },
  removeAvatarText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  inputSection: {
    marginBottom: baseTheme.spacing.lg,
  },
  inputLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
    marginBottom: baseTheme.spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: baseTheme.radius.md,
    padding: baseTheme.spacing.md,
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
  },
});
