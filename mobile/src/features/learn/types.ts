import type { RoutePath } from '@/services/navigation/routes';

export type DiscoverBase = {
  id: string;
  title: string;
  subtitle: string;
  background: string;
  route: RoutePath;
  imageUrl?: string | null;
  ctaLabel?: string;
};

export type DiscoverLessonItem = DiscoverBase & {
  kind: 'lesson';
};

export type DiscoverModuleItem = DiscoverBase & {
  kind: 'module';
};

export type DiscoverItem = DiscoverLessonItem | DiscoverModuleItem;

