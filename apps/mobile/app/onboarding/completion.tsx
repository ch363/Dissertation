import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../src/theme';
import { PrimaryButton } from './_components';

export default function OnboardingCompletion() {
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.headline}>Thanks for completing the setup</Text>
      <Text style={styles.subtext}>
        We’ll use your answers to tailor Fluentia to your goals and learning style.
      </Text>

      <PrimaryButton
        title="Continue"
        onPress={() => router.replace('/(tabs)')}
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
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.lg,
  },
  headline: {
    fontFamily: theme.typography.bold,
    fontSize: 28,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    color: theme.colors.mutedText,
    textAlign: 'center',
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
