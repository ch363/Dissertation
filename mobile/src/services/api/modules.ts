import { apiClient } from './client';

export interface Module {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: string | null;
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

export async function getModules(): Promise<Module[]> {
  return apiClient.get<Module[]>('/modules');
}

export async function getModule(moduleIdOrSlug: string): Promise<Module> {
  return apiClient.get<Module>(`/modules/${moduleIdOrSlug}`);
}

export async function getModuleLessons(moduleId: string): Promise<Lesson[]> {
  return apiClient.get<Lesson[]>(`/modules/${moduleId}/lessons`);
}

export async function getLessons(moduleId?: string): Promise<Lesson[]> {
  const query = moduleId ? `?moduleId=${moduleId}` : '';
  return apiClient.get<Lesson[]>(`/lessons${query}`);
}

export async function getLesson(lessonId: string): Promise<Lesson> {
  return apiClient.get<Lesson>(`/lessons/${lessonId}`);
}

export async function getLessonTeachings(lessonId: string): Promise<Teaching[]> {
  return apiClient.get<Teaching[]>(`/lessons/${lessonId}/teachings`);
}
