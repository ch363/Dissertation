/**
 * Utility for extracting skill tags from teachings and questions.
 * 
 * IMPORTANT: Callers MUST ensure the `skillTags` relation is loaded in Prisma queries.
 * Heuristic extraction is deprecated and should not be used in production.
 */

export interface ExtractSkillTagsOptions {
  /**
   * Whether to allow heuristic extraction as a fallback when relations aren't loaded.
   * Default: false (production mode - relations must be loaded)
   * 
   * @deprecated Heuristic extraction is unreliable and should not be used in production.
   * Set to true only for backward compatibility or migration scenarios.
   */
  allowHeuristics?: boolean;
}

/**
 * Extract skill tags from a teaching or question.
 * 
 * Priority:
 * 1. Database relation (skillTags) if loaded
 * 2. Heuristic extraction (only if allowHeuristics is true)
 * 
 * @param item Teaching or Question object with optional skillTags relation and teaching relation
 * @param options Configuration options for extraction behavior
 * @returns Array of skill tag strings
 * 
 * @throws {Error} If skillTags relation is not loaded and allowHeuristics is false
 * 
 * @example
 * // Production usage - ensure skillTags are loaded in Prisma query
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
export function extractSkillTags(
  item: any,
  options: ExtractSkillTagsOptions = {},
): string[] {
  const { allowHeuristics = false } = options;
  const tags: string[] = [];

  // 1. Extract from database relation if available
  if (item.skillTags && Array.isArray(item.skillTags)) {
    const dbTags = item.skillTags.map((tag: any) => tag.name).filter((name: string) => name);
    tags.push(...dbTags);
  }

  // 2. Check if we need to extract from teaching's skillTags
  const teaching = item.teaching || item;
  if (teaching?.skillTags && Array.isArray(teaching.skillTags)) {
    const teachingTags = teaching.skillTags.map((tag: any) => tag.name).filter((name: string) => name);
    tags.push(...teachingTags);
  }

  // 3. Heuristic extraction (only if enabled and no DB tags found)
  if (allowHeuristics && tags.length === 0) {
    console.warn(
      'extractSkillTags: Using heuristic extraction as fallback. ' +
      'This is unreliable. Ensure skillTags relation is loaded in Prisma queries.',
    );

    // Extract from tip if available
    if (teaching?.tip) {
      const tipLower = teaching.tip.toLowerCase();
      if (tipLower.includes('greeting') || tipLower.includes('hello')) {
        tags.push('greetings');
      }
      if (tipLower.includes('number') || tipLower.includes('count')) {
        tags.push('numbers');
      }
      if (tipLower.includes('verb') || tipLower.includes('essere') || tipLower.includes('avere')) {
        tags.push('verbs');
      }
      if (tipLower.includes('article') || tipLower.includes('masculine') || tipLower.includes('feminine')) {
        tags.push('articles');
      }
      if (tipLower.includes('pronoun') || tipLower.includes('io') || tipLower.includes('tu')) {
        tags.push('pronouns');
      }
      if (tipLower.includes('adjective') || tipLower.includes('aggettivo')) {
        tags.push('adjectives');
      }
      if (tipLower.includes('noun') || tipLower.includes('sostantivo')) {
        tags.push('nouns');
      }
      if (tipLower.includes('past') || tipLower.includes('passato')) {
        tags.push('past-tense');
      }
      if (tipLower.includes('present') || tipLower.includes('presente')) {
        tags.push('present-tense');
      }
      if (tipLower.includes('future') || tipLower.includes('futuro')) {
        tags.push('future-tense');
      }
    }

    // Extract from lesson title
    if (teaching?.lesson?.title) {
      const lessonTitle = teaching.lesson.title.toLowerCase();
      // Extract key words from lesson title (first 2-3 meaningful words)
      const words = lessonTitle.split(/\s+/).filter((w: string) => w.length > 2);
      tags.push(...words.slice(0, 3));
    }
  } else if (!allowHeuristics && tags.length === 0) {
    // Warn if no tags found and heuristics are disabled
    console.warn(
      'extractSkillTags: No skill tags found. ' +
      'Ensure skillTags relation is included in Prisma query. ' +
      'Item type: ' + (item.teaching ? 'Question' : 'Teaching'),
    );
  }

  // Deduplicate and return
  return Array.from(new Set(tags));
}
