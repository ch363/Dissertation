import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useAppTheme } from '@/providers/ThemeProvider';
import { theme as baseTheme } from '@/theme';
import { useLearningModes } from '@/viewmodels/learningModes';

export default function Learn() {
  const { theme } = useAppTheme();
  const { modes, loading, error, refresh } = useLearningModes();
  return (
    <SafeAreaView style={[styles.safeArea]}>
      <View style={[styles.container]}>
        {loading ? (
          <View style={styles.stateRow}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[styles.stateText, { color: theme.colors.mutedText }]}>
              Loading modes…
            </Text>
          </View>
        ) : error ? (
          <View style={styles.stateRow}>
            <Text style={[styles.stateText, { color: theme.colors.error }]}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={refresh} accessibilityRole="button">
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          modes.map((mode) => (
            <SurfaceCard key={mode.key} style={{ marginBottom: baseTheme.spacing.lg }}>
              {mode.image ? (
                <Image source={{ uri: mode.image }} style={styles.cardImage} resizeMode="cover" />
              ) : null}
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{mode.title}</Text>
              <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText }]}>
                {mode.subtitle}
              </Text>
              <Button
                title={mode.cta}
                variant={mode.variant === 'primary' ? 'primary' : 'secondary'}
                onPress={() => {}}
                style={{ marginTop: baseTheme.spacing.sm }}
              />
            </SurfaceCard>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: baseTheme.spacing.lg,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: baseTheme.radius.md,
    marginBottom: baseTheme.spacing.md,
  },
  cardTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 20,
    color: baseTheme.colors.text,
  },
  cardSubtitle: {
    fontFamily: baseTheme.typography.regular,
    color: baseTheme.colors.mutedText,
    marginBottom: baseTheme.spacing.md,
  },
  button: {
    paddingVertical: 12,
    borderRadius: baseTheme.radius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontFamily: baseTheme.typography.semiBold,
  },
  stateRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: baseTheme.spacing.sm,
    paddingVertical: baseTheme.spacing.lg,
  },
  stateText: {
    textAlign: 'center',
    fontFamily: baseTheme.typography.regular,
  },
  retryButton: {
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: baseTheme.spacing.sm,
    backgroundColor: baseTheme.colors.primary,
    borderRadius: baseTheme.radius.md,
  },
  retryText: {
    color: '#fff',
    fontFamily: baseTheme.typography.semiBold,
  },
});

