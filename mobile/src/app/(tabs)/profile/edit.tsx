import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';
import { getMyProfile, upsertMyProfile, uploadAvatar } from '@/services/api/profile';
import { getAvatarUri } from '@/services/cache/avatar-cache';
import { getOnboarding, saveOnboarding } from '@/services/api/onboarding';
import { getCurrentUser } from '@/services/api/auth';
import {
  getAdaptivityEnabled,
  setAdaptivityEnabled,
  getSessionDefaultMode,
  setSessionDefaultMode,
  getSessionDefaultTimeBudgetSec,
  setSessionDefaultTimeBudgetSec,
} from '@/services/preferences';
import type { SessionDefaultMode } from '@/services/preferences';
import type { OnboardingAnswers } from '@/types/onboarding';
import { routes } from '@/services/navigation/routes';
import { createLogger } from '@/services/logging';

const logger = createLogger('EditProfileScreen');

const MOTIVATION_OPTIONS = [
  { key: 'travel', label: 'For travel' },
  { key: 'family', label: 'Family & friends' },
  { key: 'study', label: 'Study / career' },
  { key: 'fun', label: 'Fun & growth' },
];
const LEARNING_STYLE_OPTIONS = [
  { key: 'visual', label: 'Visual' },
  { key: 'auditory', label: 'Auditory' },
  { key: 'writing', label: 'Writing' },
  { key: 'acting', label: 'Acting / speaking' },
];
const MEMORY_OPTIONS = [
  { key: 'spaced', label: 'Spaced repetition' },
  { key: 'mnemonics', label: 'Mnemonics & stories' },
  { key: 'immersion', label: 'Context & immersion' },
  { key: 'writing', label: 'Rewriting & notes' },
];
const DIFFICULTY_OPTIONS = [
  { key: 'easy', label: 'Keep it easy' },
  { key: 'balanced', label: 'Balanced' },
  { key: 'hard', label: 'Push me hard' },
];
const GAMIFICATION_OPTIONS = [
  { key: 'light', label: 'Light (streaks, stars)' },
  { key: 'none', label: 'None' },
  { key: 'full', label: 'Lots of challenges' },
];
const FEEDBACK_OPTIONS = [
  { key: 'gentle', label: 'Gentle' },
  { key: 'direct', label: 'Direct' },
  { key: 'detailed', label: 'Detailed' },
];
const SESSION_STYLE_OPTIONS = [
  { key: 'short', label: 'Short (5–10 min)' },
  { key: 'focused', label: 'Focused (20–30 min)' },
  { key: 'deep', label: 'Deep (45+ min)' },
];
const TONE_OPTIONS = [
  { key: 'friendly', label: 'Friendly' },
  { key: 'professional', label: 'Professional' },
  { key: 'playful', label: 'Playful' },
];
const EXPERIENCE_OPTIONS = [
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];

const MODE_OPTIONS: { value: SessionDefaultMode; label: string }[] = [
  { value: 'learn', label: 'Learn' },
  { value: 'review', label: 'Review' },
  { value: 'mixed', label: 'Mixed' },
];

/** Build raw answers from backend response: supports submission.raw, flat answers, or preferences */
function getRawAnswersFromResponse(answers: Record<string, unknown>): Record<string, unknown> | null {
  if (!answers || typeof answers !== 'object') return null;
  const raw = answers.raw;
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  if (
    'motivation' in answers ||
    'learningStyles' in answers ||
    'difficulty' in answers ||
    'experience' in answers
  ) {
    return answers;
  }
  const prefs = answers.preferences;
  if (prefs && typeof prefs === 'object') {
    const p = prefs as Record<string, unknown>;
    return {
      motivation: typeof p.goal === 'string' && p.goal ? { key: p.goal } : undefined,
      learningStyles: Array.isArray(p.learningStyles) ? p.learningStyles : undefined,
      memoryHabit: typeof p.memoryHabit === 'string' ? p.memoryHabit : undefined,
      difficulty: typeof p.difficulty === 'string' ? p.difficulty : undefined,
      gamification: typeof p.gamification === 'string' ? p.gamification : undefined,
      feedback: typeof p.feedback === 'string' ? p.feedback : undefined,
      sessionStyle: typeof p.sessionStyle === 'string' ? p.sessionStyle : undefined,
      tone: typeof p.tone === 'string' ? p.tone : undefined,
      experience: typeof p.experience === 'string' ? p.experience : undefined,
    };
  }
  return null;
}

function normalizeAnswers(raw: Record<string, unknown> | null | undefined): OnboardingAnswers {
  if (!raw || typeof raw !== 'object') return {};
  const a = raw as Record<string, unknown>;
  let motivation: OnboardingAnswers['motivation'];
  if (a.motivation && typeof a.motivation === 'object' && a.motivation !== null && 'key' in a.motivation) {
    motivation = { key: String((a.motivation as { key: unknown }).key), otherText: undefined };
  } else if (typeof a.motivation === 'string' && a.motivation) {
    motivation = { key: a.motivation, otherText: undefined };
  } else if (typeof a.goal === 'string' && a.goal) {
    motivation = { key: a.goal, otherText: undefined };
  } else {
    motivation = undefined;
  }
  return {
    motivation,
    learningStyles: Array.isArray(a.learningStyles) ? a.learningStyles.map(String) : undefined,
    memoryHabit: typeof a.memoryHabit === 'string' ? a.memoryHabit : undefined,
    difficulty: typeof a.difficulty === 'string' ? a.difficulty : undefined,
    gamification: typeof a.gamification === 'string' ? a.gamification : undefined,
    feedback: typeof a.feedback === 'string' ? a.feedback : undefined,
    sessionStyle: typeof a.sessionStyle === 'string' ? a.sessionStyle : undefined,
    tone: typeof a.tone === 'string' ? a.tone : undefined,
    experience: typeof a.experience === 'string' ? a.experience : undefined,
  };
}

export default function EditProfileScreen() {
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [serverAvatarUrl, setServerAvatarUrl] = useState<string | null | undefined>(undefined);
  const [adaptivity, setAdaptivity] = useState(true);
  const [sessionMode, setSessionMode] = useState<SessionDefaultMode>('mixed');
  const [timeBudgetSec, setTimeBudgetSec] = useState<number | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingAnswers>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getMyProfile(),
        getOnboarding(),
        getAdaptivityEnabled(),
        getSessionDefaultMode(),
        getSessionDefaultTimeBudgetSec(),
      ]);
      const [profileRes, onboardingRes, adaptivityVal, modeVal, budgetVal] = results.map((r) =>
        r.status === 'fulfilled' ? r.value : null,
      );
      if (profileRes) {
        setProfileId(profileRes.id);
        setName(profileRes.displayName || profileRes.name || '');
        setServerAvatarUrl(profileRes.avatarUrl ?? null);
        if (profileRes.avatarUrl) {
          try {
            const { refreshSignedAvatarUrlFromUrl } = await import('@/services/api/profile');
            const fresh = await refreshSignedAvatarUrlFromUrl(profileRes.avatarUrl);
            const uri = await getAvatarUri(profileRes.id, fresh);
            setAvatarUrl(uri);
          } catch {
            const uri = await getAvatarUri(profileRes.id, profileRes.avatarUrl);
            setAvatarUrl(uri);
          }
        } else {
          setAvatarUrl(null);
        }
      }
      if (onboardingRes?.answers) {
        const raw = getRawAnswersFromResponse(onboardingRes.answers as Record<string, unknown>);
        if (raw) setOnboarding(normalizeAnswers(raw));
      }
      if (adaptivityVal != null) setAdaptivity(adaptivityVal);
      if (modeVal != null) setSessionMode(modeVal);
      if (budgetVal != null) setTimeBudgetSec(budgetVal);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = useCallback(async () => {
    if (!profileId) return;
    setSaving(true);
    try {
      const profileUpdates: { name?: string; avatarUrl?: string | null } = {};
      profileUpdates.name = name.trim() || undefined;
      if (serverAvatarUrl !== undefined) profileUpdates.avatarUrl = serverAvatarUrl;
      await upsertMyProfile(profileUpdates);
      const user = await getCurrentUser();
      if (user) await saveOnboarding(user.id, onboarding);
      await setAdaptivityEnabled(adaptivity);
      await setSessionDefaultMode(sessionMode);
      await setSessionDefaultTimeBudgetSec(timeBudgetSec);
      router.replace(routes.tabs.profile.index);
    } catch (e) {
      logger.error('Failed to save profile', e);
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [profileId, name, serverAvatarUrl, onboarding, adaptivity, sessionMode, timeBudgetSec]);

  const handlePickImage = useCallback(async () => {
    if (!profileId) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        try {
          const uploaded = await uploadAvatar(uri, profileId);
          setServerAvatarUrl(uploaded);
          const localUri = await getAvatarUri(profileId, uploaded);
          setAvatarUrl(localUri);
        } catch {
          Alert.alert('Upload failed', 'Could not upload photo. Try again.');
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open photos.');
    }
  }, [profileId]);

  const handleRemovePhoto = useCallback(() => {
    setAvatarUrl(null);
    setServerAvatarUrl(null);
  }, []);

  const updateOnboarding = useCallback(<K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => {
    setOnboarding((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: baseTheme.spacing.md,
          paddingVertical: baseTheme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          disabled={saving}
          style={{ padding: baseTheme.spacing.xs, minWidth: 64 }}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={{ fontSize: 16, color: theme.colors.text }}>Cancel</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontFamily: baseTheme.typography.bold, color: theme.colors.text }}>
          Edit Profile
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{ padding: baseTheme.spacing.xs, minWidth: 64, alignItems: 'flex-end' }}
          accessibilityRole="button"
          accessibilityLabel="Save"
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={{ fontSize: 16, fontFamily: baseTheme.typography.semiBold, color: theme.colors.primary }}>
              Done
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: baseTheme.spacing.lg, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile: avatar + name */}
        <View style={{ marginBottom: baseTheme.spacing.xl }}>
          <View style={{ alignItems: 'center', marginBottom: baseTheme.spacing.lg }}>
            <Pressable
              onPress={handlePickImage}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              style={{ position: 'relative' }}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={avatarStyle} />
              ) : (
                <View
                  style={[
                    avatarStyle,
                    { backgroundColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
                  ]}
                >
                  <Ionicons name="person" size={48} color={theme.colors.mutedText} />
                </View>
              )}
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: theme.colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 3,
                  borderColor: theme.colors.background,
                }}
              >
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </Pressable>
            {avatarUrl && (
              <Pressable onPress={handleRemovePhoto} style={{ marginTop: baseTheme.spacing.sm }}>
                <Text style={{ fontSize: 14, color: theme.colors.error }}>Remove photo</Text>
              </Pressable>
            )}
          </View>
          <Text style={[labelStyle, { color: theme.colors.text }]}>Name</Text>
          <TextInput
            style={[
              inputStyle,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={theme.colors.mutedText}
            maxLength={50}
          />
        </View>

        {/* Learning preferences (dynamics) */}
        <View style={[sectionStyle, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[sectionTitleStyle, { color: theme.colors.text }]}>Learning preferences</Text>
          <View style={rowStyle}>
            <Text style={[rowLabelStyle, { color: theme.colors.text }]}>Adaptive learning</Text>
            <Switch
              value={adaptivity}
              onValueChange={setAdaptivity}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <Text style={[rowHintStyle, { color: theme.colors.mutedText }]}>
            Adjusts difficulty and review timing to your progress
          </Text>
          <View style={[rowStyle, { marginTop: baseTheme.spacing.md }]}>
            <Text style={[rowLabelStyle, { color: theme.colors.text }]}>Default session mode</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            {MODE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setSessionMode(opt.value)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: baseTheme.radius.sm,
                  backgroundColor: sessionMode === opt.value ? theme.colors.primary : theme.colors.background,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: baseTheme.typography.medium,
                    color: sessionMode === opt.value ? '#fff' : theme.colors.text,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={[rowStyle, { marginTop: baseTheme.spacing.md }]}>
            <Text style={[rowLabelStyle, { color: theme.colors.text }]}>Session length (minutes)</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 4 }}>
            {[5, 10, 15, 20, 30].map((mins) => {
              const sec = mins * 60;
              const selected = timeBudgetSec === sec;
              return (
                <Pressable
                  key={mins}
                  onPress={() => setTimeBudgetSec(sec)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: baseTheme.radius.sm,
                    backgroundColor: selected ? theme.colors.primary : theme.colors.background,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: baseTheme.typography.medium,
                      color: selected ? '#fff' : theme.colors.text,
                    }}
                  >
                    {mins}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setTimeBudgetSec(null)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: baseTheme.radius.sm,
                backgroundColor: timeBudgetSec === null ? theme.colors.primary : theme.colors.background,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: baseTheme.typography.medium,
                  color: timeBudgetSec === null ? '#fff' : theme.colors.text,
                }}
              >
                No limit
              </Text>
            </Pressable>
          </ScrollView>
          <Pressable
            onPress={() => router.push(routes.tabs.settings.session)}
            style={{ marginTop: baseTheme.spacing.md }}
          >
            <Text style={{ fontSize: 14, color: theme.colors.primary }}>More session options →</Text>
          </Pressable>
        </View>

        {/* Onboarding answers */}
        <View style={[sectionStyle, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, marginTop: baseTheme.spacing.lg }]}>
          <Text style={[sectionTitleStyle, { color: theme.colors.text }]}>Your setup</Text>
          <Text style={[rowHintStyle, { color: theme.colors.mutedText, marginBottom: baseTheme.spacing.md }]}>
            These shape how content and sessions are tailored for you.
          </Text>

          <SelectRow
            theme={theme}
            label="Motivation"
            options={MOTIVATION_OPTIONS}
            selected={onboarding.motivation?.key ?? null}
            onSelect={(key) => updateOnboarding('motivation', key ? { key } : null)}
          />
          <SelectRowMulti
            theme={theme}
            label="Learning styles (up to 2)"
            options={LEARNING_STYLE_OPTIONS}
            selected={onboarding.learningStyles ?? []}
            max={2}
            onSelect={(keys) => updateOnboarding('learningStyles', keys.length ? keys : null)}
          />
          <SelectRow
            theme={theme}
            label="Memory style"
            options={MEMORY_OPTIONS}
            selected={onboarding.memoryHabit ?? null}
            onSelect={(key) => updateOnboarding('memoryHabit', key)}
          />
          <SelectRow
            theme={theme}
            label="Difficulty"
            options={DIFFICULTY_OPTIONS}
            selected={onboarding.difficulty ?? null}
            onSelect={(key) => updateOnboarding('difficulty', key)}
          />
          <SelectRow
            theme={theme}
            label="Gamification"
            options={GAMIFICATION_OPTIONS}
            selected={onboarding.gamification ?? null}
            onSelect={(key) => updateOnboarding('gamification', key)}
          />
          <SelectRow
            theme={theme}
            label="Feedback style"
            options={FEEDBACK_OPTIONS}
            selected={onboarding.feedback ?? null}
            onSelect={(key) => updateOnboarding('feedback', key)}
          />
          <SelectRow
            theme={theme}
            label="Session style"
            options={SESSION_STYLE_OPTIONS}
            selected={onboarding.sessionStyle ?? null}
            onSelect={(key) => updateOnboarding('sessionStyle', key)}
          />
          <SelectRow
            theme={theme}
            label="Tone"
            options={TONE_OPTIONS}
            selected={onboarding.tone ?? null}
            onSelect={(key) => updateOnboarding('tone', key)}
          />
          <SelectRow
            theme={theme}
            label="Experience level"
            options={EXPERIENCE_OPTIONS}
            selected={onboarding.experience ?? null}
            onSelect={(key) => updateOnboarding('experience', key)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const avatarStyle = { width: 120, height: 120, borderRadius: 60 };
const labelStyle = { fontFamily: baseTheme.typography.semiBold, fontSize: 14, marginBottom: 8 };
const inputStyle = {
  borderWidth: 1,
  borderRadius: baseTheme.radius.md,
  padding: baseTheme.spacing.md,
  fontSize: 16,
  fontFamily: baseTheme.typography.regular,
};
const sectionStyle = {
  borderRadius: baseTheme.radius.lg,
  borderWidth: 1,
  padding: baseTheme.spacing.lg,
};
const sectionTitleStyle = {
  fontFamily: baseTheme.typography.bold,
  fontSize: 18,
  marginBottom: 4,
};
const rowStyle = { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' };
const rowLabelStyle = { fontFamily: baseTheme.typography.medium, fontSize: 15 };
const rowHintStyle = { fontSize: 12, marginTop: 4 };

function SelectRow({
  theme,
  label,
  options,
  selected,
  onSelect,
}: {
  theme: ReturnType<typeof useAppTheme>['theme'];
  label: string;
  options: { key: string; label: string }[];
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  return (
    <View style={{ marginBottom: baseTheme.spacing.md }}>
      <Text style={[rowLabelStyle, { color: theme.colors.text, marginBottom: 6 }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {options.map((opt) => {
          const isSelected = selected === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onSelect(isSelected ? null : opt.key)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: baseTheme.radius.sm,
                backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                borderWidth: 1,
                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: baseTheme.typography.medium,
                  color: isSelected ? theme.colors.onPrimary : theme.colors.text,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SelectRowMulti({
  theme,
  label,
  options,
  selected,
  max,
  onSelect,
}: {
  theme: ReturnType<typeof useAppTheme>['theme'];
  label: string;
  options: { key: string; label: string }[];
  selected: string[];
  max: number;
  onSelect: (keys: string[]) => void;
}) {
  const toggle = (key: string) => {
    const idx = selected.indexOf(key);
    let next: string[];
    if (idx >= 0) next = selected.filter((_, i) => i !== idx);
    else if (selected.length >= max) next = [...selected.slice(1), key];
    else next = [...selected, key];
    onSelect(next);
  };
  return (
    <View style={{ marginBottom: baseTheme.spacing.md }}>
      <Text style={[rowLabelStyle, { color: theme.colors.text, marginBottom: 6 }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt.key);
          return (
            <Pressable
              key={opt.key}
              onPress={() => toggle(opt.key)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: baseTheme.radius.sm,
                backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                borderWidth: 1,
                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: baseTheme.typography.medium,
                  color: isSelected ? theme.colors.onPrimary : theme.colors.text,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
