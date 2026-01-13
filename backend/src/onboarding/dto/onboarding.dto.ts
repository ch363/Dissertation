import { IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveOnboardingDto {
  @ApiProperty({
    description: 'Onboarding submission JSON object',
    example: {
      version: 1,
      raw: {
        motivation: { key: 'travel', otherText: null },
        learningStyles: ['visual', 'auditory'],
      },
      tags: ['travel', 'visual'],
      preferences: {},
      signals: {},
      savedAt: '2024-01-01T00:00:00Z',
    },
  })
  @IsObject()
  answers: Record<string, any>;
}

export class OnboardingResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Onboarding answers JSON' })
  answers: Record<string, any>;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export class HasOnboardingResponseDto {
  @ApiProperty({ description: 'Whether user has completed onboarding' })
  hasOnboarding: boolean;
}
