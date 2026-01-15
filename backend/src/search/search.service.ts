import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { KNOWLEDGE_LEVEL } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(query: SearchQueryDto) {
    const { q, level, topic, type, limit = 20, offset = 0 } = query;

    const results: {
      modules: any[];
      lessons: any[];
      teachings: any[];
      questions: any[];
    } = {
      modules: [],
      lessons: [],
      teachings: [],
      questions: [],
    };

    // Build search conditions
    // Note: Prisma's case-insensitive search requires PostgreSQL with proper collation
    // For compatibility, we'll use contains (case-sensitive) or implement case-insensitive via raw query if needed
    const searchText = q ? { contains: q } : undefined;

    // Search modules
    if (!type || type === 'module') {
      results.modules = await this.prisma.module.findMany({
        where: {
          ...(searchText && {
            OR: [
              { title: searchText },
              { description: searchText },
            ],
          }),
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });
    }

    // Search lessons
    if (!type || type === 'lesson') {
      results.lessons = await this.prisma.lesson.findMany({
        where: {
          ...(searchText && {
            OR: [
              { title: searchText },
              { description: searchText },
            ],
          }),
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });
    }

    // Search teachings
    if (!type || type === 'teaching') {
      const teachingWhere: any = {};
      if (level) {
        teachingWhere.knowledgeLevel = level;
      }
      if (searchText) {
        teachingWhere.OR = [
          { userLanguageString: searchText },
          { learningLanguageString: searchText },
          { tip: searchText },
        ];
      }

      results.teachings = await this.prisma.teaching.findMany({
        where: teachingWhere,
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              module: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });
    }

    // Search questions (limited - questions don't have searchable text fields)
    if (!type || type === 'question') {
      // Questions are linked to teachings, so we search via teachings
      const teachingIds = searchText
        ? (
            await this.prisma.teaching.findMany({
              where: {
                OR: [
                  { userLanguageString: searchText },
                  { learningLanguageString: searchText },
                ],
              },
              select: { id: true },
            })
          ).map((t) => t.id)
        : undefined;

      if (teachingIds || !searchText) {
        results.questions = await this.prisma.question.findMany({
          where: {
            ...(teachingIds && { teachingId: { in: teachingIds } }),
          },
          include: {
            teaching: {
              select: {
                id: true,
                userLanguageString: true,
                learningLanguageString: true,
                lesson: {
                  select: {
                    id: true,
                    title: true,
                    module: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            },
          },
          take: limit,
          skip: offset,
        });
      }
    }

    return results;
  }
}
