import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { getCurrentUser } from '@/modules/auth';
import { getOnboarding } from '@/modules/onboarding';
import { ensureProfileSeed, getMyProfile, upsertMyProfile } from '@/modules/profile';
import { uploadProfileAvatar } from '@/modules/profile/avatar';
import { useAppTheme } from '@/modules/settings';
import { theme as baseTheme } from '@/theme';

export default function EditProfileScreen() {
  const { theme } = useAppTheme();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<any | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  // Toast is global via react-native-toast-message

  useEffect(() => {
    (async () => {
      try {
        const u = await getCurrentUser();
        const id = u?.id;
        if (!id) return;
        const prof = await getMyProfile();
        const currName = prof?.name ?? (u?.user_metadata as any)?.name ?? '';
        setAvatarUrl((prof as any)?.avatar_url ?? null);
        setName(String(currName));
        const a = await getOnboarding(id);
        setAnswers(a);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function showToast(text: string, kind: 'success' | 'error' = 'success') {
    Toast.show({ type: kind, text1: text });
  }

  function validate(): string | null {
    if (name.trim().length === 0) return 'Please enter a display name.';
    if (name.trim().length > 40) return 'Name is too long (max 40 characters).';
    return null;
  }

  async function onSave() {
    const err = validate();
    if (err) {
      showToast(err, 'error');
      return;
    }
    setSaving(true);
    const attempt = async () => {
      await ensureProfileSeed();
      await upsertMyProfile({ name: name.trim() || null });
    };
    try {
      await attempt();
      showToast('Profile saved', 'success');
    } catch (e: any) {
      // Retry once on transient network failure
      if (e?.message && String(e.message).includes('Network request failed')) {
        try {
          await new Promise((r) => setTimeout(r, 700));
          await attempt();
          showToast('Profile saved', 'success');
        } catch (e2: any) {
          showToast(e2?.message || 'Failed to save', 'error');
        }
      } else {
        showToast(e?.message || 'Failed to save', 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAssetUri(uri: string) {
    const u = await getCurrentUser();
    if (!u?.id) return;
    try {
      setSaving(true);
      const url = await uploadProfileAvatar(uri, u.id);
      await upsertMyProfile({ avatar_url: url });
      setAvatarUrl(url);
      showToast('Avatar updated');
    } catch (e: any) {
      showToast(e?.message || 'Avatar upload failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function pickAvatar() {
    // Ask for source
    const libPerm = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (libPerm.status !== 'granted') {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
    const camPerm = await ImagePicker.getCameraPermissionsAsync();
    if (camPerm.status !== 'granted') {
      await ImagePicker.requestCameraPermissionsAsync();
    }

    // Simple fallback: open library first, else camera
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      return handleAssetUri(res.assets[0].uri);
    }
    const cam = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!cam.canceled && cam.assets?.[0]?.uri) {
      return handleAssetUri(cam.assets[0].uri);
    }
  }
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Edit Profile</Text>

        {/* Avatar + Name */}
        <View
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: baseTheme.spacing.md }}
        >
          <Pressable onPress={pickAvatar} accessibilityRole="button" hitSlop={8}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.colors.border }]} />
            )}
          </Pressable>
          <View style={{ marginLeft: baseTheme.spacing.md, flex: 1 }}>
            <Text style={[styles.label, { color: theme.colors.mutedText }]}>Display name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={theme.colors.mutedText}
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                },
              ]}
              accessibilityLabel="Display name"
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onSave}
          disabled={saving}
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary, opacity: saving ? 0.6 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save</Text>
          )}
        </Pressable>

        {/* Onboarding answers */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your onboarding</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          {loading ? (
            <ActivityIndicator />
          ) : answers ? (
            <View>
              {Object.entries(humanizeAnswers(answers)).map(([label, value]) => (
                <View key={label} style={styles.answerRow}>
                  <Text style={[styles.answerKey, { color: theme.colors.mutedText }]}>{label}</Text>
                  <View style={styles.chipsWrap}>{renderChips(value, theme.colors)}</View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: theme.colors.mutedText }}>No onboarding answers found.</Text>
          )}
        </View>

        {/* Toast rendered globally */}
      </View>
    </SafeAreaView>
  );
}

function formatAnswer(value: any): string {
  try {
    if (value == null) return '—';
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: baseTheme.colors.background },
  container: { flex: 1, padding: baseTheme.spacing.lg },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    marginBottom: baseTheme.spacing.lg,
  },
  label: {
    fontFamily: baseTheme.typography.semiBold,
    marginBottom: baseTheme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: baseTheme.radius.md,
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: baseTheme.spacing.sm,
    marginBottom: baseTheme.spacing.md,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ccc' },
  button: {
    height: 44,
    borderRadius: baseTheme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: baseTheme.spacing.lg,
  },
  buttonText: { color: '#fff', fontFamily: baseTheme.typography.semiBold },
  sectionTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
    marginBottom: baseTheme.spacing.md,
  },
  card: {
    borderRadius: baseTheme.radius.lg,
    padding: baseTheme.spacing.md,
    borderWidth: 1,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  answerKey: { flex: 1, marginRight: 8 },
  answerVal: { flex: 2 },
  chipsWrap: { flex: 2, flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  // toast styles removed
});

function humanizeAnswers(raw: any): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  if (!raw) return out;
  if (raw.motivation)
    out['Motivation'] =
      raw.motivation?.label || raw.motivation?.key || formatAnswer(raw.motivation);
  if (raw.learningStyles) out['Learning styles'] = raw.learningStyles;
  if (raw.memoryHabit) out['Memory habit'] = raw.memoryHabit;
  if (raw.difficulty) out['Difficulty'] = raw.difficulty;
  if (raw.gamification) out['Gamification'] = raw.gamification;
  if (raw.feedback) out['Feedback style'] = raw.feedback;
  if (raw.sessionStyle) out['Session style'] = raw.sessionStyle;
  if (raw.tone) out['Tone'] = raw.tone;
  if (raw.experience) out['Experience'] = raw.experience;
  // Fallback for any other keys
  for (const k of Object.keys(raw)) {
    if (
      k in
      {
        motivation: 1,
        learningStyles: 1,
        memoryHabit: 1,
        difficulty: 1,
        gamification: 1,
        feedback: 1,
        sessionStyle: 1,
        tone: 1,
        experience: 1,
      }
    )
      continue;
    const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
    if (raw[k] != null) out[label] = raw[k];
  }
  return out;
}

function renderChips(value: string | string[], colors: any) {
  const list = Array.isArray(value) ? value : [value];
  return list.map((v) => (
    <View key={String(v)} style={[styles.chip, { backgroundColor: colors.border }]}>
      <Text style={{ color: colors.text }}>{String(v)}</Text>
    </View>
  ));
}
