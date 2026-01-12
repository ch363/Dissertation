import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DELIVERY_METHOD, KNOWLEDGE_LEVEL } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(DELIVERY_METHOD)
  preferredDeliveryMethod?: DELIVERY_METHOD;

  @IsOptional()
  @IsEnum(KNOWLEDGE_LEVEL)
  knowledgeLevel?: KNOWLEDGE_LEVEL;
}
