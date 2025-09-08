import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { theme } from '../../src/theme';

export default function Step1() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How do you prefer to learn?</Text>
      <View style={styles.options}>
        <Pressable style={styles.card}><Text style={styles.cardText}>Image</Text></Pressable>
        <Pressable style={styles.card}><Text style={styles.cardText}>Audio</Text></Pressable>
        <Pressable style={styles.card}><Text style={styles.cardText}>Text</Text></Pressable>
      </View>
      <View style={styles.progress}>
        <View style={[styles.dot, styles.activeDot]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
      <Link href="/onboarding/step-2" style={styles.next}>Next</Link>
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
    marginBottom: theme.spacing.lg,
  },
  options: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardText: {
    fontFamily: theme.typography.regular,
    color: theme.colors.text,
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
    backgroundColor: theme.colors.primary,
    color: '#fff',
    borderRadius: theme.radius.md,
  },
});
