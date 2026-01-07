import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/services/theme/tokens';

export default function VerifyEmail() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a confirmation link to {email || 'your email address'}. Tap the link to activate
          your account, then log in.
        </Text>
        <Pressable
          style={[styles.button, styles.primary]}
          onPress={() => router.replace('/sign-in')}
        >
          <Text style={styles.buttonText}>Back to Log In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FB' },
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    backgroundColor: '#F5F7FB',
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 24,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.mutedText,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  button: {
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  primary: { backgroundColor: theme.colors.primary },
  buttonText: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
  },
});
