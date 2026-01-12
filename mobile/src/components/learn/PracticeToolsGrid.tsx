import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PracticeTool } from '@/features/learn/mock';
import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type Props = {
  tools: PracticeTool[];
};

export function PracticeToolsGrid({ tools }: Props) {
  const { theme } = useAppTheme();
  const router = useRouter();

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Practice Tools</Text>
      <Text style={[styles.subtitle, { color: theme.colors.mutedText }]}>
        Pick a practice method to strengthen your skills
      </Text>
      <View style={styles.grid}>
        {tools.map((tool) => {
          const isLocked = Boolean(tool.locked);
          return (
            <Pressable
              key={tool.id}
              accessibilityRole="button"
              onPress={() => {
                if (isLocked) return;
                router.push(tool.route as any);
              }}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: tool.color,
                  opacity: isLocked ? 0.55 : pressed ? 0.9 : 1,
                  shadowColor: '#0D1B2A',
                },
              ]}
            >
              <View style={styles.cardInner}>
                <View style={styles.illustration} />
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{tool.title}</Text>
                  {isLocked ? (
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={14} color="#8A6B00" />
                      <Text style={styles.lockBadgeText}>Locked</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.cardSubtitle}>{tool.subtitle}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: baseTheme.spacing.lg,
    paddingHorizontal: baseTheme.spacing.lg,
    gap: baseTheme.spacing.xs,
  },
  title: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 18,
  },
  subtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  grid: {
    marginTop: baseTheme.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: baseTheme.spacing.md,
  },
  card: {
    flexBasis: '47%',
    borderRadius: 18,
    padding: baseTheme.spacing.md,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  cardInner: {
    gap: baseTheme.spacing.sm,
  },
  illustration: {
    height: 64,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: baseTheme.spacing.xs,
  },
  cardTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
  },
  lockBadge: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    paddingHorizontal: baseTheme.spacing.xs,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockBadgeText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 12,
    color: '#8A6B00',
  },
});
