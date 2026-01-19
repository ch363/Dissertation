import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getLessons, type Lesson } from '@/services/api/modules';
import { routes } from '@/services/navigation/routes';
import { setSessionDefaultLessonId } from '@/services/preferences/settings-facade';
import { theme as baseTheme } from '@/services/theme/tokens';
import { useAppTheme } from '@/services/theme/ThemeProvider';

export default function SessionLessonPickerScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const showBack = typeof navigation?.canGoBack === 'function' && navigation.canGoBack();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLessons();
        if (!cancelled) setLessons(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load lessons');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lessons;
    return lessons.filter((l) => l.title.toLowerCase().includes(q));
  }, [lessons, query]);

  const handleBack = useCallback(() => {
    try {
      // @ts-ignore
      if (navigation?.canGoBack?.()) {
        // @ts-ignore
        navigation.goBack();
        return;
      }
    } catch {}
    router.replace(routes.tabs.settings.session);
  }, [navigation]);

  const handleSelect = useCallback(async (lesson: Lesson) => {
    await setSessionDefaultLessonId(lesson.id);
    try {
      router.back();
    } catch {
      router.replace(routes.tabs.settings.session);
    }
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {showBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Session defaults"
            onPress={handleBack}
            style={styles.backBtn}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.mutedText} />
          </Pressable>
        )}

        <Text style={[styles.title, { color: theme.colors.text }]}>Choose a lesson</Text>

        <View
          style={[
            styles.searchWrap,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Ionicons name="search" size={18} color={theme.colors.mutedText} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search lessons"
            placeholderTextColor={theme.colors.mutedText}
            style={[styles.searchInput, { color: theme.colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear lesson filter"
          onPress={async () => {
            await setSessionDefaultLessonId(null);
            try {
              router.back();
            } catch {
              router.replace(routes.tabs.settings.session);
            }
          }}
          style={[
            styles.clearRow,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.clearText, { color: theme.colors.error }]}>Clear lesson filter</Text>
          <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
        </Pressable>

        {loading ? (
          <View style={styles.stateRow}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[styles.stateText, { color: theme.colors.mutedText }]}>Loading…</Text>
          </View>
        ) : error ? (
          <View style={styles.stateRow}>
            <Text style={[styles.stateText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: baseTheme.spacing.lg }}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Select lesson ${item.title}`}
                onPress={() => handleSelect(item)}
                style={({ pressed }) => [
                  styles.lessonRow,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lessonTitle, { color: theme.colors.text }]}>{item.title}</Text>
                  {item.description ? (
                    <Text
                      style={[styles.lessonSub, { color: theme.colors.mutedText }]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    padding: baseTheme.spacing.lg,
    gap: baseTheme.spacing.md,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: baseTheme.spacing.md,
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 22,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: baseTheme.spacing.sm,
    borderRadius: baseTheme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    padding: 0,
  },
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.md,
    borderRadius: baseTheme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  clearText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
  },
  stateRow: {
    paddingVertical: baseTheme.spacing.md,
    alignItems: 'center',
    gap: baseTheme.spacing.sm,
  },
  stateText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseTheme.spacing.md,
    paddingVertical: baseTheme.spacing.md,
    paddingHorizontal: baseTheme.spacing.md,
    borderRadius: baseTheme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: baseTheme.spacing.sm,
  },
  lessonTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
  },
  lessonSub: {
    marginTop: 2,
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
    lineHeight: 16,
  },
});

