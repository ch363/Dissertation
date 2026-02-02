import { KNOWLEDGE_LEVEL } from '@prisma/client';

/**
 * Type definitions for search results
 */

export interface SearchableModule {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchableLesson {
  id: string;
  title: string;
  description: string | null;
  moduleId: string;
  createdAt: Date;
  updatedAt: Date;
  module: {
    id: string;
    title: string;
  };
}

export interface SearchableTeaching {
  id: string;
  userLanguageString: string;
  learningLanguageString: string;
  tip: string | null;
  lessonId: string;
  createdAt: Date;
  updatedAt: Date;
  lesson: {
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
    };
  };
}

export interface SearchableQuestion {
  id: string;
  teachingId: string;
  teaching: {
    id: string;
    userLanguageString: string;
    learningLanguageString: string;
    lesson: {
      id: string;
      title: string;
      module: {
        id: string;
        title: string;
      };
    };
  };
}

export interface SearchResults {
  modules: SearchableModule[];
  lessons: SearchableLesson[];
  teachings: SearchableTeaching[];
  questions: SearchableQuestion[];
}

export interface TeachingWhereCondition {
  knowledgeLevel?: KNOWLEDGE_LEVEL;
  OR?: Array<{
    userLanguageString?: { contains: string };
    learningLanguageString?: { contains: string };
    tip?: { contains: string };
  }>;
}
