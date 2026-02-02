export function formatLessonDetail(nextLessonItemCount: number | null): string | undefined {
  if (typeof nextLessonItemCount !== 'number') return undefined;
  const minutes = Math.max(1, Math.ceil(nextLessonItemCount * 1.5));
  const itemsLabel = nextLessonItemCount === 1 ? 'exercise' : 'exercises';
  return `~${minutes} min · ${nextLessonItemCount} ${itemsLabel}`;
}
