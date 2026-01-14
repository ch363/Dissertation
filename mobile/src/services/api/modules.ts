import { apiClient } from './client';

export interface Module {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  numberOfItems: number;
  moduleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Teaching {
  id: string;
  knowledgeLevel: string;
  emoji?: string | null;
  userLanguageString: string;
  learningLanguageString: string;
  learningLanguageAudioUrl?: string | null;
  tip?: string | null;
  lessonId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all modules
 */
export async function getModules(): Promise<Module[]> {
  return apiClient.get<Module[]>('/modules');
}

/**
 * Get module by ID or slug (title)
 */
export async function getModule(moduleIdOrSlug: string): Promise<Module> {
  return apiClient.get<Module>(`/modules/${moduleIdOrSlug}`);
}

/**
 * Get lessons for a module
 */
export async function getModuleLessons(moduleId: string): Promise<Lesson[]> {
  return apiClient.get<Lesson[]>(`/modules/${moduleId}/lessons`);
}

/**
 * Get all lessons (optionally filtered by module)
 */
export async function getLessons(moduleId?: string): Promise<Lesson[]> {
  const query = moduleId ? `?moduleId=${moduleId}` : '';
  return apiClient.get<Lesson[]>(`/lessons${query}`);
}

/**
 * Get lesson by ID
 */
export async function getLesson(lessonId: string): Promise<Lesson> {
  return apiClient.get<Lesson>(`/lessons/${lessonId}`);
}

/**
 * Get teachings for a lesson
 */
export async function getLessonTeachings(lessonId: string): Promise<Teaching[]> {
  return apiClient.get<Teaching[]>(`/lessons/${lessonId}/teachings`);
}
