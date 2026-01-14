import { IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveOnboardingDto {
  @ApiProperty({
    description: 'Raw onboarding answers (will be processed server-side)',
    example: {
      motivation: { key: 'travel', otherText: null },
      learningStyles: ['visual', 'auditory'],
      difficulty: 'balanced',
      gamification: 'light',
      feedback: 'direct',
      sessionStyle: 'focused',
      tone: 'friendly',
      experience: 'beginner',
    },
  })
  @IsObject()
  answers: Record<string, any>; // Raw OnboardingAnswers - backend will process into submission
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
