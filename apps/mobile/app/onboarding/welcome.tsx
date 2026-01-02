import { router } from 'expo-router';
import { View, Text, StyleSheet, Image } from 'react-native';

import { PrimaryButton } from './_components';

import { theme } from '@/theme';

export default function OnboardingWelcome() {
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.headline}>Learn Italian,{'\n'}your way.</Text>
      <Text style={styles.subtext}>
        Just a few quick questions to{'\n'}personalize your learning experience (1–2 mins)
      </Text>
      <Image
        source={require('../../assets/colosseum.png')}
        style={styles.colosseum}
        resizeMode="contain"
      />
      <PrimaryButton
        title="Start My Journey"
        onPress={() => router.push('/onboarding/1_motivation-goals')}
        style={styles.cta}
        textStyle={styles.ctaText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    lineHeight: 40,
  },
  subtext: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    color: theme.colors.mutedText,
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
