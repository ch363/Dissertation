import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentModule } from '../content/content.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { ContentDeliveryService } from './content-delivery/content-delivery.service';
import { SessionPlanService } from './content-delivery/session-plan.service';
import { SessionPlanCacheService } from './content-delivery/session-plan-cache.service';
import { CandidateService } from './content-delivery/candidate.service';
import { DifficultyCalculator } from './content-delivery/difficulty-calculator.service';
import { SrsService } from './srs/srs.service';
import { XpService } from './scoring/xp.service';
import { MasteryService } from './mastery/mastery.service';
// New split services
import { UserPerformanceService } from './content-delivery/user-performance.service';
import { ContentDataService } from './content-delivery/content-data.service';
import { StepBuilderService } from './content-delivery/step-builder.service';
import { SessionOrchestrationService } from './content-delivery/session-orchestration.service';
// Delivery method strategies
import { DeliveryMethodRegistry } from './content-delivery/delivery-methods/delivery-method-registry';
import {
  MultipleChoiceStrategy,
  FillBlankStrategy,
  TextTranslationStrategy,
} from './content-delivery/delivery-methods/strategies';

@Module({
  imports: [PrismaModule, ContentModule, OnboardingModule],
  providers: [
    ContentDeliveryService,
    SessionPlanService,
    SessionPlanCacheService,
    CandidateService,
    DifficultyCalculator,
    SrsService,
    XpService,
    MasteryService,
    // New split services for SessionPlan
    UserPerformanceService,
    ContentDataService,
    StepBuilderService,
    SessionOrchestrationService,
    // Delivery method strategy pattern
    DeliveryMethodRegistry,
    MultipleChoiceStrategy,
    FillBlankStrategy,
    TextTranslationStrategy,
    // Registry initialization factory
    {
      provide: 'DELIVERY_METHOD_REGISTRY_INIT',
      useFactory: (
        registry: DeliveryMethodRegistry,
        mcStrategy: MultipleChoiceStrategy,
        fbStrategy: FillBlankStrategy,
        ttStrategy: TextTranslationStrategy,
      ) => {
        // Register all strategies
        registry.register(mcStrategy);
        registry.register(fbStrategy);
        registry.register(ttStrategy);
        return registry;
      },
      inject: [
        DeliveryMethodRegistry,
        MultipleChoiceStrategy,
        FillBlankStrategy,
        TextTranslationStrategy,
      ],
    },
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
    SessionOrchestrationService,
    DeliveryMethodRegistry,
  ],
})
export class EngineModule {}
