export type LessonSummary = {
  id: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  estMinutes?: number;
};

export type LessonContent = {
  lesson: LessonSummary;
  description?: string;
  heroImage?: string;
};
