import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { SupabaseJwtGuard } from '../common/guards/supabase-jwt.guard';
import { User } from '../common/decorators/user.decorator';
import { QuestionAttemptDto } from './dto/question-attempt.dto';
import { DeliveryMethodScoreDto } from './dto/delivery-method-score.dto';
import { KnowledgeLevelProgressDto } from './dto/knowledge-level-progress.dto';
import { ResetProgressDto } from './dto/reset-progress.dto';
import { ValidateAnswerDto } from './dto/validate-answer.dto';
import { ValidateAnswerResponseDto } from './dto/validate-answer-response.dto';
import { DELIVERY_METHOD } from '@prisma/client';
import { IsEnum } from 'class-validator';

@ApiTags('progress')
@ApiBearerAuth('JWT-auth')
@Controller('progress')
@UseGuards(SupabaseJwtGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('lessons/:lessonId/start')
  @ApiOperation({ summary: 'Start or update lesson engagement' })
  @ApiParam({ name: 'lessonId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lesson started or updated' })
  async startLesson(@User() userId: string, @Param('lessonId') lessonId: string) {
    return this.progressService.startLesson(userId, lessonId);
  }

  @Get('lessons')
  @ApiOperation({ summary: 'Get user\'s lesson progress' })
  @ApiResponse({ status: 200, description: 'User lessons retrieved' })
  async getUserLessons(@User() userId: string) {
    return this.progressService.getUserLessons(userId);
  }

  @Post('teachings/:teachingId/complete')
  @ApiOperation({ summary: 'Mark teaching as completed' })
  @ApiParam({ name: 'teachingId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Teaching marked as completed' })
  async completeTeaching(@User() userId: string, @Param('teachingId') teachingId: string) {
    return this.progressService.completeTeaching(userId, teachingId);
  }

  @Post('questions/:questionId/attempt')
  @ApiOperation({ summary: 'Record question attempt (append-only)' })
  @ApiParam({ name: 'questionId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Question attempt recorded' })
  async recordQuestionAttempt(
    @User() userId: string,
    @Param('questionId') questionId: string,
    @Body() attemptDto: QuestionAttemptDto,
  ) {
    return this.progressService.recordQuestionAttempt(userId, questionId, attemptDto);
  }

  @Get('reviews/due')
  @ApiOperation({ summary: 'Get all due reviews' })
  @ApiResponse({ status: 200, description: 'Due reviews retrieved' })
  async getDueReviews(@User() userId: string) {
    return this.progressService.getDueReviews(userId);
  }

  @Get('reviews/due/latest')
  @ApiOperation({ summary: 'Get deduped due reviews (latest per question)' })
  @ApiResponse({ status: 200, description: 'Deduped due reviews retrieved' })
  async getDueReviewsLatest(@User() userId: string) {
    return this.progressService.getDueReviewsLatest(userId);
  }

  @Post('delivery-method/:method/score')
  @ApiOperation({ summary: 'Update delivery method preference score' })
  @ApiParam({ name: 'method', enum: DELIVERY_METHOD })
  @ApiResponse({ status: 200, description: 'Delivery method score updated' })
  async updateDeliveryMethodScore(
    @User() userId: string,
    @Param('method') method: DELIVERY_METHOD,
    @Body() scoreDto: DeliveryMethodScoreDto,
  ) {
    return this.progressService.updateDeliveryMethodScore(userId, method, scoreDto);
  }

  @Post('knowledge-level-progress')
  @ApiOperation({ summary: 'Record XP/knowledge level progress' })
  @ApiResponse({ status: 201, description: 'Progress recorded' })
  async recordKnowledgeLevelProgress(
    @User() userId: string,
    @Body() progressDto: KnowledgeLevelProgressDto,
  ) {
    return this.progressService.recordKnowledgeLevelProgress(userId, progressDto);
  }

  @Post('lessons/:lessonId/reset')
  @ApiOperation({ summary: 'Reset progress for a specific lesson' })
  @ApiParam({ name: 'lessonId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lesson progress reset successfully' })
  async resetLessonProgress(
    @User() userId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.resetLessonProgress(userId, lessonId);
  }

  @Post('questions/:questionId/reset')
  @ApiOperation({ summary: 'Reset progress for a specific question (e.g., "I already know this" or "start over")' })
  @ApiParam({ name: 'questionId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Question progress reset successfully' })
  async resetQuestionProgress(
    @User() userId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.progressService.resetQuestionProgress(userId, questionId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get progress summary (XP, completed lessons, completed modules, streak)' })
  @ApiResponse({ status: 200, description: 'Progress summary retrieved' })
  async getProgressSummary(@User() userId: string) {
    return this.progressService.getProgressSummary(userId);
  }

  @Post('modules/:moduleIdOrSlug/complete')
  @ApiOperation({ summary: 'Mark module as completed (marks all lessons in module as completed)' })
  @ApiParam({ name: 'moduleIdOrSlug', type: 'string', description: 'Module ID (UUID) or slug (title)' })
  @ApiResponse({ status: 200, description: 'Module marked as completed' })
  async markModuleCompleted(
    @User() userId: string,
    @Param('moduleIdOrSlug') moduleIdOrSlug: string,
  ) {
    return this.progressService.markModuleCompleted(userId, moduleIdOrSlug);
  }

  @Get('attempts')
  @ApiOperation({ summary: 'Get recent question attempts (for debugging/dev)' })
  @ApiResponse({ status: 200, description: 'Recent attempts retrieved' })
  async getRecentAttempts(@User() userId: string) {
    return this.progressService.getRecentAttempts(userId);
  }

  @Post('questions/:questionId/validate')
  @ApiOperation({ summary: 'Validate user answer and calculate score' })
  @ApiParam({ name: 'questionId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Answer validated', type: ValidateAnswerResponseDto })
  async validateAnswer(
    @User() userId: string,
    @Param('questionId') questionId: string,
    @Body() validateDto: ValidateAnswerDto,
  ): Promise<ValidateAnswerResponseDto> {
    return this.progressService.validateAnswer(userId, questionId, validateDto);
  }
}
