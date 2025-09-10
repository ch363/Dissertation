import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '../../../src/theme';
import { getCurrentUser } from '../../../src/lib/auth';
import { getCompletedModules, markModuleCompleted } from '../../../src/lib/progress';

export default function HomeScreen() {
  const [name, setName] = useState<string>('');
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      // Prefer profile name from user metadata
      const metaName = (user?.user_metadata as any)?.name as string | undefined;
      const fallback = user?.email?.split('@')[0] ?? 'Learner';
      setName(metaName || fallback || 'Learner');
      const done = await getCompletedModules();
      setCompleted(done);
    })();
  }, []);

  return (
    <View style={styles.container}>
      {/* Curved top background */}
      <View style={styles.topBg} />

      {/* Centered logo + title */}
      <View style={styles.logoRow}>
        <Image source={require('../../../assets/logo.png')} style={styles.logoXL} resizeMode="contain" />
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" hitSlop={10} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={22} color={theme.colors.mutedText} />
        </Pressable>
      </View>
      <Text style={styles.brand}>Fluentia</Text>

      {/* Flowing connectors behind modules */}
      <ModuleFlowBackdrop />

      {/* Modules list */}
      <ModuleList completed={completed} onLocked={() => Alert.alert('Locked', 'Complete the previous module to unlock this one.')} />
    </View>
  );
}
function ModuleFlowBackdrop() {
  // Bezier-like path following the module stack using rotated segments
  const anchors = [
    { x: 300, y: 160 },
    { x: 70, y: 260 },
    { x: 320, y: 380 },
    { x: 100, y: 520 },
  ];
  const segments = useMemo(() => buildSegments(anchors), []);
  return (
    <View pointerEvents="none" style={styles.flowBackdrop}>
      {segments.map((s, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: s.cy - s.len / 2,
            left: s.cx - s.thickness / 2,
            width: s.thickness,
            height: s.len,
            backgroundColor: 'rgba(203,230,250,0.65)',
            borderRadius: s.thickness / 2,
            transform: [{ rotate: `${s.angle}rad` }],
          }}
        />
      ))}
    </View>
  );
}

function ModuleList({ completed, onLocked }: { completed: string[]; onLocked: () => void }) {
  const modules = [
    { title: 'Basics', slug: 'basics', icon: 'star' as const },
    { title: 'Common Phrases', slug: 'common-phrases', icon: 'ellipse' as const },
    { title: 'Travel', slug: 'travel', icon: 'ellipse' as const },
    { title: 'Food', slug: 'food', icon: 'lock-closed' as const },
  ];

  const isUnlocked = (index: number, slug: string) => {
    if (index === 0) return true;
    const prevSlug = modules[index - 1].slug;
    return completed.includes(prevSlug);
  };

  return (
    <View style={{ marginTop: theme.spacing.lg }}>
      {modules.map((m, idx) => {
        const unlocked = isUnlocked(idx, m.slug);
        const disabled = !unlocked;
        return (
          <Pressable
            key={m.slug}
            onPress={() => (disabled ? onLocked() : router.push(`/course/${m.slug}`))}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            style={[styles.modulePill, disabled && styles.modulePillLocked]}
          >
            {/* Left circular icon */}
            <View style={[styles.moduleIconCircle, disabled && { opacity: 0.5 }]}> 
              <Ionicons name={m.icon} size={18} color={'#0E607D'} />
            </View>
            <Text style={[styles.moduleTitle, disabled && { color: '#72839B' }]}>{m.title}</Text>
            {/* Shine overlay to mimic gradient */}
            <View style={styles.moduleShine} />
          </Pressable>
        );
      })}
    </View>
  );
}

function buildSegments(points: { x: number; y: number }[]) {
  if (points.length < 2) return [] as { cx: number; cy: number; len: number; angle: number; thickness: number }[];
  const thickness = 26;
  const segs: { cx: number; cy: number; len: number; angle: number; thickness: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p = points[i];
    const q = points[i + 1];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const steps = 16;
    // Sample along straight segment and curve slightly by offsetting control
    for (let t = 0; t < steps; t++) {
      const u = t / steps;
      const x1 = p.x + dx * u;
      const y1 = p.y + dy * u;
      const x2 = p.x + dx * (u + 1 / steps);
      const y2 = p.y + dy * (u + 1 / steps);
      // gentle sine offset to simulate curve
      const offset = Math.sin(u * Math.PI) * 16;
      const nx = -dy / Math.max(1, Math.hypot(dx, dy));
      const ny = dx / Math.max(1, Math.hypot(dx, dy));
      const px = (x1 + x2) / 2 + nx * offset;
      const py = (y1 + y2) / 2 + ny * offset;
      const angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
      const len = Math.hypot(x2 - x1, y2 - y1);
      segs.push({ cx: px, cy: py, len, angle, thickness });
    }
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
  logoXL: { width: 72, height: 72, marginTop: 4 },
  settingsBtn: {
    position: 'absolute',
    right: 0,
    top: 6,
  },
  brand: { marginTop: 8, fontFamily: theme.typography.bold, fontSize: 32, color: theme.colors.text },
  flowBackdrop: { position: 'absolute', left: 0, right: 0, top: 140, bottom: 0 },
  pathContainer: { marginTop: theme.spacing.lg, height: 320, width: '100%' },
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
  modulePill: {
    marginHorizontal: 0,
    marginVertical: 10,
    backgroundColor: '#B7EBFF',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#006D8F',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    overflow: 'hidden',
  },
  modulePillLocked: {
    backgroundColor: 'rgba(183,235,255,0.5)',
  },
  moduleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8DE0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  moduleTitle: {
    fontFamily: theme.typography.semiBold,
    fontSize: 20,
    color: '#0D1B2A',
  },
  moduleShine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '55%',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});
