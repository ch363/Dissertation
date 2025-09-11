import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, Pressable } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';
import { PrimaryButton } from '../onboarding/_components';
import { signInWithEmail } from '../../src/lib/auth';

export default function Login() {
  const navigation = useNavigation();
  function goBack() {
    try {
      // @ts-ignore - type bridge
      if (navigation?.canGoBack?.()) {
        // @ts-ignore
        navigation.goBack();
        return;
      }
    } catch {}
    router.replace('/');
  }
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    try {
      setLoading(true);
      await signInWithEmail(email.trim(), password);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Login failed', e.message ?? 'Please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.mutedText} />
        </Pressable>
        <Text style={styles.title}>Log in</Text>
      </View>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={styles.input} />
      <PrimaryButton title={loading ? 'Logging in…' : 'Log in'} onPress={onLogin} disabled={!email || !password || loading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 28,
    color: theme.colors.text,
  },
});
