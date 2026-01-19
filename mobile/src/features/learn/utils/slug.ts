export function getSlugFromTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-');
}

