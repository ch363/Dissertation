/**
 * Reusable Prisma select and include objects
 * Promotes DRY by centralizing common query patterns
 */

/**
 * Common select pattern for module references
 * Used when including module data in related queries
 */
export const moduleSelect = {
  id: true,
  title: true,
} as const;

/**
 * Extended module select with image
 */
export const moduleSelectWithImage = {
  id: true,
  title: true,
  imageUrl: true,
} as const;

/**
 * Common select pattern for lesson references
 * Used when including lesson data in related queries
 */
export const lessonSelect = {
  id: true,
  title: true,
  imageUrl: true,
} as const;

/**
 * Basic lesson select without image
 */
export const lessonSelectBasic = {
  id: true,
  title: true,
} as const;

/**
 * Common include pattern for module relation
 */
export const moduleInclude = {
  module: {
    select: moduleSelect,
  },
} as const;

/**
 * Common include pattern for lesson relation
 */
export const lessonInclude = {
  lesson: {
    select: lessonSelect,
  },
} as const;

/**
 * Include pattern for lesson with its module
 */
export const lessonWithModuleInclude = {
  lesson: {
    select: {
      ...lessonSelect,
      module: {
        select: moduleSelect,
      },
    },
  },
} as const;

/**
 * Teaching select for progress queries
 */
export const teachingSelectBasic = {
  id: true,
  userLanguageString: true,
  learningLanguageString: true,
  emoji: true,
} as const;

/**
 * Question select for session queries
 */
export const questionSelectBasic = {
  id: true,
  teachingId: true,
} as const;

/**
 * Teaching select with strings (commonly used in questions)
 * Used when needing teaching translation strings
 */
export const teachingWithStrings = {
  id: true,
  userLanguageString: true,
  learningLanguageString: true,
} as const;

/**
 * Teaching include with strings for question queries
 */
export const teachingIncludeWithStrings = {
  teaching: {
    select: teachingWithStrings,
  },
} as const;

/**
 * Teaching include with strings and lesson
 * Used in detailed question queries
 */
export const teachingIncludeWithLesson = {
  teaching: {
    select: {
      ...teachingWithStrings,
      lesson: {
        select: lessonSelectBasic,
      },
    },
  },
} as const;

/**
 * Lesson with module select (commonly used pattern)
 */
export const lessonWithModule = {
  id: true,
  title: true,
  imageUrl: true,
  module: { select: moduleSelect },
} as const;

/**
 * Module with lessons ordered by creation
 */
export const moduleLessonsInclude = {
  lessons: {
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

/**
 * Lesson with teachings ordered by creation
 */
export const lessonTeachingsInclude = {
  teachings: {
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

/**
 * Teaching with questions
 */
export const teachingQuestionsInclude = {
  questions: true,
} as const;
