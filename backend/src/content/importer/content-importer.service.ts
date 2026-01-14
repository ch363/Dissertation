import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  validateModuleFile,
  validateLessonFile,
  findContentFiles,
  ValidationErrorException,
  type ValidationError,
} from '../validation/validator';
import {
  ModuleContent,
  LessonContent,
  DeliveryMethod,
} from '../validation/content.schema';
import { KNOWLEDGE_LEVEL, DELIVERY_METHOD } from '@prisma/client';
import {
  moduleIdFromSlug,
  lessonIdFromSlug,
  teachingIdFromSlug,
  questionIdFromSlug,
} from './slug-to-id';
import { join } from 'path';
import { Prisma } from '@prisma/client';

export interface ImportStats {
  modulesCreated: number;
  modulesUpdated: number;
  lessonsCreated: number;
  lessonsUpdated: number;
  teachingsCreated: number;
  teachingsUpdated: number;
  questionsCreated: number;
  questionsUpdated: number;
  deliveryMethodsCreated: number;
  errors: string[];
}

@Injectable()
export class ContentImporterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Import all content from a directory
   */
  async importContent(contentDir: string = join(process.cwd(), 'content')): Promise<ImportStats> {
    const stats: ImportStats = {
      modulesCreated: 0,
      modulesUpdated: 0,
      lessonsCreated: 0,
      lessonsUpdated: 0,
      teachingsCreated: 0,
      teachingsUpdated: 0,
      questionsCreated: 0,
      questionsUpdated: 0,
      deliveryMethodsCreated: 0,
      errors: [],
    };

    try {
      // Find all content files
      const { modules, lessons } = findContentFiles(contentDir);

      // Import modules first
      const moduleMap = new Map<string, string>(); // slug -> id
      for (const modulePath of modules) {
        try {
          const moduleContent = validateModuleFile(modulePath);
          const { created } = await this.importModule(moduleContent);
          moduleMap.set(moduleContent.slug, moduleIdFromSlug(moduleContent.slug));
          if (created) {
            stats.modulesCreated++;
          } else {
            stats.modulesUpdated++;
          }
        } catch (error) {
          const message = `Failed to import module ${modulePath}: ${error instanceof Error ? error.message : String(error)}`;
          stats.errors.push(message);
          console.error(message);
        }
      }

      // Import lessons (grouped by module directory)
      for (const lessonPath of lessons) {
        try {
          const lessonContent = validateLessonFile(lessonPath);
          
          // Determine module slug from directory structure
          // Expected: content/{lang}/{module-slug}/lessons/{lesson}.yaml
          const pathParts = lessonPath.split('/');
          const moduleSlugIndex = pathParts.findIndex((p) => p === 'lessons') - 1;
          if (moduleSlugIndex < 0) {
            throw new Error('Could not determine module from lesson path');
          }
          const moduleSlug = pathParts[moduleSlugIndex];

          const moduleId = moduleMap.get(moduleSlug);
          if (!moduleId) {
            throw new Error(`Module '${moduleSlug}' not found. Import modules first.`);
          }

          const { id: lessonId, created: lessonCreated } = await this.importLesson(lessonContent, moduleId);
          if (lessonCreated) {
            stats.lessonsCreated++;
          } else {
            stats.lessonsUpdated++;
          }
          
          // Import teachings
          for (const teaching of lessonContent.teachings) {
            const { id: teachingId, created: teachingCreated } = await this.importTeaching(teaching, lessonId);
            if (teachingCreated) {
              stats.teachingsCreated++;
            } else {
              stats.teachingsUpdated++;
            }
            
            // Import questions for this teaching
            const teachingQuestions = lessonContent.questions.filter(
              (q) => q.teachingSlug === teaching.slug,
            );
            
            for (const question of teachingQuestions) {
              const { id: questionId, created: questionCreated } = await this.importQuestion(question, teachingId);
              if (questionCreated) {
                stats.questionsCreated++;
              } else {
                stats.questionsUpdated++;
              }
              await this.importQuestionDeliveryMethods(question, questionId);
              stats.deliveryMethodsCreated += question.deliveryMethods.length;
            }
          }
        } catch (error) {
          const message = `Failed to import lesson ${lessonPath}: ${error instanceof Error ? error.message : String(error)}`;
          stats.errors.push(message);
          console.error(message);
        }
      }
    } catch (error) {
      const message = `Import failed: ${error instanceof Error ? error.message : String(error)}`;
      stats.errors.push(message);
      console.error(message);
    }

    return stats;
  }

  /**
   * Import a module
   */
  private async importModule(module: ModuleContent): Promise<{ id: string; created: boolean }> {
    const id = moduleIdFromSlug(module.slug);

    // Check if exists
    const existing = await this.prisma.module.findUnique({ where: { id } });
    const created = !existing;

    await this.prisma.module.upsert({
      where: { id },
      update: {
        title: module.title,
        description: module.description ?? null,
        imageUrl: module.imageUrl ?? null,
      },
      create: {
        id,
        title: module.title,
        description: module.description ?? null,
        imageUrl: module.imageUrl ?? null,
      },
    });

    return { id, created };
  }

  /**
   * Import a lesson
   */
  private async importLesson(lesson: LessonContent, moduleId: string): Promise<{ id: string; created: boolean }> {
    const id = lessonIdFromSlug(lesson.slug);

    const existing = await this.prisma.lesson.findUnique({ where: { id } });
    const created = !existing;

    await this.prisma.lesson.upsert({
      where: { id },
      update: {
        title: lesson.title,
        description: lesson.description ?? null,
        imageUrl: lesson.imageUrl ?? null,
        moduleId,
        numberOfItems: lesson.teachings.length,
      },
      create: {
        id,
        title: lesson.title,
        description: lesson.description ?? null,
        imageUrl: lesson.imageUrl ?? null,
        moduleId,
        numberOfItems: lesson.teachings.length,
      },
    });

    return { id, created };
  }

  /**
   * Import a teaching
   */
  private async importTeaching(
    teaching: LessonContent['teachings'][0],
    lessonId: string,
  ): Promise<{ id: string; created: boolean }> {
    const id = teachingIdFromSlug(teaching.slug);

    const existing = await this.prisma.teaching.findUnique({ where: { id } });
    const created = !existing;

    await this.prisma.teaching.upsert({
      where: { id },
      update: {
        knowledgeLevel: teaching.knowledgeLevel as KNOWLEDGE_LEVEL,
        emoji: teaching.emoji ?? null,
        userLanguageString: teaching.userLanguageString,
        learningLanguageString: teaching.learningLanguageString,
        tip: teaching.tip ?? null,
        lessonId,
      },
      create: {
        id,
        knowledgeLevel: teaching.knowledgeLevel as KNOWLEDGE_LEVEL,
        emoji: teaching.emoji ?? null,
        userLanguageString: teaching.userLanguageString,
        learningLanguageString: teaching.learningLanguageString,
        tip: teaching.tip ?? null,
        lessonId,
      },
    });

    return { id, created };
  }

  /**
   * Import a question
   * Questions only link to teaching - all data comes from the Teaching relationship
   */
  private async importQuestion(question: LessonContent['questions'][0], teachingId: string): Promise<{ id: string; created: boolean }> {
    const id = questionIdFromSlug(question.slug);

    const existing = await this.prisma.question.findUnique({ where: { id } });
    const created = !existing;

    await this.prisma.question.upsert({
      where: { id },
      update: {
        teachingId,
      },
      create: {
        id,
        teachingId,
      },
    });

    return { id, created };
  }

  /**
   * Import question delivery methods
   */
  private async importQuestionDeliveryMethods(
    question: LessonContent['questions'][0],
    questionId: string,
  ): Promise<void> {
    // Delete existing delivery methods for this question
    await this.prisma.questionDeliveryMethod.deleteMany({
      where: { questionId },
    });

    // Create new delivery methods
    if (question.deliveryMethods.length > 0) {
      await this.prisma.questionDeliveryMethod.createMany({
        data: question.deliveryMethods.map((method) => ({
          questionId,
          deliveryMethod: method as DELIVERY_METHOD,
        })),
        skipDuplicates: true,
      });
    }
  }

  /**
   * Validate content files without importing
   */
  async validateContent(contentDir: string = join(process.cwd(), 'content')): Promise<{
    valid: boolean;
    errors: ValidationError[];
  }> {
    const errors: ValidationError[] = [];

    try {
      const { modules, lessons } = findContentFiles(contentDir);

      // Validate modules
      for (const modulePath of modules) {
        try {
          validateModuleFile(modulePath);
        } catch (error) {
          if (error instanceof ValidationErrorException) {
            errors.push(...error.errors);
          } else {
            const errorObj: ValidationError = {
              file: modulePath,
              message: error instanceof Error ? error.message : String(error),
            };
            errors.push(errorObj);
          }
        }
      }

      // Validate lessons
      for (const lessonPath of lessons) {
        try {
          validateLessonFile(lessonPath);
        } catch (error) {
          if (error instanceof ValidationErrorException) {
            errors.push(...error.errors);
          } else {
            const errorObj: ValidationError = {
              file: lessonPath,
              message: error instanceof Error ? error.message : String(error),
            };
            errors.push(errorObj);
          }
        }
      }
    } catch (error) {
      const errorObj: ValidationError = {
        file: contentDir,
        message: error instanceof Error ? error.message : String(error),
      };
      errors.push(errorObj);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
