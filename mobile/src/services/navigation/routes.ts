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
      edit: '/(tabs)/profile/edit' as const,
      skills: '/(tabs)/profile/skills' as const,
    },
    settings: {
      root: '/(tabs)/settings' as const,
      speech: '/(tabs)/settings/speech' as const,
      session: '/(tabs)/settings/session' as const,
      sessionLesson: '/(tabs)/settings/session-lesson' as const,
      help: '/(tabs)/settings/help' as const,
      faq: '/(tabs)/settings/faq' as const,
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
    help: '/(onboarding)/help' as const,
  },
  session: {
    root: '/session' as const,
  },
  course: {
    list: '/course' as const,
  },
  practice: {
    flashcards: '/practice/flashcards' as const,
    typing: '/practice/typing' as const,
    listening: '/practice/listening' as const,
  },
} as const;

export const routeBuilders = {
  courseDetail: (slug: string) => `/course/${slug}` as const,
  courseRun: (slug: string) => `/course/${slug}/run` as const,
  sessionDetail: (sessionId: string) => `/session/${sessionId}` as const,
  sessionCompletion: (sessionId: string) => `/session/${sessionId}/completion` as const,
  sessionSummary: (sessionId: string) => `/session/${sessionId}/summary` as const,
};

export type StaticRoutePath = LeafPaths<typeof routes>;
export type DynamicRoutePath =
  | ReturnType<typeof routeBuilders.courseDetail>
  | ReturnType<typeof routeBuilders.courseRun>
  | ReturnType<typeof routeBuilders.sessionDetail>
  | ReturnType<typeof routeBuilders.sessionCompletion>
  | ReturnType<typeof routeBuilders.sessionSummary>;
export type RoutePath = StaticRoutePath | DynamicRoutePath;

export const publicRootSegments = new Set<string>(PUBLIC_ROOT_SEGMENTS);

const normalizeSegment = (segment?: string) =>
  typeof segment === 'string' ? segment.replace(/[()]/g, '') : segment;

export const isPublicRootSegment = (segment?: string) => {
  const normalized = normalizeSegment(segment);
  // Only consider routes public if they explicitly match public segments
  // undefined/empty segments (like index route) should not be considered public
  return normalized !== undefined && publicRootSegments.has(normalized);
};
