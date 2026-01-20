/**
 * Utility for extracting skill tags from teachings and questions.
 *
 * IMPORTANT: Callers MUST ensure the `skillTags` relation is loaded in Prisma queries.
 * This function only extracts tags from database relations - no heuristic extraction is performed.
 *
 * @param item Teaching or Question object with skillTags relation and optional teaching relation
 * @returns Array of skill tag strings (deduplicated)
 *
 * @example
 * // Ensure skillTags are loaded in Prisma query
 * const question = await prisma.question.findUnique({
 *   where: { id: questionId },
 *   include: {
 *     skillTags: { select: { name: true } },
 *     teaching: {
 *       include: {
 *         skillTags: { select: { name: true } }
 *       }
 *     }
 *   }
 * });
 * const tags = extractSkillTags(question);
 */
export function extractSkillTags(item: any): string[] {
  const tags: string[] = [];

  // 1. Extract from database relation if available
  if (item.skillTags && Array.isArray(item.skillTags)) {
    const dbTags = item.skillTags
      .map((tag: any) => tag.name)
      .filter((name: string) => name);
    tags.push(...dbTags);
  }

  // 2. Check if we need to extract from teaching's skillTags
  const teaching = item.teaching || item;
  if (teaching?.skillTags && Array.isArray(teaching.skillTags)) {
    const teachingTags = teaching.skillTags
      .map((tag: any) => tag.name)
      .filter((name: string) => name);
    tags.push(...teachingTags);
  }

  // Warn if no tags found (indicates skillTags relation was not loaded)
  if (tags.length === 0) {
    console.warn(
      'extractSkillTags: No skill tags found. ' +
        'Ensure skillTags relation is included in Prisma query. ' +
        'Item type: ' +
        (item.teaching ? 'Question' : 'Teaching'),
    );
  }

  // Deduplicate and return
  return Array.from(new Set(tags));
}
