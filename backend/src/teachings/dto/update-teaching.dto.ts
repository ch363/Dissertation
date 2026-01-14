import { IsString, IsEnum, IsOptional } from 'class-validator';
import { KNOWLEDGE_LEVEL } from '@prisma/client';

export class UpdateTeachingDto {
  @IsOptional()
  @IsEnum(KNOWLEDGE_LEVEL)
  knowledgeLevel?: KNOWLEDGE_LEVEL;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsString()
  userLanguageString?: string;

  @IsOptional()
  @IsString()
  learningLanguageString?: string;

  @IsOptional()
  @IsString()
  tip?: string;
}
