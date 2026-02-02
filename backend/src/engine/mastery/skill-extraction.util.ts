import { LoggerService } from '../../common/logger';

const logger = new LoggerService('SkillExtractionUtil');

export function extractSkillTags(item: any): string[] {
  const tags: string[] = [];

  if (item.skillTags && Array.isArray(item.skillTags)) {
    const dbTags = item.skillTags
      .map((tag: any) => tag.name)
      .filter((name: string) => name);
    tags.push(...dbTags);
  }

  const teaching = item.teaching || item;
  if (teaching?.skillTags && Array.isArray(teaching.skillTags)) {
    const teachingTags = teaching.skillTags
      .map((tag: any) => tag.name)
      .filter((name: string) => name);
    tags.push(...teachingTags);
  }

  if (tags.length === 0) {
    logger.logWarn('extractSkillTags: No skill tags found', {
      message:
        'Ensure skillTags relation is included in Prisma query',
      itemType: item.teaching ? 'Question' : 'Teaching',
    });
  }

  return Array.from(new Set(tags));
}
