import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentModule } from '../content/content.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { TeachingsModule } from '../teachings/teachings.module';
import { QuestionsModule } from '../questions/questions.module';
import { ContentDeliveryService } from './content-delivery/content-delivery.service';
import { SessionPlanService } from './content-delivery/session-plan.service';
import { SessionPlanCacheService } from './content-delivery/session-plan-cache.service';
import { CandidateService } from './content-delivery/candidate.service';
import { DifficultyCalculator } from './content-delivery/difficulty-calculator.service';
import { SrsService } from './srs/srs.service';
import { XpService } from './scoring/xp.service';
import { MasteryService } from './mastery/mastery.service';
// Split services for SRP compliance
import { UserPerformanceService } from './content-delivery/user-performance.service';
import { ContentDataService } from './content-delivery/content-data.service';
import { StepBuilderService } from './content-delivery/step-builder.service';
import { CandidateSelectorService } from './content-delivery/candidate-selector.service';
import { SequenceComposerService } from './content-delivery/sequence-composer.service';
import { CandidateRepository } from './content-delivery/candidate.repository';
// Delivery method strategies
import { DeliveryMethodRegistry } from './content-delivery/delivery-methods/delivery-method-registry';
import {
  MultipleChoiceStrategy,
  FillBlankStrategy,
  TextTranslationStrategy,
} from './content-delivery/delivery-methods/strategies';
// Engine repositories (DIP compliance)
import {
  UserQuestionPerformanceRepository,
  UserDeliveryMethodScoreRepository,
  UserTeachingViewRepository,
  UserSkillMasteryRepository,
  UserKnowledgeLevelProgressRepository,
} from './repositories';

@Module({
  imports: [PrismaModule, ContentModule, OnboardingModule, TeachingsModule, QuestionsModule],
  providers: [
    // Engine repositories
    UserQuestionPerformanceRepository,
    UserDeliveryMethodScoreRepository,
    UserTeachingViewRepository,
    UserSkillMasteryRepository,
    UserKnowledgeLevelProgressRepository,
    CandidateRepository,
    // Services
    ContentDeliveryService,
    SessionPlanService,
    SessionPlanCacheService,
    CandidateService,
    DifficultyCalculator,
    SrsService,
    XpService,
    MasteryService,
    // Split services for SRP compliance
    UserPerformanceService,
    ContentDataService,
    StepBuilderService,
    CandidateSelectorService,
    SequenceComposerService,
    // Delivery method strategy pattern
    // Strategies are registered in DeliveryMethodRegistry.onModuleInit()
    MultipleChoiceStrategy,
    FillBlankStrategy,
    TextTranslationStrategy,
    DeliveryMethodRegistry,
  ],
  exports: [
    ContentDeliveryService,
    SessionPlanService,
    SessionPlanCacheService,
    CandidateService,
    SrsService,
    XpService,
    MasteryService,
    // Export new services for use in other modules
    UserPerformanceService,
    ContentDataService,
    StepBuilderService,
    DeliveryMethodRegistry,
    // Export repositories for external use
    UserQuestionPerformanceRepository,
    UserDeliveryMethodScoreRepository,
    UserTeachingViewRepository,
    UserSkillMasteryRepository,
    UserKnowledgeLevelProgressRepository,
    CandidateRepository,
  ],
})
export class EngineModule {}
