import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { KNOWLEDGE_LEVEL } from '@prisma/client';

export class CreateTeachingDto {
  @IsEnum(KNOWLEDGE_LEVEL)
  knowledgeLevel: KNOWLEDGE_LEVEL;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsString()
  userLanguageString: string;

  @IsString()
  learningLanguageString: string;

  @IsOptional()
  @IsString()
  tip?: string;

  @IsUUID()
  lessonId: string;
}
