import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { LearnService } from './learn.service';
import { SupabaseJwtGuard } from '../common/guards/supabase-jwt.guard';
import { User } from '../common/decorators/user.decorator';
import { IsUUID, IsOptional, IsInt, Min, IsEnum, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { SessionPlanDto } from '../engine/content-delivery/session-types';

export class LearnNextQueryDto {
  @IsString() // Accept deterministic IDs (not strict UUIDs)
  lessonId: string;
}

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
  @IsString()
  theme?: string;
}

@ApiTags('learn')
@ApiBearerAuth('JWT-auth')
@Controller('learn')
@UseGuards(SupabaseJwtGuard)
@SkipThrottle() // Exclude learn endpoints from throttling - they're critical for app functionality
export class LearnController {
  constructor(private readonly learnService: LearnService) {}

  @Get('next')
  @ApiOperation({ summary: 'Get next item in lesson (reviews → new → done)' })
  @ApiQuery({ name: 'lessonId', type: 'string', format: 'uuid', required: true })
  @ApiResponse({ status: 200, description: 'Next item retrieved' })
  async getNext(@User() userId: string, @Query() query: LearnNextQueryDto) {
    return this.learnService.getNext(userId, query.lessonId);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get lesson/module suggestions' })
  @ApiQuery({ name: 'currentLessonId', type: 'string', format: 'uuid', required: false })
  @ApiQuery({ name: 'moduleId', type: 'string', format: 'uuid', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false, default: 3 })
  @ApiResponse({ status: 200, description: 'Suggestions retrieved' })
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
  @ApiOperation({ summary: 'Get complete learning session plan' })
  @ApiQuery({ name: 'mode', enum: ['learn', 'review', 'mixed'], required: false })
  @ApiQuery({ name: 'timeBudgetSec', type: 'number', required: false })
  @ApiQuery({ name: 'lessonId', type: 'string', format: 'uuid', required: false })
  @ApiQuery({ name: 'theme', type: 'string', required: false })
  @ApiResponse({ status: 200, description: 'Session plan retrieved', type: Object })
  async getSessionPlan(
    @User() userId: string,
    @Query() query: SessionPlanQueryDto,
  ): Promise<SessionPlanDto> {
    return this.learnService.getSessionPlan(userId, {
      mode: query.mode || 'mixed',
      timeBudgetSec: query.timeBudgetSec,
      lessonId: query.lessonId,
      theme: query.theme,
    });
  }
}
