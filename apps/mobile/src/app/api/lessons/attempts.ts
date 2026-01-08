import { getSupabaseClient } from '@/app/api/supabase/client';

export type LessonAttempt = {
  id?: number;
  user_id: string;
  course_slug: string;
  question_id: string;
  choice: string;
  correct: boolean;
  created_at?: string;
};

export async function insertLessonAttempt(
  entry: Omit<LessonAttempt, 'id' | 'created_at' | 'user_id'>,
) {
  const supabase = getSupabaseClient();
  const { data: u } = await supabase.auth.getUser();
  const user_id = u.user?.id;
  if (!user_id) throw new Error('Not authenticated');

  const payload: LessonAttempt = { user_id, ...entry } as LessonAttempt;
  const { data, error } = await supabase.from('lesson_attempts').insert(payload).select().single();
  if (error) throw error;
  return data as LessonAttempt;
}
