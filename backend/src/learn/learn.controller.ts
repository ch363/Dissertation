import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LearnService } from './learn.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { UserId } from '../auth/user-id.decorator';
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

@Controller('learn')
@UseGuards(SupabaseAuthGuard)
export class LearnController {
  constructor(private readonly learnService: LearnService) {}

  @Get('next')
  async getNext(@UserId() userId: string, @Query() query: LearnNextQueryDto) {
    return this.learnService.getNext(userId, query.lessonId);
  }

  @Get('suggestions')
  async getSuggestions(
    @UserId() userId: string,
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
