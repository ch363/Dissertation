/**
 * Onboarding Screens Configuration
 *
 * Centralized configuration for all onboarding screens.
 * Reduces code duplication and makes it easy to add/modify screens.
 */

export interface OnboardingOption {
  key: string;
  icon: string;
  label: string;
  description: string;
}

export interface OnboardingScreenConfig {
  id: string;
  step: number;
  title: string;
  answerKey: string;
  nextRoute: string;
  options: OnboardingOption[];
}

export const onboardingScreens: OnboardingScreenConfig[] = [
  {
    id: 'difficulty',
    step: 4,
    title: 'Preferred difficulty',
    answerKey: 'difficulty',
    nextRoute: '/(onboarding)/5_gamification',
    options: [
      {
        key: 'easy',
        icon: 'happy-outline',
        label: 'Keep it easy',
        description: 'Comfortable pace with gentle progression',
      },
      {
        key: 'balanced',
        icon: 'scale-outline',
        label: 'Balanced challenge',
        description: 'Mix of review and new material',
      },
      {
        key: 'hard',
        icon: 'flame-outline',
        label: 'Push me hard',
        description: 'Aggressive learning with tough questions',
      },
    ],
  },
  {
    id: 'gamification',
    step: 5,
    title: 'Gamification style',
    answerKey: 'gamification',
    nextRoute: '/(onboarding)/6_memory_habits',
    options: [
      {
        key: 'minimal',
        icon: 'remove-circle-outline',
        label: 'Minimal',
        description: 'Focus on learning without distractions',
      },
      {
        key: 'balanced',
        icon: 'star-outline',
        label: 'Balanced',
        description: 'Some points and progress tracking',
      },
      {
        key: 'full',
        icon: 'trophy-outline',
        label: 'Full gamification',
        description: 'Achievements, leaderboards, and rewards',
      },
    ],
  },
  {
    id: 'memory_habits',
    step: 6,
    title: 'Memory & study habits',
    answerKey: 'memoryHabits',
    nextRoute: '/(onboarding)/7_session_style',
    options: [
      {
        key: 'quick',
        icon: 'flash-outline',
        label: 'Quick bursts',
        description: 'Short 5-10 minute sessions',
      },
      {
        key: 'moderate',
        icon: 'time-outline',
        label: 'Moderate sessions',
        description: '15-20 minute focused learning',
      },
      {
        key: 'deep',
        icon: 'book-outline',
        label: 'Deep dives',
        description: '30+ minute immersive sessions',
      },
    ],
  },
  {
    id: 'session_style',
    step: 7,
    title: 'Session style',
    answerKey: 'sessionStyle',
    nextRoute: '/(onboarding)/8_tone',
    options: [
      {
        key: 'structured',
        icon: 'list-outline',
        label: 'Structured',
        description: 'Follow a clear learning path',
      },
      {
        key: 'flexible',
        icon: 'shuffle-outline',
        label: 'Flexible',
        description: 'Mix of different activities',
      },
      {
        key: 'adaptive',
        icon: 'trending-up-outline',
        label: 'Adaptive',
        description: 'Adjusts to your performance',
      },
    ],
  },
  {
    id: 'tone',
    step: 8,
    title: 'Teaching tone',
    answerKey: 'tone',
    nextRoute: '/(onboarding)/9_feedback_style',
    options: [
      {
        key: 'friendly',
        icon: 'happy-outline',
        label: 'Friendly',
        description: 'Encouraging and supportive',
      },
      {
        key: 'professional',
        icon: 'briefcase-outline',
        label: 'Professional',
        description: 'Direct and to the point',
      },
      {
        key: 'casual',
        icon: 'chatbubbles-outline',
        label: 'Casual',
        description: 'Relaxed and conversational',
      },
    ],
  },
  {
    id: 'feedback_style',
    step: 9,
    title: 'Feedback style',
    answerKey: 'feedbackStyle',
    nextRoute: '/(onboarding)/10_preferred_learning',
    options: [
      {
        key: 'immediate',
        icon: 'flash-outline',
        label: 'Immediate',
        description: 'Get feedback right away',
      },
      {
        key: 'summary',
        icon: 'list-outline',
        label: 'Summary',
        description: 'Review at the end of session',
      },
      {
        key: 'balanced',
        icon: 'scale-outline',
        label: 'Balanced',
        description: 'Mix of both approaches',
      },
    ],
  },
  {
    id: 'preferred_learning',
    step: 10,
    title: 'Preferred learning style',
    answerKey: 'preferredLearning',
    nextRoute: '/(onboarding)/completion',
    options: [
      {
        key: 'visual',
        icon: 'eye-outline',
        label: 'Visual',
        description: 'Images, diagrams, and examples',
      },
      {
        key: 'auditory',
        icon: 'volume-high-outline',
        label: 'Auditory',
        description: 'Listen and speak practice',
      },
      {
        key: 'kinesthetic',
        icon: 'hand-left-outline',
        label: 'Hands-on',
        description: 'Interactive exercises',
      },
      {
        key: 'reading',
        icon: 'book-outline',
        label: 'Reading/Writing',
        description: 'Text-based learning',
      },
    ],
  },
];

/**
 * Get screen configuration by ID
 */
export function getScreenConfig(id: string): OnboardingScreenConfig | undefined {
  return onboardingScreens.find((screen) => screen.id === id);
}

/**
 * Get screen configuration by step number
 */
export function getScreenConfigByStep(step: number): OnboardingScreenConfig | undefined {
  return onboardingScreens.find((screen) => screen.step === step);
}
