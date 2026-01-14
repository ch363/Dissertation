import { createHash } from 'crypto';

/**
 * Generate a deterministic UUID v5-like ID from a namespace and slug
 * Uses SHA-1 hash to create consistent UUIDs
 */
export function slugToId(namespace: string, slug: string): string {
  const input = `${namespace}:${slug}`;
  const hash = createHash('sha1').update(input).digest('hex');

  // Format as UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32),
  ].join('-');
}

/**
 * Generate module ID from slug
 */
export function moduleIdFromSlug(slug: string): string {
  return slugToId('module', slug);
}

/**
 * Generate lesson ID from slug
 */
export function lessonIdFromSlug(slug: string): string {
  return slugToId('lesson', slug);
}

/**
 * Generate teaching ID from slug
 */
export function teachingIdFromSlug(slug: string): string {
  return slugToId('teaching', slug);
}

/**
 * Generate question ID from slug
 */
export function questionIdFromSlug(slug: string): string {
  return slugToId('question', slug);
}
