import { Link, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ScrollView } from '@/components/ui';

import { resolvePostAuthDestination, signUpWithEmail } from '@/services/api/auth';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme } from '@/services/theme/tokens';
import { announce } from '@/utils/a11y';

const emailRegex = /\S+@\S+\.\S+/;
const MIN_PASSWORD = 8;

export default function SignUp() {
  const { theme: appTheme } = useAppTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const trimmedEmail = email.trim();
  const trimmedName = name.trim();
  const passwordsMatch = password === confirmPassword;
  const emailError =
    trimmedEmail.length > 0 && !emailRegex.test(trimmedEmail) ? 'Enter a valid email address.' : null;
  const passwordError =
    password.length > 0 && password.length < MIN_PASSWORD
      ? `Password must be at least ${MIN_PASSWORD} characters.`
      : null;
  const confirmError = !passwordsMatch && confirmPassword.length > 0 ? 'Passwords do not match.' : null;
  const canSubmit =
    emailRegex.test(trimmedEmail) && password.length >= MIN_PASSWORD && passwordsMatch && !loading;

  const handleSignUp = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError(null);
      const { session, user } = await signUpWithEmail(trimmedName || null, trimmedEmail, password);

      // If email confirmation is required, Supabase will not return a session.
      // In this case, Supabase should have sent a confirmation email.
      if (!session) {
        console.log('SignUp: No session returned - email confirmation required');
        // Check if user was created (even without session)
        if (user) {
          console.log('SignUp: User created, redirecting to verify-email screen');
          router.replace({ pathname: '/verify-email', params: { email: trimmedEmail } });
          return;
        } else {
          // No user and no session - this shouldn't happen, but handle it
          console.warn('SignUp: No session and no user returned');
          setError('Account creation may require email confirmation. Please check your email.');
          return;
        }
      }

      // Session exists - user is immediately authenticated (email confirmation disabled)
      const userId = session?.user?.id || user?.id;
      if (userId) {
        console.log('SignUp: Session exists, resolving destination for user', userId);
        const destination = await resolvePostAuthDestination(userId);
        router.replace(destination);
      } else {
        console.warn('SignUp: Session exists but no user ID found');
        router.replace('/sign-in');
      }
    } catch (e: any) {
      console.error('SignUp: Error during sign-up', e);
      const errorMessage = e?.message ?? 'Unable to create your account.';
      setError(errorMessage);
      // If it's an email-related error, provide more context
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        setError(`${errorMessage} Please check your email address and try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error) announce(error);
  }, [error]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: appTheme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: appTheme.colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: appTheme.colors.card, borderColor: appTheme.colors.border }]}>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive, { backgroundColor: appTheme.colors.primary }]} />
            <View style={[styles.stepDot, { backgroundColor: appTheme.colors.border }]} />
            <View style={[styles.stepDot, { backgroundColor: appTheme.colors.border }]} />
          </View>
          <Text style={[styles.labelSmall, { color: appTheme.colors.mutedText }]}>Step 1 of 3</Text>
          <Text style={[styles.title, { color: appTheme.colors.text }]} accessibilityRole="header">Create your account</Text>

          <Text style={[styles.inputLabel, { color: appTheme.colors.text }]}>Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: appTheme.colors.card, borderColor: appTheme.colors.border, color: appTheme.colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={appTheme.colors.mutedText}
            accessibilityLabel="Name"
            accessibilityHint="Enter your name"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <Text style={[styles.inputLabel, { color: appTheme.colors.text }]}>Email</Text>
          <TextInput
            ref={emailRef}
            style={[styles.input, { backgroundColor: appTheme.colors.card, borderColor: appTheme.colors.border, color: appTheme.colors.text }]}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={appTheme.colors.mutedText}
            accessibilityLabel="Email"
            accessibilityHint="Enter your email address"
            accessibilityState={{ invalid: !!emailError }}
            autoComplete="email"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          {emailError ? (
            <Text style={[styles.error, { color: appTheme.colors.error }]} accessibilityRole="alert">
              {emailError}
            </Text>
          ) : null}

          <Text style={[styles.inputLabel, { color: appTheme.colors.text }]}>Password</Text>
          <TextInput
            ref={passwordRef}
            style={[styles.input, { backgroundColor: appTheme.colors.card, borderColor: appTheme.colors.border, color: appTheme.colors.text }]}
            value={password}
            onChangeText={setPassword}
            placeholder={`Min. ${MIN_PASSWORD} characters`}
            secureTextEntry
            placeholderTextColor={appTheme.colors.mutedText}
            accessibilityLabel="Password"
            accessibilityHint="Create a password"
            accessibilityState={{ invalid: !!passwordError }}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          {passwordError ? (
            <Text style={styles.error} accessibilityRole="alert">
              {passwordError}
            </Text>
          ) : null}

          <Text style={[styles.inputLabel, { color: appTheme.colors.text }]}>Confirm password</Text>
          <TextInput
            ref={confirmRef}
            style={[styles.input, { backgroundColor: appTheme.colors.card, borderColor: appTheme.colors.border, color: appTheme.colors.text }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            secureTextEntry
            placeholderTextColor={appTheme.colors.mutedText}
            accessibilityLabel="Confirm password"
            accessibilityHint="Re-enter your password to confirm"
            accessibilityState={{ invalid: !!confirmError }}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
          />

          {confirmError ? (
            <Text style={[styles.error, { color: appTheme.colors.error }]} accessibilityRole="alert">
              {confirmError}
            </Text>
          ) : null}
          {error ? (
            <Text style={[styles.error, { color: appTheme.colors.error }]} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <Button
            title={loading ? 'Creating account…' : 'Create Account'}
            onPress={handleSignUp}
            disabled={!canSubmit}
            loading={loading}
            accessibilityHint="Creates your account"
          />

          <Link href="/sign-in" style={[styles.link, { color: appTheme.colors.link }]}>
            Already have an account? Sign in
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'center',
    marginBottom: theme.spacing.sm,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepDotActive: {},
  labelSmall: {
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.semiBold,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 22,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  inputLabel: {
    fontFamily: theme.typography.semiBold,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: theme.spacing.md,
  },
  link: {
    fontFamily: theme.typography.semiBold,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  error: {
    marginTop: theme.spacing.xs,
  },
});
