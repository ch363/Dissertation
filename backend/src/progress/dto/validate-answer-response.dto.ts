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

  @ApiPropertyOptional({
    description:
      'Grammatical correctness 0–100 for text-input answers (translation, fill-blank, listening type)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  grammaticalCorrectness?: number;

  @ApiPropertyOptional({
    description:
      'True when the answer is meaning-correct but less natural (e.g. acceptable alternative).',
    example: true,
  })
  meaningCorrect?: boolean;

  @ApiPropertyOptional({
    description:
      'Preferred natural phrasing to show when meaningCorrect is true.',
    example: 'What time is it?',
  })
  naturalPhrasing?: string;

  @ApiPropertyOptional({
    description:
      'Optional explanation for why the natural phrasing is preferred.',
    example:
      'Native speakers usually say "What time is it?" rather than "What is the time?".',
  })
  feedbackWhy?: string;

  @ApiPropertyOptional({
    description:
      'Other accepted forms to show after submit (e.g. alternative phrasings).',
    example: ["What's the time?"],
    type: [String],
  })
  acceptedVariants?: string[];
}
