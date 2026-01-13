import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LearnService } from './learn.service';
import { SupabaseJwtGuard } from '../common/guards/supabase-jwt.guard';
import { User } from '../common/decorators/user.decorator';
import { IsUUID, IsOptional, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class LearnNextQueryDto {
  @IsUUID()
  lessonId: string;
}

export class LearnSuggestionsQueryDto {
  @IsOptional()
  @IsUUID()
  currentLessonId?: string;

  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;
}

@ApiTags('learn')
@ApiBearerAuth('JWT-auth')
@Controller('learn')
@UseGuards(SupabaseJwtGuard)
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
}
