/**
 * Illustration image sources for Learning Path module cards.
 * Maps module theme to a descriptive image (remote URL or local require).
 * Uses Unsplash (unsplash.com) – consider adding attribution. Replace with
 * illustrations from unDraw.co or Freepik for a more illustrated look.
 */
import type { ImageSourcePropType } from 'react-native';

/**
 * Get illustration source for a module by title.
 * Visually descriptive of each module; replace URLs with local require() if you add assets.
 */
export function getModuleIllustrationSource(title: string): ImageSourcePropType | null {
  const t = title.toLowerCase();
  // Prefer remote illustration URLs; fallback to null to use icon in carousel
  if (t.includes('travel')) {
    return {
      uri: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80',
    };
  }
  if (t.includes('food') || t.includes('dining') || t.includes('restaurant')) {
    return {
      uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    };
  }
  if (t.includes('daily') || t.includes('life') || t.includes('routine')) {
    return {
      uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    };
  }
  if (t.includes('basics') || t.includes('phrase') || t.includes('grammar')) {
    return {
      uri: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80',
    };
  }
  // Default: learning / school
  return {
    uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
  };
}
