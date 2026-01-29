import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { getMyProfile, upsertMyProfile, getDashboard, getRecentActivity, type DashboardData, type RecentActivity, refreshSignedAvatarUrlFromUrl as refreshAvatarUrl, uploadAvatar } from '@/services/api/profile';
import { getCachedProfileScreenData, preloadProfileScreenData } from '@/services/api/profile-screen-cache';
import { getProgressSummary, type ProgressSummary } from '@/services/api/progress';
import { getAllMastery, type SkillMastery } from '@/services/api/mastery';
import { getAvatarUri } from '@/services/cache/avatar-cache';

const XP_PER_LEVEL = 500;

export type ProfileActivityItem = {
  title: string;
  subtitle: string;
  time: string;
  icon: 'book-outline' | 'checkmark-circle-outline' | 'refresh-outline';
  route?: string;
};

function buildActivityItems(recentActivity: RecentActivity | null): ProfileActivityItem[] {
  const items: ProfileActivityItem[] = [];
  if (recentActivity?.recentLesson) {
    items.push({
      title: recentActivity.recentLesson.lesson.title,
      subtitle: `${recentActivity.recentLesson.lesson.module.title} • ${recentActivity.recentLesson.completedTeachings} teachings completed`,
      time: recentActivity.recentLesson.lastAccessedAt,
      icon: 'book-outline',
      route: `/(tabs)/learn/${recentActivity.recentLesson.lesson.id}/start`,
    });
  }
  if (recentActivity?.recentTeaching) {
    items.push({
      title: 'Completed teaching',
      subtitle: `${recentActivity.recentTeaching.teaching.learningLanguageString} • ${recentActivity.recentTeaching.lesson.title}`,
      time: recentActivity.recentTeaching.completedAt,
      icon: 'checkmark-circle-outline',
    });
  }
  if (recentActivity?.recentQuestion) {
    items.push({
      title: 'Reviewed question',
      subtitle: `${recentActivity.recentQuestion.teaching.learningLanguageString} • ${recentActivity.recentQuestion.lesson.title}`,
      time: recentActivity.recentQuestion.lastRevisedAt,
      icon: 'refresh-outline',
    });
  }
  return items;
}

export function useProfileData() {
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

  const loadData = useCallback(async () => {
    const cached = getCachedProfileScreenData();
    let profile, dashboardData, recentData, masteryData, progressData;

    if (cached) {
      profile = cached.profile;
      dashboardData = cached.dashboard;
      recentData = cached.recentActivity;
      masteryData = cached.mastery;
      progressData = cached.progress;
    } else {
      setLoading(true);
      [profile, dashboardData, recentData, masteryData] = await Promise.all([
        getMyProfile(),
        getDashboard(),
        getRecentActivity(),
        getAllMastery().catch((error) => {
          console.error('Error loading mastery data:', error);
          return [];
        }),
      ]);
      progressData = await getProgressSummary(profile?.id || null);
    }

    try {
      if (profile) {
        setDisplayName(profile.displayName || profile.name || 'User');
        setProfileId(profile.id);
        if (profile?.avatarUrl) {
          try {
            const fresh = await refreshAvatarUrl(profile.avatarUrl);
            const avatarUri = await getAvatarUri(profile.id, fresh);
            setAvatarUrl(avatarUri);
          } catch {
            const avatarUri = await getAvatarUri(profile.id, profile.avatarUrl);
            setAvatarUrl(avatarUri);
          }
        } else {
          setAvatarUrl(null);
        }
      } else {
        setDisplayName('User');
      }
      setProgress(progressData);
      setDashboard(dashboardData);
      setRecentActivity(recentData);
      setMastery(masteryData);
      setLoading(false);
      setRefreshing(false);
      if (cached && profile?.id) {
        preloadProfileScreenData(profile.id).catch(() => {});
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

  const handleEditPress = useCallback(() => {
    setEditName(displayName || '');
    setEditAvatarUrl(avatarUrl);
    setIsEditing(true);
  }, [displayName, avatarUrl]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditName(displayName);
    setEditAvatarUrl(avatarUrl);
  }, [displayName, avatarUrl]);

  const handleSave = useCallback(async () => {
    if (!profileId) return;
    setSaving(true);
    try {
      const updates: { name?: string; avatarUrl?: string | null } = {};
      if (editName.trim() !== displayName) {
        updates.name = editName.trim() || undefined;
      }
      if (editAvatarUrl !== avatarUrl) {
        updates.avatarUrl = editAvatarUrl;
      }
      if (Object.keys(updates).length > 0) {
        await upsertMyProfile(updates);
        await loadData();
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [profileId, editName, displayName, editAvatarUrl, avatarUrl, loadData]);

  const handlePickImage = useCallback(async () => {
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
        try {
          const { cacheAvatarFile } = await import('@/services/cache/avatar-cache');
          const cachedPath = await cacheAvatarFile(uri, profileId);
          setEditAvatarUrl(cachedPath);
        } catch (cacheError) {
          console.error('Error caching avatar:', cacheError);
          setEditAvatarUrl(uri);
        }
        try {
          const uploadedUrl = await uploadAvatar(uri, profileId);
          setEditAvatarUrl(uploadedUrl);
          const avatarUri = await getAvatarUri(profileId, uploadedUrl);
          setAvatarUrl(avatarUri);
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          Alert.alert('Upload Error', 'Failed to upload avatar. The image is cached locally. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, [profileId]);

  const handleRemoveAvatar = useCallback(() => {
    setEditAvatarUrl(null);
  }, []);

  const openEditModal = useCallback(() => {
    setEditName(displayName || '');
    setEditAvatarUrl(avatarUrl);
    setIsEditing(true);
  }, [displayName, avatarUrl]);

  const currentXP = progress?.xp ?? 0;
  const currentLevel = Math.max(1, Math.floor(currentXP / XP_PER_LEVEL) + 1);
  const xpInLevel = currentXP % XP_PER_LEVEL;
  const progressToNext = xpInLevel / XP_PER_LEVEL;
  const activityItems = buildActivityItems(recentActivity);

  return {
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
    profileId,
    loadData,
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
  };
}
