const PUBLIC_ROOT_SEGMENTS = ['auth', 'onboarding'] as const;

type LeafPaths<T> = T extends string ? T : { [K in keyof T]: LeafPaths<T[K]> }[keyof T];

export const routes = {
  root: '/' as const,
  tabs: {
    root: '/(tabs)' as const,
    home: '/(tabs)/home' as const,
    learn: '/(tabs)/learn' as const,
    profile: {
      root: '/(tabs)/profile' as const,
      index: '/(tabs)/profile' as const,
      progress: '/(tabs)/profile/progress' as const,
      achievements: '/(tabs)/profile/achievements' as const,
      edit: '/(tabs)/profile/edit' as const,
    },
    settings: {
      root: '/(tabs)/settings' as const,
      speech: '/(tabs)/settings/speech' as const,
    },
  },
  auth: {
    signIn: '/(auth)/sign-in' as const,
    signUp: '/(auth)/sign-up' as const,
    forgotPassword: '/(auth)/forgot-password' as const,
    updatePassword: '/(auth)/update-password' as const,
    verifyEmail: '/(auth)/verify-email' as const,
  },
  onboarding: {
    root: '/(onboarding)' as const,
    welcome: '/(onboarding)/welcome' as const,
    completion: '/(onboarding)/completion' as const,
  },
  course: {
    list: '/course' as const,
  },
  dev: {
    dbHealth: '/dev/db-health' as const,
  },
} as const;

export const routeBuilders = {
  courseDetail: (slug: string) => `/course/${slug}` as const,
  courseRun: (slug: string) => `/course/${slug}/run` as const,
};

export type StaticRoutePath = LeafPaths<typeof routes>;
export type DynamicRoutePath =
  | ReturnType<typeof routeBuilders.courseDetail>
  | ReturnType<typeof routeBuilders.courseRun>;
export type RoutePath = StaticRoutePath | DynamicRoutePath;

export const publicRootSegments = new Set<string>(PUBLIC_ROOT_SEGMENTS);

const normalizeSegment = (segment?: string) =>
  typeof segment === 'string' ? segment.replace(/[()]/g, '') : segment;

export const isPublicRootSegment = (segment?: string) => {
  const normalized = normalizeSegment(segment);
  return normalized === undefined || publicRootSegments.has(normalized);
};

