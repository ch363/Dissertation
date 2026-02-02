import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LearnService } from './learn.service';
import { SupabaseJwtGuard } from '../common/guards/supabase-jwt.guard';
import { User } from '../common/decorators/user.decorator';
import {
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SessionPlanDto } from '../engine/content-delivery/session-types';
import { LearningPathCardDto } from './learning-path.dto';
import { ReviewSummaryDto } from './review-summary.dto';

export class LearnSuggestionsQueryDto {
  @IsOptional()
  @IsString() // Accept deterministic IDs
  currentLessonId?: string;

  @IsOptional()
  @IsString() // Accept deterministic IDs
  moduleId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;
}

export class SessionPlanQueryDto {
  @IsOptional()
  @IsEnum(['learn', 'review', 'mixed'])
  mode?: 'learn' | 'review' | 'mixed';

  @IsOptional()
  @IsInt()
  @Min(60)
  @Transform(({ value }) => parseInt(value, 10))
  timeBudgetSec?: number;

  @IsOptional()
  @IsString() // Accept any string - our deterministic IDs are valid but not strict UUIDs
  lessonId?: string;

  @IsOptional()
  @IsString() // Accept deterministic IDs
  moduleId?: string;

  @IsOptional()
  @IsString()
  theme?: string;
}

@ApiTags('learn')
@ApiBearerAuth('JWT-auth')
@Controller('learn')
@UseGuards(SupabaseJwtGuard)
// Rate limiting is applied - learn endpoints are critical but should still be rate limited
// Consider using @Throttle() decorator for higher limits if needed
export class LearnController {
  constructor(private readonly learnService: LearnService) {}

  @Get('learning-path')
  async getLearningPath(
    @User() userId: string,
  ): Promise<LearningPathCardDto[]> {
    return this.learnService.getLearningPath(userId);
  }

  @Get('review-summary')
  async getReviewSummary(@User() userId: string): Promise<ReviewSummaryDto> {
    return this.learnService.getReviewSummary(userId);
  }

  @Get('suggestions')
  async getSuggestions(
    @User() userId: string,
    @Query() query: LearnSuggestionsQueryDto,
  ) {
    return this.learnService.getSuggestions(
      userId,
      query.currentLessonId,
      query.moduleId,
      query.limit || 3,
    );
  }

  @Get('session-plan')
  async getSessionPlan(
    @User() userId: string,
    @Query() query: SessionPlanQueryDto,
  ): Promise<SessionPlanDto> {
    return this.learnService.getSessionPlan(userId, {
      mode: query.mode || 'mixed',
      timeBudgetSec: query.timeBudgetSec,
      lessonId: query.lessonId,
      moduleId: query.moduleId,
      theme: query.theme,
    });
  }
}
