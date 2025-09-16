import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useAppTheme,
  getTtsEnabled,
  setTtsEnabled,
  getTtsRate,
  setTtsRate,
} from '@/modules/settings';
import { theme as baseTheme } from '@/theme';

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
    router.replace('/settings');
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {showBack && (
          <Pressable accessibilityRole="button" onPress={handleBack} style={styles.backBtn}>
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
            Rate: {rate.toFixed(2)} (0.50–1.00)
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
    position: 'absolute',
    right: 16,
    top: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  title: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 22,
    marginBottom: baseTheme.spacing.lg,
  },
  section: {
    borderWidth: 1,
    borderRadius: baseTheme.radius.md,
    padding: baseTheme.spacing.md,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: baseTheme.typography.regular },
  toggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 2,
  },
  helper: { fontFamily: baseTheme.typography.regular, fontSize: 12, marginTop: 6 },
});
