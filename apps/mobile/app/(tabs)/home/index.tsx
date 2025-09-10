import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '../../../src/theme';
import { getCurrentUser } from '../../../src/lib/auth';

export default function HomeScreen() {
  const [name, setName] = useState<string>('');

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      // Prefer profile name from user metadata
      const metaName = (user?.user_metadata as any)?.name as string | undefined;
      const fallback = user?.email?.split('@')[0] ?? 'Learner';
      setName(metaName || fallback || 'Learner');
    })();
  }, []);

  return (
    <View style={styles.container}>
      {/* Curved top background */}
      <View style={styles.topBg} />

      {/* Centered logo */}
      <View style={styles.logoRow}>
        <Image source={require('../../../assets/logo.png')} style={styles.logoLarge} resizeMode="contain" />
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" hitSlop={10} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={22} color={theme.colors.mutedText} />
        </Pressable>
      </View>

      {/* Greeting */}
      <Text style={styles.greeting}>{name}</Text>

      {/* Intro card */}
      <View style={styles.introCard} accessibilityRole="summary">
        <Text style={styles.introOverline}>INTRODUCTION</Text>
        <Text style={styles.introTitle}>Basics</Text>
        <Text style={styles.introTag}>BEGINNER</Text>
      </View>

      {/* Learning path */}
      <LearningPath />

      {/* Floating ribbon/bookmark */}
      <View style={styles.floatingBookmark}>
        <Ionicons name="bookmark" size={18} color={'#0E607D'} />
      </View>
    </View>
  );
}

function LearningPath() {
  // Define node positions and routes
  const nodes = useMemo(
    () => [
      { x: 43, y: 31, icon: 'book' as const, bg: '#2FA9C7', slug: 'basics' },
      { x: 165, y: 95, icon: 'star' as const, bg: '#6AD2E9', slug: 'milestones' },
      { x: 43, y: 155, icon: 'chatbubble' as const, bg: '#2FA9C7', slug: 'conversation' },
      { x: 165, y: 215, icon: 'ribbon' as const, bg: '#2FA9C7', slug: 'achievements' },
      { x: 43, y: 275, icon: 'bookmark' as const, bg: '#2FA9C7', slug: 'bookmarks' },
    ],
    []
  );

  const segments = useMemo(() => buildSmoothSegments(nodes), [nodes]);

  return (
    <View style={styles.pathContainer}>
      {/* Flowing connector built from rotated segments (no native deps) */}
      {segments.map((s, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: s.cy - s.len / 2,
            left: s.cx - s.thickness / 2,
            width: s.thickness,
            height: s.len,
            backgroundColor: '#CBE6FA',
            borderRadius: s.thickness / 2,
            transform: [{ rotate: `${s.angle}rad` }],
          }}
        />
      ))}

      {/* Nodes as buttons */}
      {nodes.map((n, idx) => (
        <Pressable
          key={idx}
          onPress={() => router.push(`/course/${n.slug}`)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${n.slug} course`}
          style={[styles.node, { top: n.y - 31, left: n.x - 31, backgroundColor: n.bg }]}
        >
          <Ionicons name={n.icon} size={22} color={'#0E607D'} />
        </Pressable>
      ))}
    </View>
  );
}

type Node = { x: number; y: number };
function buildSmoothSegments(nodes: Node[]) {
  if (nodes.length < 2) return [] as { cx: number; cy: number; len: number; angle: number; thickness: number }[];
  // Sample a quadratic curve between each pair, then convert to rotated rect segments
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const cx = (a.x + b.x) / 2 + (b.x > a.x ? 16 : -16);
    const cy = (a.y + b.y) / 2 + (b.y > a.y ? 8 : -8);
    const steps = 10; // smoothness per segment
    for (let t = 0; t <= steps; t++) {
      const u = t / steps;
      // Quadratic Bezier formula
      const x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * cx + u * u * b.x;
      const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * cy + u * u * b.y;
      points.push({ x, y });
    }
  }
  // Build rotated segments between consecutive points
  const thickness = 14;
  const segs: { cx: number; cy: number; len: number; angle: number; thickness: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p = points[i];
    const q = points[i + 1];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx) + Math.PI / 2; // rotate rectangle to align vertically
    const cx = (p.x + q.x) / 2;
    const cy = (p.y + q.y) / 2;
    segs.push({ cx, cy, len, angle, thickness });
  }
  return segs;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  topBg: {
    position: 'absolute',
    top: -180,
    right: -120,
    width: 380,
    height: 280,
    backgroundColor: '#EAF4FF',
    borderBottomLeftRadius: 280,
    borderBottomRightRadius: 280,
    transform: [{ rotate: '18deg' }],
  },
  logoRow: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoLarge: {
    width: 56,
    height: 56,
    marginTop: 4,
  },
  settingsBtn: {
    position: 'absolute',
    right: 0,
    top: 6,
  },
  greeting: {
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.bold,
    fontSize: 28,
    color: theme.colors.text,
  },
  introCard: {
    marginTop: theme.spacing.lg,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  introOverline: {
    color: '#D7E8FF',
    fontFamily: theme.typography.semiBold,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  introTitle: {
    color: '#fff',
    fontFamily: theme.typography.bold,
    fontSize: 24,
    marginVertical: 2,
  },
  introTag: {
    color: '#D7E8FF',
    fontFamily: theme.typography.semiBold,
    fontSize: 12,
  },
  pathContainer: {
    marginTop: theme.spacing.lg,
    height: 320,
    width: '100%',
  },
  node: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#2FA9C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  nodeAccent: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#6AD2E9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  floatingBookmark: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CBE6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
