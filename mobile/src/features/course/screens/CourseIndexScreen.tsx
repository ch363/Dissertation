import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

import { theme } from '@/services/theme/tokens';

export default function CourseIndex() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Courses</Text>
      <Link href="/course/basics" style={[styles.button, styles.primary]}>
        Basics
      </Link>
      <Link href="/course/conversation" style={[styles.button, styles.secondary]}>
        Conversation
      </Link>
      <Link href="/course/milestones" style={[styles.button, styles.primary]}>
        Milestones
      </Link>
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
    fontSize: 24,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
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
  primary: { backgroundColor: theme.colors.primary, color: '#fff' },
  secondary: { backgroundColor: theme.colors.secondary, color: '#fff' },
});
