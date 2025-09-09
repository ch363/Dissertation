import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../src/theme';
import { PrimaryButton } from './_components';

export default function OnboardingWelcome() {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Welcome to Fluentia</Text>
      <Text style={styles.body}>
        Please take a moment to complete our onboarding questions so we can tailor your learning experience to you.
      </Text>
      <PrimaryButton title="Start" onPress={() => router.push('/onboarding/motivation-goals')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.typography.semiBold,
    fontSize: 24,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  body: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    color: theme.colors.mutedText,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
});
