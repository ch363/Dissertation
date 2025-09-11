import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Link, router } from 'expo-router';
import { signUpWithEmail } from '../../src/lib/auth';
import { theme } from '../../src/theme';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const canContinue = name.trim() && email.trim() && password.length >= 6 && !loading;

  async function handleContinue() {
    try {
      setLoading(true);
      setErrorMsg(null);
  const { needsVerification } = await signUpWithEmail(name.trim(), email.trim(), password);
      if (needsVerification) {
        router.replace({ pathname: '/auth/verify-email', params: { email: email.trim() } });
      } else {
        router.push('/onboarding/welcome');
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
  <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Create your account</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={theme.colors.mutedText} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={theme.colors.mutedText} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry placeholderTextColor={theme.colors.mutedText} />
        </View>

        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
        <Pressable
          style={[styles.button, canContinue ? styles.primary : styles.disabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating account…' : 'Continue'}</Text>
        </Pressable>

        <Link href="/" style={styles.secondaryLink}>Back to Home</Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 24,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontFamily: theme.typography.semiBold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.text,
  },
  button: {
    marginTop: theme.spacing.lg,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  disabled: {
    backgroundColor: theme.colors.border,
  },
  buttonText: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
  },
  secondaryLink: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
    color: theme.colors.secondary,
  },
  error: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
});
