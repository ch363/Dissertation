import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

import { useAppTheme } from '@/services/theme/ThemeProvider';
import { theme as baseTheme } from '@/services/theme/tokens';

type ActivityItem = {
  title: string;
  subtitle: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  onPress?: () => void;
};

type Props = {
  title: string;
  items: ActivityItem[];
  emptyMessage?: string;
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ActivityCard({ title, items, emptyMessage = 'No recent activity' }: Props) {
  const { theme } = useAppTheme();

  return (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {items.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.mutedText }]}>{emptyMessage}</Text>
        ) : (
          items.map((item, index) => {
            const content = (
              <Pressable
                style={[styles.item, index < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}
                onPress={item.onPress}
                disabled={!item.onPress && !item.route}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.content}>
                  <Text style={[styles.itemTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.itemSubtitle, { color: theme.colors.mutedText }]} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                <View style={styles.meta}>
                  <Text style={[styles.time, { color: theme.colors.mutedText }]} numberOfLines={1}>
                    {formatTimeAgo(item.time)}
                  </Text>
                  {/* Keep alignment uniform by reserving chevron space for all rows */}
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.colors.mutedText}
                    style={[styles.chevron, !(item.route || item.onPress) && styles.chevronPlaceholder]}
                  />
                </View>
              </Pressable>
            );

            if (item.route) {
              return (
                <Link key={index} href={item.route} asChild>
                  {content}
                </Link>
              );
            }

            return <React.Fragment key={index}>{content}</React.Fragment>;
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
    marginBottom: baseTheme.spacing.sm,
    marginTop: baseTheme.spacing.lg,
  },
  card: {
    borderRadius: baseTheme.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: baseTheme.spacing.md,
    gap: baseTheme.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 122, 224, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    // Prevent the content column from forcing the meta column off-screen.
    // This also makes `numberOfLines` truncation behave consistently in flex rows.
    minWidth: 0,
  },
  itemTitle: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 15,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 13,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    gap: baseTheme.spacing.xs,
    // Align time/chevron with the title line (not vertically centered across title+subtitle)
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  time: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 12,
    minWidth: 56,
    textAlign: 'right',
  },
  chevron: {
    marginTop: 0,
  },
  chevronPlaceholder: {
    opacity: 0,
  },
  emptyText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
    textAlign: 'center',
    padding: baseTheme.spacing.lg,
  },
});
