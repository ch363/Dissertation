import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { theme } from '../src/theme';

export default function SignupLogin() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Fluentia</Text>
      <Text style={styles.subtitle}>Create an account or log in to continue.</Text>
      <Link href="/auth/signup" style={[styles.button, styles.primary]}>Create account</Link>
      <Link href="/auth/login" style={[styles.button, styles.secondary]}>Log in</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 28,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontFamily: theme.typography.regular,
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.xl,
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
