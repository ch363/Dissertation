export function normalizeTitle(title: string): string {
  if (!title) return '';

  return title
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
