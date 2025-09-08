import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../src/theme';

export default function Progress() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Progress</Text>
      <View style={styles.circle} />
      <Text style={styles.subtitle}>XP: 320 • Streak: 12🔥</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Suggested: Flashcards</Text>
        <Text style={styles.cardSubtitle}>Keep the streak alive!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontFamily: theme.typography.bold,
    fontSize: 22,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontFamily: theme.typography.regular,
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 18,
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontFamily: theme.typography.regular,
    color: theme.colors.mutedText,
  },
});
