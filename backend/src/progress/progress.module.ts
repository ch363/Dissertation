import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { LessonProgressService } from './lesson-progress.service';
import { QuestionAttemptService } from './question-attempt.service';
import { AnswerValidationService } from './answer-validation.service';
import { ProgressSummaryService } from './progress-summary.service';
import { DeliveryMethodScoreService } from './delivery-method-score.service';
import { ProgressResetService } from './progress-reset.service';
import { UserDataCleanupService } from './user-data-cleanup.service';
import { EngineModule } from '../engine/engine.module';
import { ContentModule } from '../content/content.module';
import { SpeechModule } from '../speech/speech.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { GrammarModule } from '../grammar/grammar.module';
import { QuestionsModule } from '../questions/questions.module';
import { TeachingsModule } from '../teachings/teachings.module';
// Progress repositories (SOLID - Dependency Inversion)
import {
  UserLessonRepository,
  UserTeachingCompletedRepository,
} from './repositories';

/**
 * ProgressModule
 * 
 * Demonstrates SOLID principles through service decomposition:
 * - Single Responsibility: Each service has one focused domain
 * - Dependency Inversion: Services depend on repository abstractions
 * 
 * The ProgressService acts as a facade for backward compatibility,
 * while internally the logic is split into focused services.
 * 
 * ## Data Access Pattern
 * 
 * Progress services use repositories for standard CRUD operations (DIP compliant).
 * For complex aggregations that don't map to CRUD patterns, we delegate to
 * engine repositories like UserQuestionPerformanceRepository.
 */
@Module({
  imports: [
    EngineModule,
    ContentModule,
    SpeechModule,
    OnboardingModule,
    GrammarModule,
    QuestionsModule,
    TeachingsModule,
  ],
  controllers: [ProgressController],
  providers: [
    // Progress repositories (DIP compliance)
    UserLessonRepository,
    UserTeachingCompletedRepository,
    // Facade service (maintains backward compatibility)
    ProgressService,
    // Focused services (SOLID-compliant split)
    LessonProgressService,
    QuestionAttemptService,
    AnswerValidationService,
    ProgressSummaryService,
    DeliveryMethodScoreService,
    ProgressResetService,
    UserDataCleanupService,
  ],
  exports: [
    // Export repositories for external use
    UserLessonRepository,
    UserTeachingCompletedRepository,
    ProgressService, // Export facade for other modules
    // Also export individual services for fine-grained access
    LessonProgressService,
    QuestionAttemptService,
    AnswerValidationService,
    ProgressSummaryService,
    DeliveryMethodScoreService,
    ProgressResetService,
    UserDataCleanupService,
  ],
})
export class ProgressModule {}
