import { IsObject, IsOptional, IsString, IsArray, ValidateNested, IsIn, MaxLength, ArrayMaxSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Allowed values for onboarding answers
 * Security: Restricts inputs to known valid values to prevent injection
 */
const ALLOWED_MOTIVATIONS = ['travel', 'work', 'education', 'culture', 'family', 'other'] as const;
const ALLOWED_LEARNING_STYLES = ['visual', 'auditory', 'reading', 'kinesthetic'] as const;
const ALLOWED_DIFFICULTIES = ['easy', 'balanced', 'challenging'] as const;
const ALLOWED_GAMIFICATION = ['none', 'light', 'full'] as const;
const ALLOWED_FEEDBACK = ['gentle', 'direct', 'detailed'] as const;
const ALLOWED_SESSION_STYLES = ['quick', 'focused', 'deep'] as const;
const ALLOWED_TONES = ['formal', 'friendly', 'casual'] as const;
const ALLOWED_EXPERIENCES = ['beginner', 'some', 'intermediate', 'advanced'] as const;

/**
 * Nested DTO for motivation answer
 */
class MotivationAnswerDto {
  @IsString()
  @IsIn([...ALLOWED_MOTIVATIONS], { message: 'Invalid motivation key' })
  key: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Other text must not exceed 500 characters' })
  @Transform(({ value }) => value ? String(value).trim().substring(0, 500) : null)
  otherText?: string | null;
}

/**
 * DTO for saving onboarding answers
 * 
 * Security: Input validation and sanitization
 * - All fields validated against allowed values
 * - Prevents arbitrary JSON injection
 * - Length limits on free-text fields
 */
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
  @Transform(({ value }) => {
    // Security: Validate and sanitize the answers object
    if (!value || typeof value !== 'object') {
      return {};
    }
    
    const sanitized: Record<string, any> = {};
    
    // Validate motivation
    if (value.motivation && typeof value.motivation === 'object') {
      const key = String(value.motivation.key || '').trim();
      if (ALLOWED_MOTIVATIONS.includes(key as any)) {
        sanitized.motivation = {
          key,
          otherText: value.motivation.otherText 
            ? String(value.motivation.otherText).trim().substring(0, 500) 
            : null,
        };
      }
    }
    
    // Validate learningStyles (array)
    if (Array.isArray(value.learningStyles)) {
      sanitized.learningStyles = value.learningStyles
        .filter((s: any) => typeof s === 'string' && ALLOWED_LEARNING_STYLES.includes(s as any))
        .slice(0, 4); // Max 4 learning styles
    }
    
    // Validate difficulty
    if (typeof value.difficulty === 'string' && 
        (ALLOWED_DIFFICULTIES as readonly string[]).includes(value.difficulty)) {
      sanitized.difficulty = value.difficulty;
    }
    
    // Validate gamification
    if (typeof value.gamification === 'string' && 
        (ALLOWED_GAMIFICATION as readonly string[]).includes(value.gamification)) {
      sanitized.gamification = value.gamification;
    }
    
    // Validate feedback
    if (typeof value.feedback === 'string' && 
        (ALLOWED_FEEDBACK as readonly string[]).includes(value.feedback)) {
      sanitized.feedback = value.feedback;
    }
    
    // Validate sessionStyle
    if (typeof value.sessionStyle === 'string' && 
        (ALLOWED_SESSION_STYLES as readonly string[]).includes(value.sessionStyle)) {
      sanitized.sessionStyle = value.sessionStyle;
    }
    
    // Validate tone
    if (typeof value.tone === 'string' && 
        (ALLOWED_TONES as readonly string[]).includes(value.tone)) {
      sanitized.tone = value.tone;
    }
    
    // Validate experience
    if (typeof value.experience === 'string' && 
        (ALLOWED_EXPERIENCES as readonly string[]).includes(value.experience)) {
      sanitized.experience = value.experience;
    }
    
    return sanitized;
  })
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
