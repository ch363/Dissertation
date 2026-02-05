import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { LessonProgressService } from './lesson-progress.service';
import { QuestionAttemptService } from './question-attempt.service';
import { AnswerValidationService } from './answer-validation.service';
import { ProgressSummaryService } from './progress-summary.service';
import { DeliveryMethodScoreService } from './delivery-method-score.service';
import { ProgressResetService } from './progress-reset.service';
import { EngineModule } from '../engine/engine.module';
import { ContentModule } from '../content/content.module';
import { SpeechModule } from '../speech/speech.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { GrammarModule } from '../grammar/grammar.module';

/**
 * ProgressModule
 * 
 * Demonstrates SOLID principles through service decomposition:
 * - Single Responsibility: Each service has one focused domain
 * - Dependency Inversion: Services depend on injected abstractions
 * 
 * The ProgressService acts as a facade for backward compatibility,
 * while internally the logic is split into focused services.
 */
@Module({
  imports: [
    EngineModule,
    ContentModule,
    SpeechModule,
    OnboardingModule,
    GrammarModule,
  ],
  controllers: [ProgressController],
  providers: [
    // Facade service (maintains backward compatibility)
    ProgressService,
    // Focused services (SOLID-compliant split)
    LessonProgressService,
    QuestionAttemptService,
    AnswerValidationService,
    ProgressSummaryService,
    DeliveryMethodScoreService,
    ProgressResetService,
  ],
  exports: [
    ProgressService, // Export facade for other modules
    // Also export individual services for fine-grained access
    LessonProgressService,
    QuestionAttemptService,
    AnswerValidationService,
    ProgressSummaryService,
    DeliveryMethodScoreService,
    ProgressResetService,
  ],
})
export class ProgressModule {}
