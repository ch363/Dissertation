import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentModule } from '../content/content.module';
import { ContentDeliveryService } from './content-delivery/content-delivery.service';
import { SessionPlanService } from './content-delivery/session-plan.service';
import { SessionPlanCacheService } from './content-delivery/session-plan-cache.service';
import { SrsService } from './srs/srs.service';
import { XpService } from './scoring/xp.service';
import { MasteryService } from './mastery/mastery.service';

/**
 * Engine Module
 *
 * This module provides the "brain" of the adaptive learning system:
 * - Content Delivery: Selects what content to show next (reviews vs new)
 * - Session Planning: Generates complete learning session plans with teach-then-test, interleaving, and adaptive modality
 * - SRS (Spaced Repetition): Manages scheduling and intervals using FSRS algorithm
 * - Scoring: Tracks XP and achievements
 * - Mastery: Tracks skill mastery using Bayesian Knowledge Tracing (BKT)
 *
 * This is a SERVICE LAYER, not middleware. It's called by domain services
 * (LearnService, ProgressService) to handle adaptive learning logic.
 */
@Module({
  imports: [PrismaModule, ContentModule],
  providers: [
    ContentDeliveryService,
    SessionPlanService,
    SessionPlanCacheService,
    SrsService,
    XpService,
    MasteryService,
  ],
  exports: [
    ContentDeliveryService,
    SessionPlanService,
    SessionPlanCacheService,
    SrsService,
    XpService,
    MasteryService,
  ],
})
export class EngineModule {}
