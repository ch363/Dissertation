import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { theme } from '../../src/theme';

export default function Step2() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick your focus</Text>
      <Text style={styles.subtitle}>Vocabulary • Grammar • Listening</Text>
      <View style={styles.progress}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.activeDot]} />
        <View style={styles.dot} />
      </View>
      <Link href="/(tabs)" style={styles.next}>Continue</Link>
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
    fontFamily: theme.typography.semiBold,
    fontSize: 22,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontFamily: theme.typography.regular,
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.lg,
  },
  progress: {
    flexDirection: 'row',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.border,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
  },
  next: {
    marginTop: theme.spacing.xl,
    paddingVertical: 14,
    textAlign: 'center',
    backgroundColor: theme.colors.secondary,
    color: '#fff',
    borderRadius: theme.radius.md,
  },
});
