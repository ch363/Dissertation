import { router } from 'expo-router';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/onboarding/_components';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme } from '@/services/theme/tokens';

export default function OnboardingWelcome() {
  const { theme } = useAppTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.headline, { color: theme.colors.text }]}>Learn Italian,{'\n'}your way.</Text>
        <Text style={[styles.subtext, { color: theme.colors.mutedText }]}>
          Just a few quick questions to{'\n'}personalize your learning experience (1–2 mins)
        </Text>
        <Image
          source={require('@/assets/colosseum.png')}
          style={styles.colosseum}
          resizeMode="contain"
        />
        <PrimaryButton
          title="Start My Journey"
          onPress={() => {
            router.replace('/(onboarding)/1_motivation-goals');
          }}
          style={styles.cta}
          textStyle={styles.ctaText}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  headline: {
    fontFamily: theme.typography.bold,
    fontSize: 34,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    lineHeight: 40,
  },
  subtext: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  colosseum: {
    width: 240,
    height: 220,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  cta: {
    width: '100%',
    borderRadius: 20,
  },
  ctaText: {
    fontSize: 18,
  },
});
