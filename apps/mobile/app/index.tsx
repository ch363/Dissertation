import { Link, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../src/theme';

export default function Welcome() {
  return (
    <View style={styles.container}>
      <Image source={{ uri: 'https://via.placeholder.com/96' }} style={styles.logo} />
      <Text style={styles.title}>Dissertation</Text>
      <Text style={styles.subtitle}>Personalised learning, one step at a time.</Text>

      <Link href="/onboarding/step-1" style={[styles.button, styles.primary]}>Get Started</Link>
      <Link href="/(tabs)" style={[styles.button, styles.secondary]}>Log In</Link>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.card,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 28,
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    fontFamily: theme.typography.regular,
    color: theme.colors.mutedText,
  },
  button: {
    width: '100%',
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.semiBold,
    overflow: 'hidden',
  },
  primary: {
    backgroundColor: theme.colors.primary,
    color: '#fff',
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
    color: '#fff',
  },
});
