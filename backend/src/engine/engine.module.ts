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
  ],
  exports: [
    ContentDeliveryService,
    SessionPlanService,
    SessionPlanCacheService,
    CandidateService,
    SrsService,
    XpService,
    MasteryService,
  ],
})
export class EngineModule {}
