import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { UserId } from '../auth/user-id.decorator';
import { QuestionAttemptDto } from './dto/question-attempt.dto';
import { DeliveryMethodScoreDto } from './dto/delivery-method-score.dto';
import { KnowledgeLevelProgressDto } from './dto/knowledge-level-progress.dto';
import { DELIVERY_METHOD } from '@prisma/client';
import { IsEnum } from 'class-validator';

@Controller('progress')
@UseGuards(SupabaseAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('lessons/:lessonId/start')
  async startLesson(@UserId() userId: string, @Param('lessonId') lessonId: string) {
    return this.progressService.startLesson(userId, lessonId);
  }

  @Get('lessons')
  async getUserLessons(@UserId() userId: string) {
    return this.progressService.getUserLessons(userId);
  }

  @Post('teachings/:teachingId/complete')
  async completeTeaching(@UserId() userId: string, @Param('teachingId') teachingId: string) {
    return this.progressService.completeTeaching(userId, teachingId);
  }

  @Post('questions/:questionId/attempt')
  async recordQuestionAttempt(
    @UserId() userId: string,
    @Param('questionId') questionId: string,
    @Body() attemptDto: QuestionAttemptDto,
  ) {
    return this.progressService.recordQuestionAttempt(userId, questionId, attemptDto);
  }

  @Get('reviews/due')
  async getDueReviews(@UserId() userId: string) {
    return this.progressService.getDueReviews(userId);
  }

  @Get('reviews/due/latest')
  async getDueReviewsLatest(@UserId() userId: string) {
    return this.progressService.getDueReviewsLatest(userId);
  }

  @Post('delivery-method/:method/score')
  async updateDeliveryMethodScore(
    @UserId() userId: string,
    @Param('method') method: DELIVERY_METHOD,
    @Body() scoreDto: DeliveryMethodScoreDto,
  ) {
    return this.progressService.updateDeliveryMethodScore(userId, method, scoreDto);
  }

  @Post('knowledge-level-progress')
  async recordKnowledgeLevelProgress(
    @UserId() userId: string,
    @Body() progressDto: KnowledgeLevelProgressDto,
  ) {
    return this.progressService.recordKnowledgeLevelProgress(userId, progressDto);
  }
}
