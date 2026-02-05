import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingRow } from '@/components/ui';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { getLessons, type Lesson } from '@/services/api/modules';
import { routes } from '@/services/navigation/routes';
import { setSessionDefaultLessonId } from '@/services/preferences/settings-facade';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

export default function SessionLessonPickerScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const showBack = typeof navigation?.canGoBack === 'function' && navigation.canGoBack();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, handleError, clearError } = useErrorHandler('SessionLessonPickerScreen');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      clearError();
      try {
        const data = await getLessons();
        if (!cancelled) setLessons(data);
      } catch (err: unknown) {
        if (!cancelled) handleError(err, 'Failed to load lessons');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearError, handleError]);

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

  const keyExtractor = useCallback((item: Lesson) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Lesson }) => (
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
            <Text style={[styles.lessonSub, { color: theme.colors.mutedText }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.mutedText}
          accessible={false}
          importantForAccessibility="no"
        />
      </Pressable>
    ),
    [handleSelect, theme.colors],
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {showBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            style={styles.backBtn}
            hitSlop={12}
            testID="back-button"
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={theme.colors.mutedText}
              accessible={false}
              importantForAccessibility="no"
            />
          </Pressable>
        )}

        <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
          Choose a lesson
        </Text>

        <View
          style={[
            styles.searchWrap,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={theme.colors.mutedText}
            accessible={false}
            importantForAccessibility="no"
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search lessons"
            placeholderTextColor={theme.colors.mutedText}
            style={[styles.searchInput, { color: theme.colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search lessons"
            accessibilityHint="Filters the lesson list as you type"
            returnKeyType="search"
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
          <Ionicons
            name="trash-outline"
            size={18}
            color={theme.colors.error}
            accessible={false}
            importantForAccessibility="no"
          />
        </Pressable>

        {loading ? (
          <LoadingRow label="Loading lessons…" />
        ) : error ? (
          <View style={styles.stateRow}>
            <Text
              style={[styles.stateText, { color: theme.colors.error }]}
              accessibilityRole="alert"
            >
              {error}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: baseTheme.spacing.lg }}
            removeClippedSubviews
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={10}
            windowSize={10}
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
