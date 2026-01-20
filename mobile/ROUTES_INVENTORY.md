# Mobile route inventory (Expo Router)

This document enumerates navigable routes under `mobile/src/app/` and maps them to their feature screens/components.

## Route map

### Root
- `/` → `src/app/index.tsx` (Landing UI) **High risk**: theming + buttons a11y
- `/_layout` → `src/app/_layout.tsx` (global providers + stack config) **High risk**: reduce-motion + global defaults
- `+not-found` → `src/app/+not-found.tsx` (global error UI) **High risk**: button contrast + semantics

### Auth (`/(auth)/*`)
- `/(auth)/sign-in` → `src/features/auth/screens/SignInScreen`
- `/(auth)/sign-up` → `src/features/auth/screens/SignUpScreen`
- `/(auth)/forgot-password` → `src/features/auth/screens/ForgotPasswordScreen`
- `/(auth)/verify-email` → `src/features/auth/screens/VerifyEmailScreen`
- `/(auth)/update-password` → `src/features/auth/screens/UpdatePasswordScreen`

**High risk**: form inputs (labels), error identification/announcement, keyboard flow, focus order.

### Onboarding (`/(onboarding)/*`)
- `/(onboarding)/welcome` → `src/features/onboarding/screens/OnboardingWelcomeScreen`
- `/(onboarding)/1_motivation-goals` → `OnboardingMotivationGoalsScreen`
- `/(onboarding)/2_preferred-learning` → `OnboardingPreferredLearningScreen`
- `/(onboarding)/3_memory-habits` → `OnboardingMemoryHabitsScreen`
- `/(onboarding)/4_difficulty` → `OnboardingDifficultyScreen`
- `/(onboarding)/5_gamification` → `OnboardingGamificationScreen`
- `/(onboarding)/6_feedback-style` → `OnboardingFeedbackStyleScreen`
- `/(onboarding)/7_session-style` → `OnboardingSessionStyleScreen`
- `/(onboarding)/8_tone` → `OnboardingToneScreen`
- `/(onboarding)/9_experience-level` → `OnboardingExperienceLevelScreen`
- `/(onboarding)/completion` → `OnboardingCompletionScreen`

**High risk**: multi-step flow consistency, input affordances, large text wrapping, clear progress feedback.

### Tabs (`/(tabs)/*`)

#### Home
- `/(tabs)/home` → `src/features/home/screens/HomeScreen`

#### Learn
- `/(tabs)/learn` → `src/features/learn/screens/LearnScreen`
- `/(tabs)/learn/list` → `src/features/learn/screens/LessonListScreen`
- `/(tabs)/learn/[lessonId]` → `src/features/learn/screens/LessonOverviewScreen`
- `/(tabs)/learn/[lessonId]/start` → `src/features/session/screens/LessonStartScreen`
- `/(tabs)/learn/review` → `src/features/review/screens/ReviewOverviewScreen`

**High risk**: long lists, dynamic content updates, navigation announcements.

#### Profile
- `/(tabs)/profile` → `src/features/profile/screens/ProfileScreen`
- `/(tabs)/profile/progress` → `src/features/profile/screens/ProfileProgressScreen`
- `/(tabs)/profile/skills` → `src/features/profile/screens/ProfileSkillsScreen`
- `/(tabs)/profile/reviews` → `src/features/profile/screens/ProfileReviewsScreen`

#### Settings
- `/(tabs)/settings` → `src/features/settings/screens/SettingsScreen`
- `/(tabs)/settings/speech` → `src/features/settings/screens/SpeechSettingsScreen`
- `/(tabs)/settings/session` → `src/features/settings/screens/SessionDefaultsScreen`
- `/(tabs)/settings/session-lesson` → `src/features/settings/screens/SessionLessonPickerScreen`

**High risk**: toggle semantics/labels, destructive actions (sign-out), consistency of row components.

### Course (`/course/*`)
- `/course` → `src/features/course/screens/CourseIndexScreen`
- `/course/[slug]` → `src/features/course/screens/CourseDetailScreen`
- `/course/[slug]/run` → `src/features/course/screens/CourseRunScreen` (via `src/app/course/[slug]/run.tsx`)

### Session (`/session/*`)
- `/session/[sessionId]` → `src/features/session/screens/SessionRunnerScreen`
- `/session/[sessionId]/summary` → `src/features/session/screens/SessionSummaryScreen`
- `/session/[sessionId]/completion` → `src/features/session/screens/CompletionScreen`

**High risk**: audio + recording interactions, time-based UI, error recovery, state announcements.

### Practice (`/practice/*`)
- `/practice/flashcards` → `src/app/practice/flashcards.tsx` (route-local UI)
- `/practice/typing` → `src/app/practice/typing.tsx` (route-local UI)
- `/practice/listening` → `src/app/practice/listening.tsx` (route-local UI)

## Notes
- Typed path constants live in `src/services/navigation/routes.ts`.
- Many route files are thin re-exports; most accessibility work is implemented in `src/features/**` and shared components under `src/components/**`.

