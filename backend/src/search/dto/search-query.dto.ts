import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { KNOWLEDGE_LEVEL } from '@prisma/client';

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  q?: string; // Search query text

  @IsOptional()
  @IsEnum(KNOWLEDGE_LEVEL)
  level?: KNOWLEDGE_LEVEL; // Filter by knowledge level

  @IsOptional()
  @IsString()
  topic?: string; // Filter by topic (could be a tag or category)

  @IsOptional()
  @IsString()
  type?: 'module' | 'lesson' | 'teaching' | 'question'; // Content type filter

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number;
}
