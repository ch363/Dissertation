import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProgressService } from '../progress/progress.service';
import { ResetProgressDto } from '../progress/dto/reset-progress.dto';

@Injectable()
export class MeService {
  private supabaseAdmin: ReturnType<typeof createClient> | null = null;

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private progressService: ProgressService,
    private configService: ConfigService,
  ) {
    // Initialize Supabase admin client for accessing user metadata
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const serviceRoleKey = this.configService.get<string>('supabase.serviceRoleKey');
    if (supabaseUrl && serviceRoleKey) {
      this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  async getMe(userId: string) {
    // Provision user on first request
    const user = await this.usersService.upsertUser(userId);
    
    // Compute displayName with priority: DB name → auth metadata name → email extraction → "User"
    let displayName = user.name;
    
    if (!displayName || displayName.trim() === '') {
      // Try to get name from Supabase auth metadata
      if (this.supabaseAdmin) {
        try {
          const { data: authUser, error } = await this.supabaseAdmin.auth.admin.getUserById(userId);
          if (!error && authUser?.user) {
            const authMetadataName = (authUser.user.user_metadata as any)?.name;
            if (authMetadataName && authMetadataName.trim()) {
              displayName = authMetadataName.trim();
              // Auto-sync to database if found in auth but not in DB
              try {
                await this.usersService.updateUser(userId, { name: displayName || undefined });
                user.name = displayName; // Update local object
              } catch (syncError) {
                // Log but don't fail - name will still be returned
                console.warn('Failed to sync name from auth metadata to DB:', syncError);
              }
            } else {
              // Fallback to email (extract name part)
              const email = authUser.user.email;
              if (email) {
                const emailName = email.split('@')[0];
                displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
              } else {
                displayName = 'User';
              }
            }
          } else {
            // Could not fetch auth user, fallback to email extraction from user.email if available
            // Or just use "User"
            displayName = 'User';
          }
        } catch (error) {
          // If Supabase admin call fails, fallback to "User"
          console.warn('Failed to fetch user metadata from Supabase:', error);
          displayName = 'User';
        }
      } else {
        // No Supabase admin client available, fallback to "User"
        displayName = 'User';
      }
    }
    
    // Return user with computed displayName
    return {
      ...user,
      displayName: displayName || 'User',
    };
  }

  async getDashboard(userId: string) {
    const now = new Date();

    // Count deduped due reviews (latest per question where nextReviewDue <= now)
    const dueReviews = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        nextReviewDue: {
          lte: now,
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Dedup by questionId - keep only the latest per question
    const questionIdSet = new Set<string>();
    const dedupedDueReviews = dueReviews.filter((review) => {
      if (questionIdSet.has(review.questionId)) {
        return false;
      }
      questionIdSet.add(review.questionId);
      return true;
    });

    const dueReviewCount = dedupedDueReviews.length;

    // Count active lessons
    const activeLessonCount = await this.prisma.userLesson.count({
      where: { userId },
    });

    // Get XP total - sum of UserKnowledgeLevelProgress.value
    const xpProgress = await this.prisma.userKnowledgeLevelProgress.aggregate({
      where: { userId },
      _sum: {
        value: true,
      },
    });

    const xpTotal = xpProgress._sum.value || 0;

    // Calculate streak using progress service
    const streak = await this.progressService.calculateStreak(userId);

    return {
      dueReviewCount,
      activeLessonCount,
      xpTotal,
      streak,
    };
  }

  async getStats(userId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // Get all question performances from today
    // Use lastRevisedAt if available, otherwise createdAt
    const todayPerformances = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        OR: [
          {
            lastRevisedAt: {
              gte: startOfToday,
              lt: endOfToday,
            },
          },
          {
            lastRevisedAt: null,
            createdAt: {
              gte: startOfToday,
              lt: endOfToday,
            },
          },
        ],
      },
      select: {
        timeToComplete: true,
      },
    });

    // Sum up timeToComplete in milliseconds, convert to minutes
    const totalMs = todayPerformances.reduce((sum, perf) => {
      return sum + (perf.timeToComplete || 0);
    }, 0);

    const minutesToday = Math.round(totalMs / (1000 * 60));

    return {
      minutesToday,
    };
  }

  async getMyLessons(userId: string) {
    const userLessons = await this.prisma.userLesson.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            module: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    const now = new Date();

    // Get all teachings for these lessons to count totals
    const lessonIds = userLessons.map((ul) => ul.lessonId);
    const teachings = await this.prisma.teaching.findMany({
      where: {
        lessonId: { in: lessonIds },
      },
      include: {
        questions: true,
      },
    });

    const teachingsByLessonId = new Map<string, typeof teachings>();
    teachings.forEach((teaching) => {
      const existing = teachingsByLessonId.get(teaching.lessonId) || [];
      existing.push(teaching);
      teachingsByLessonId.set(teaching.lessonId, existing);
    });

    // Get due reviews for questions in these lessons
    const questionIds = teachings.flatMap((t) => t.questions.map((q) => q.id));
    const dueReviews = await this.prisma.userQuestionPerformance.findMany({
      where: {
        userId,
        questionId: { in: questionIds },
        nextReviewDue: {
          lte: now,
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Dedup by questionId per lesson
    const dueReviewsByQuestionId = new Map<string, typeof dueReviews[0]>();
    dueReviews.forEach((review) => {
      const existing = dueReviewsByQuestionId.get(review.questionId);
      if (!existing || review.createdAt > existing.createdAt) {
        dueReviewsByQuestionId.set(review.questionId, review);
      }
    });

    // Map question IDs to lesson IDs
    const questionToLessonId = new Map<string, string>();
    teachings.forEach((teaching) => {
      teaching.questions.forEach((q) => {
        questionToLessonId.set(q.id, teaching.lessonId);
      });
    });

    // Count due reviews per lesson
    const dueCountByLessonId = new Map<string, number>();
    dueReviewsByQuestionId.forEach((review) => {
      const lessonId = questionToLessonId.get(review.questionId);
      if (lessonId) {
        dueCountByLessonId.set(lessonId, (dueCountByLessonId.get(lessonId) || 0) + 1);
      }
    });

    return userLessons.map((ul) => {
      const teachingsInLesson = teachingsByLessonId.get(ul.lessonId) || [];
      const totalTeachings = teachingsInLesson.length;
      const dueReviewCount = dueCountByLessonId.get(ul.lessonId) || 0;

      return {
        lesson: {
          id: ul.lesson.id,
          title: ul.lesson.title,
          imageUrl: ul.lesson.imageUrl,
          module: {
            id: ul.lesson.module.id,
            title: ul.lesson.module.title,
          },
        },
        completedTeachings: ul.completedTeachings,
        totalTeachings,
        dueReviewCount,
      };
    });
  }

  async getAllMastery(userId: string) {
    const masteryRecords = await this.prisma.userSkillMastery.findMany({
      where: { userId },
      orderBy: { lastUpdated: 'desc' },
      select: {
        skillTag: true,
        masteryProbability: true,
        lastUpdated: true,
      },
    });

    return masteryRecords.map((record) => ({
      skillTag: record.skillTag,
      masteryProbability: record.masteryProbability,
      lastUpdated: record.lastUpdated,
    }));
  }

  async getRecent(userId: string) {
    // Get most recently accessed lesson that is partially completed
    // First, get all user lessons with their teachings count
    const userLessons = await this.prisma.userLesson.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        lesson: {
          include: {
            module: {
              select: {
                id: true,
                title: true,
              },
            },
            teachings: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // Find the first lesson that is partially completed
    // Calculate actual completed count for each lesson to ensure accuracy
    let recentLesson: (typeof userLessons)[0] | null = null;
    for (const ul of userLessons) {
      const totalTeachings = ul.lesson.teachings.length;
      // Calculate actual completed count from UserTeachingCompleted
      const actualCompletedCount = await this.prisma.userTeachingCompleted.count({
        where: {
          userId,
          teachingId: {
            in: ul.lesson.teachings.map((t) => t.id),
          },
        },
      });
      if (actualCompletedCount < totalTeachings) {
        recentLesson = ul;
        break;
      }
    }

    // Get most recently completed teaching
    const recentTeaching = await this.prisma.userTeachingCompleted.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        teaching: {
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
        },
      },
    });

    // Get most recently attempted question
    const recentQuestion = await this.prisma.userQuestionPerformance.findFirst({
      where: { userId },
      orderBy: { lastRevisedAt: 'desc' },
      include: {
        question: {
          include: {
            teaching: {
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
            },
          },
        },
      },
    });

    // Calculate actual completed teachings count from UserTeachingCompleted
    // to ensure accuracy (the counter might be out of sync)
    let actualCompletedTeachings = 0;
    if (recentLesson) {
      const completedTeachings = await this.prisma.userTeachingCompleted.count({
        where: {
          userId,
          teachingId: {
            in: recentLesson.lesson.teachings.map((t) => t.id),
          },
        },
      });
      actualCompletedTeachings = completedTeachings;
    }

    return {
      recentLesson: recentLesson
        ? {
            lesson: {
              id: recentLesson.lesson.id,
              title: recentLesson.lesson.title,
              imageUrl: recentLesson.lesson.imageUrl,
              module: recentLesson.lesson.module,
            },
            lastAccessedAt: recentLesson.updatedAt,
            completedTeachings: actualCompletedTeachings,
            totalTeachings: recentLesson.lesson.teachings.length,
            dueReviewCount: 0, // Will be calculated if needed elsewhere
          }
        : null,
      recentTeaching: recentTeaching
        ? {
            teaching: {
              id: recentTeaching.teaching.id,
              userLanguageString: recentTeaching.teaching.userLanguageString,
              learningLanguageString: recentTeaching.teaching.learningLanguageString,
            },
            lesson: recentTeaching.teaching.lesson,
            completedAt: recentTeaching.createdAt,
          }
        : null,
      recentQuestion: recentQuestion
        ? {
            question: {
              id: recentQuestion.question.id,
            },
            teaching: {
              id: recentQuestion.question.teaching.id,
              userLanguageString: recentQuestion.question.teaching.userLanguageString,
              learningLanguageString: recentQuestion.question.teaching.learningLanguageString,
            },
            lesson: recentQuestion.question.teaching.lesson,
            lastRevisedAt: recentQuestion.lastRevisedAt,
            nextReviewDue: recentQuestion.nextReviewDue,
          }
        : null,
    };
  }

  async resetAllProgress(userId: string, options?: ResetProgressDto) {
    return this.progressService.resetAllProgress(userId, options);
  }

  async uploadAvatar(userId: string, avatarUrl: string) {
    // Update user's avatarUrl
    await this.usersService.updateUser(userId, {
      avatarUrl,
    });

    return {
      message: 'Avatar uploaded successfully',
      avatarUrl,
    };
  }

  async deleteAccount(userId: string) {
    // Delete all user data in a transaction
    // Note: Cascade deletes should handle related records, but we'll be explicit
    return this.prisma.$transaction(async (tx) => {
      // Delete all progress records (cascade should handle, but being explicit)
      await tx.userLesson.deleteMany({ where: { userId } });
      await tx.userTeachingCompleted.deleteMany({ where: { userId } });
      await tx.userQuestionPerformance.deleteMany({ where: { userId } });
      await tx.userKnowledgeLevelProgress.deleteMany({ where: { userId } });
      await tx.userDeliveryMethodScore.deleteMany({ where: { userId } });

      // Delete the user record itself
      await tx.user.delete({
        where: { id: userId },
      });

      return {
        message: 'Account and all associated data deleted successfully',
        deletedAt: new Date().toISOString(),
      };
    });
  }
}
