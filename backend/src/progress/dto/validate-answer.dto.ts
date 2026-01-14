import { IsString, IsEnum, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DELIVERY_METHOD } from '@prisma/client';

export class ValidateAnswerDto {
  @ApiProperty({
    description: "User's answer (text for translation/fill-blank/listening, option ID for multiple choice)",
    example: 'Grazie',
  })
  @IsString()
  answer: string;

  @ApiProperty({
    description: 'Delivery method to determine validation logic',
    enum: DELIVERY_METHOD,
    example: DELIVERY_METHOD.TEXT_TRANSLATION,
  })
  @IsEnum(DELIVERY_METHOD)
  deliveryMethod: DELIVERY_METHOD;

  @ApiPropertyOptional({
    description: 'Time taken to complete in milliseconds (for future scoring refinement)',
    example: 5000,
  })
  @IsOptional()
  @IsInt()
  timeToComplete?: number;
}
