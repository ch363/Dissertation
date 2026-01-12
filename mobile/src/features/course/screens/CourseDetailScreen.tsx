import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { markModuleCompleted } from '@/app/api/progress';
import { routeBuilders, routes } from '@/services/navigation/routes';
import { theme } from '@/services/theme/tokens';

export default function CourseDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const title = (slug || 'course').toString().replace(/\b\w/g, (m) => m.toUpperCase());

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>A tailored course based on your onboarding preferences.</Text>

      <Pressable
        style={[styles.button, styles.primary]}
        onPress={() => router.push(routeBuilders.courseRun(String(slug || '')))}
      >
        <Text style={styles.buttonText}>Start</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.secondary]}
        onPress={async () => {
          await markModuleCompleted((slug || '').toString());
          router.replace(routes.tabs.home);
        }}
      >
        <Text style={styles.buttonText}>Mark Complete</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
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
    marginBottom: theme.spacing.lg,
  },
  button: {
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    width: '100%',
  },
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.secondary, marginTop: theme.spacing.md },
  buttonText: { color: '#fff', fontFamily: theme.typography.semiBold },
});
