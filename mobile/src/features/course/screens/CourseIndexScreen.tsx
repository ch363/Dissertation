import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';

import { getModules, type Module } from '@/services/api/modules';
import { theme } from '@/services/theme/tokens';
import { useAppTheme } from '@/services/theme/ThemeProvider';

export default function CourseIndex() {
  const { theme: appTheme } = useAppTheme();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModules = async () => {
      setLoading(true);
      setError(null);
      try {
        const modulesData = await getModules();
        setModules(modulesData);
      } catch (err: any) {
        console.error('Failed to load modules:', err);
        setError(err?.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: appTheme.colors.background }]}>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: appTheme.colors.background }]}>
        <Text style={[styles.errorText, { color: appTheme.colors.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: appTheme.colors.background }]}>
      <Text style={[styles.title, { color: appTheme.colors.text }]}>Courses</Text>
      {modules.length === 0 ? (
        <Text style={[styles.emptyText, { color: appTheme.colors.mutedText }]}>
          No courses available
        </Text>
      ) : (
        modules.map((module, index) => {
          const isPrimary = index % 2 === 0;
          return (
            <Pressable
              key={module.id}
              style={[
                styles.button,
                isPrimary ? styles.primary : styles.secondary,
                { backgroundColor: isPrimary ? appTheme.colors.primary : appTheme.colors.secondary },
              ]}
              onPress={() => router.push(`/course/${module.id}`)}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: isPrimary ? appTheme.colors.onPrimary : appTheme.colors.onSecondary },
                ]}
              >
                {module.title}
              </Text>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 24,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: theme.typography.regular,
    fontSize: 16,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {},
  secondary: {},
  buttonText: {
    fontFamily: theme.typography.semiBold,
    fontSize: 16,
  },
});
