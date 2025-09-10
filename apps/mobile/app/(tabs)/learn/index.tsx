import { View, Text, StyleSheet, Image, Pressable } from 'react-native';

import { theme } from '../../../src/theme';

export default function Learn() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image source={{ uri: 'https://via.placeholder.com/300x160' }} style={styles.cardImage} />
        <Text style={styles.cardTitle}>Flashcards</Text>
        <Text style={styles.cardSubtitle}>Practice with images and words</Text>
        <Pressable style={[styles.button, styles.primary]}>
          <Text style={styles.buttonText}>Start</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Multiple Choice</Text>
        <Text style={styles.cardSubtitle}>Colourful answer buttons</Text>
        <Pressable style={[styles.button, styles.secondary]}>
          <Text style={styles.buttonText}>Start</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Typing Prompt</Text>
        <Text style={styles.cardSubtitle}>Type the translation</Text>
        <Pressable style={[styles.button, styles.primary]}>
          <Text style={styles.buttonText}>Start</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Audio Prompt</Text>
        <Text style={styles.cardSubtitle}>Speak your answer</Text>
        <Pressable style={[styles.button, styles.secondary]}>
          <Text style={styles.buttonText}>Start</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 20,
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontFamily: theme.typography.regular,
    color: theme.colors.mutedText,
    marginBottom: theme.spacing.md,
  },
  button: {
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  buttonText: {
    color: '#fff',
    fontFamily: theme.typography.semiBold,
  },
});
