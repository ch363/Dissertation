import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { routes } from '@/services/navigation/routes';
import {
  useAppTheme,
  getTtsEnabled,
  setTtsEnabled,
  getTtsRate,
  setTtsRate,
} from '@/services/preferences/settings-facade';
import { theme as baseTheme } from '@/services/theme/tokens';

export default function SpeechSettings() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const showBack = typeof navigation?.canGoBack === 'function' && navigation.canGoBack();
  const [enabled, setEnabled] = useState(true);
  const [rate, setRate] = useState(0.95);

  useEffect(() => {
    (async () => {
      const [e, r] = await Promise.all([getTtsEnabled(), getTtsRate()]);
      setEnabled(e);
      setRate(r);
    })();
  }, []);

  const handleBack = useCallback(() => {
    try {
      // @ts-ignore
      if (navigation?.canGoBack?.()) {
        // @ts-ignore
        navigation.goBack();
        return;
      }
    } catch {}
    router.replace(routes.tabs.settings.root);
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {showBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Settings"
            onPress={handleBack}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.mutedText} />
          </Pressable>
        )}

        <Text style={[styles.title, { color: theme.colors.text }]}>Speech</Text>

        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.rowBetween}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Enable TTS</Text>
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel="Enable speech"
              onPress={async () => {
                const next = !enabled;
                setEnabled(next);
                await setTtsEnabled(next);
              }}
              style={[
                styles.toggle,
                { backgroundColor: enabled ? theme.colors.primary : theme.colors.border },
              ]}
            >
              <View style={[styles.knob, { left: enabled ? 22 : 2 }]} />
            </Pressable>
          </View>
          <View style={{ height: baseTheme.spacing.md }} />
          <Text style={[styles.label, { color: theme.colors.text, marginBottom: 8 }]}>Speed</Text>
          <Slider
            value={rate}
            onValueChange={(v: number) => setRate(v)}
            onSlidingComplete={async (v: number) => {
              await setTtsRate(v);
            }}
            minimumValue={0.5}
            maximumValue={1.0}
            step={0.01}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <Text style={[styles.helper, { color: theme.colors.mutedText }]}>
            Slower can improve clarity for new words.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: baseTheme.colors.background },
  container: {
    flex: 1,
    backgroundColor: baseTheme.colors.background,
    padding: baseTheme.spacing.lg,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: baseTheme.spacing.lg,
    alignSelf: 'flex-start',
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    marginBottom: baseTheme.spacing.lg,
  },
  section: {
    padding: baseTheme.spacing.lg,
    borderRadius: baseTheme.radius.lg,
    borderWidth: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  helper: {
    marginTop: baseTheme.spacing.sm,
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    position: 'absolute',
  },
});
