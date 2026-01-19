import type { Teaching } from '@/services/api/modules';

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function joinWithAnd(parts: string[]): string {
  const cleaned = parts.map((p) => p.trim()).filter(Boolean);
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return capitalize(cleaned[0]);
  if (cleaned.length === 2) return `${capitalize(cleaned[0])} and ${cleaned[1]}`;
  return `${capitalize(cleaned[0])}, ${cleaned[1]}, and ${cleaned[2]}`;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/[“”]/g, '"');
}

function pickExamplePhrases(teachings: Teaching[]): string[] {
  const examples: string[] = [];
  for (const t of teachings) {
    const raw = (t.userLanguageString ?? '').trim();
    if (!raw) continue;
    // Avoid extremely long examples on cards.
    const shortened = raw.length > 28 ? `${raw.slice(0, 25).trim()}…` : raw;
    if (!examples.includes(shortened)) examples.push(shortened);
    if (examples.length >= 3) break;
  }
  return examples;
}

/**
 * Build a single, concrete “what you’ll learn” outcome line from lesson teachings.
 * Returns null if there isn’t enough signal to produce something useful.
 */
export function buildLessonOutcome(teachings: Teaching[]): string | null {
  if (!Array.isArray(teachings) || teachings.length === 0) return null;

  const text = normalize(teachings.map((t) => t.userLanguageString).filter(Boolean).join(' | '));

  const greet =
    /\b(hello|hi|good morning|good afternoon|good evening|goodbye|bye|see you)\b/.test(text) ||
    /\b(how are you)\b/.test(text);
  const introduce =
    /\b(my name is|i am\b|i'm\b|nice to meet you)\b/.test(text) ||
    /\b(this is\b|meet\b)\b/.test(text);
  const polite = /\b(please|thank you|thanks|excuse me|sorry|pardon)\b/.test(text);

  const directions = /\b(where is|how do i get to|left|right|straight)\b/.test(text);
  const ordering =
    /\b(i would like|can i have|menu|bill|check|coffee|water|restaurant|table)\b/.test(text);
  const help =
    /\b(help|can you help|do you speak|repeat|slower)\b/.test(text) ||
    /\b(understand|don't understand)\b/.test(text);
  const numbers = /\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/.test(text);

  // Special-case the most common motivational trio.
  if (greet && introduce && polite) {
    return 'Say hello, introduce yourself, and be polite';
  }

  const parts: string[] = [];
  if (greet) parts.push(introduce ? 'say hello' : 'say hello and goodbye');
  if (introduce) parts.push('introduce yourself');
  if (polite) parts.push('use polite basics');
  if (directions) parts.push('ask for directions');
  if (ordering) parts.push('order food and drinks');
  if (help) parts.push('ask for help');
  if (numbers) parts.push('use numbers and quantities');

  const outcome = joinWithAnd(parts.slice(0, 3));
  if (outcome) return outcome;

  // Last-resort: concrete examples.
  const examples = pickExamplePhrases(teachings);
  if (examples.length >= 2) {
    const list = examples.length === 2 ? `"${examples[0]}" and "${examples[1]}"` : `"${examples[0]}", "${examples[1]}", and "${examples[2]}"`;
    return `Use phrases like ${list}`;
  }

  return null;
}

