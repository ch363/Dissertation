import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateAnswerResponseDto {
  @ApiProperty({
    description: 'Whether the answer is correct',
    example: true,
  })
  isCorrect: boolean;

  @ApiProperty({
    description: 'Score from 0-100',
    example: 100,
    minimum: 0,
    maximum: 100,
  })
  score: number;

  @ApiPropertyOptional({
    description: 'Optional feedback or explanation',
    example: 'Excellent! "Grazie" means "Thank you" in Italian.',
  })
  feedback?: string;
}
