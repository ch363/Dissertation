import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { SupabaseJwtGuard } from '../common/guards/supabase-jwt.guard';
import { User } from '../common/decorators/user.decorator';
import { QuestionAttemptDto } from './dto/question-attempt.dto';
import { DeliveryMethodScoreDto } from './dto/delivery-method-score.dto';
import { KnowledgeLevelProgressDto } from './dto/knowledge-level-progress.dto';
import { ResetProgressDto } from './dto/reset-progress.dto';
import { ValidateAnswerDto } from './dto/validate-answer.dto';
import { ValidateAnswerResponseDto } from './dto/validate-answer-response.dto';
import { ValidatePronunciationDto } from './dto/validate-pronunciation.dto';
import { PronunciationResponseDto } from './dto/pronunciation-response.dto';
import { CompleteTeachingDto } from './dto/complete-teaching.dto';
import { DELIVERY_METHOD } from '@prisma/client';
import { IsEnum } from 'class-validator';

@ApiTags('progress')
@ApiBearerAuth('JWT-auth')
@Controller('progress')
@UseGuards(SupabaseJwtGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('lessons/:lessonId/start')
  async startLesson(
    @User() userId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.startLesson(userId, lessonId);
  }

  @Post('lessons/:lessonId/end')
  @ApiOperation({ summary: 'Record lesson ended (sets endedAt for study time)' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  async endLesson(
    @User() userId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.endLesson(userId, lessonId);
  }

  @Get('lessons')
  async getUserLessons(
    @User() userId: string,
    @Query('tzOffsetMinutes') tzOffsetMinutes?: string,
  ) {
    const parsed = tzOffsetMinutes !== undefined ? Number(tzOffsetMinutes) : undefined;
    return this.progressService.getUserLessons(userId, Number.isFinite(parsed) ? parsed : undefined);
  }

  @Post('teachings/:teachingId/complete')
  async completeTeaching(
    @User() userId: string,
    @Param('teachingId') teachingId: string,
    @Body() body: CompleteTeachingDto = {},
  ) {
    return this.progressService.completeTeaching(
      userId,
      teachingId,
      body.timeSpentMs,
    );
  }

  @Post('questions/:questionId/attempt')
  @ApiOperation({ summary: 'Append-only' })
  async recordQuestionAttempt(
    @User() userId: string,
    @Param('questionId') questionId: string,
    @Body() attemptDto: QuestionAttemptDto,
  ) {
    return this.progressService.recordQuestionAttempt(
      userId,
      questionId,
      attemptDto,
    );
  }

  @Get('reviews/due')
  async getDueReviews(@User() userId: string) {
    return this.progressService.getDueReviews(userId);
  }

  @Get('reviews/due/latest')
  @ApiOperation({ summary: 'Latest per question' })
  async getDueReviewsLatest(@User() userId: string) {
    return this.progressService.getDueReviewsLatest(userId);
  }

  @Post('delivery-method/:method/score')
  async updateDeliveryMethodScore(
    @User() userId: string,
    @Param('method') method: DELIVERY_METHOD,
    @Body() scoreDto: DeliveryMethodScoreDto,
  ) {
    return this.progressService.updateDeliveryMethodScore(
      userId,
      method,
      scoreDto,
    );
  }

  @Post('knowledge-level-progress')
  async recordKnowledgeLevelProgress(
    @User() userId: string,
    @Body() progressDto: KnowledgeLevelProgressDto,
  ) {
    return this.progressService.recordKnowledgeLevelProgress(
      userId,
      progressDto,
    );
  }

  @Post('lessons/:lessonId/reset')
  async resetLessonProgress(
    @User() userId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.resetLessonProgress(userId, lessonId);
  }

  @Post('questions/:questionId/reset')
  async resetQuestionProgress(
    @User() userId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.progressService.resetQuestionProgress(userId, questionId);
  }

  @Get('summary')
  async getProgressSummary(
    @User() userId: string,
    @Query('tzOffsetMinutes') tzOffsetMinutes?: string,
  ) {
    const parsed = tzOffsetMinutes !== undefined ? Number(tzOffsetMinutes) : undefined;
    return this.progressService.getProgressSummary(userId, Number.isFinite(parsed) ? parsed : undefined);
  }

  @Post('modules/:moduleIdOrSlug/complete')
  @ApiOperation({ summary: 'Marks all lessons in module as completed' })
  async markModuleCompleted(
    @User() userId: string,
    @Param('moduleIdOrSlug') moduleIdOrSlug: string,
  ) {
    return this.progressService.markModuleCompleted(userId, moduleIdOrSlug);
  }

  @Get('attempts')
  @ApiOperation({ summary: 'For debugging/dev' })
  async getRecentAttempts(@User() userId: string) {
    return this.progressService.getRecentAttempts(userId);
  }

  @Post('questions/:questionId/validate')
  async validateAnswer(
    @User() userId: string,
    @Param('questionId') questionId: string,
    @Body() validateDto: ValidateAnswerDto,
  ): Promise<ValidateAnswerResponseDto> {
    return this.progressService.validateAnswer(userId, questionId, validateDto);
  }

  @Post('questions/:questionId/pronunciation')
  async validatePronunciation(
    @User() userId: string,
    @Param('questionId') questionId: string,
    @Body() pronunciationDto: ValidatePronunciationDto,
  ): Promise<PronunciationResponseDto> {
    return this.progressService.validatePronunciation(
      userId,
      questionId,
      pronunciationDto,
    );
  }
}
