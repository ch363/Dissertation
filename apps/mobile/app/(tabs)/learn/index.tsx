import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../../../src/providers/ThemeProvider';

import { theme as baseTheme } from '@/theme';

export default function Learn() {
  const { theme } = useAppTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.card}>
          <Image source={{ uri: 'https://via.placeholder.com/300x160' }} style={styles.cardImage} />
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Flashcards</Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText }]}>
            Practice with images and words
          </Text>
          <Pressable style={[styles.button, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.buttonText}>Start</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Multiple Choice</Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText }]}>
            Colourful answer buttons
          </Text>
          <Pressable style={[styles.button, { backgroundColor: theme.colors.secondary }]}>
            <Text style={styles.buttonText}>Start</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Typing Prompt</Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText }]}>
            Type the translation
          </Text>
          <Pressable style={[styles.button, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.buttonText}>Start</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Audio Prompt</Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.mutedText }]}>
            Speak your answer
          </Text>
          <Pressable style={[styles.button, { backgroundColor: theme.colors.secondary }]}>
            <Text style={styles.buttonText}>Start</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: baseTheme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: baseTheme.colors.background,
    padding: baseTheme.spacing.lg,
  },
  card: {
    backgroundColor: baseTheme.colors.card,
    borderRadius: baseTheme.radius.lg,
    padding: baseTheme.spacing.lg,
    marginBottom: baseTheme.spacing.lg,
    borderWidth: 1,
    borderColor: baseTheme.colors.border,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: baseTheme.radius.md,
    marginBottom: baseTheme.spacing.md,
  },
  cardTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 20,
    color: baseTheme.colors.text,
  },
  cardSubtitle: {
    fontFamily: baseTheme.typography.regular,
    color: baseTheme.colors.mutedText,
    marginBottom: baseTheme.spacing.md,
  },
  button: {
    paddingVertical: 12,
    borderRadius: baseTheme.radius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontFamily: baseTheme.typography.semiBold,
  },
});
