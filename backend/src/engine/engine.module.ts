import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentModule } from '../content/content.module';
import { ContentDeliveryService } from './content-delivery/content-delivery.service';
import { SessionPlanService } from './content-delivery/session-plan.service';
import { SrsService } from './srs/srs.service';
import { XpService } from './scoring/xp.service';

/**
 * Engine Module
 * 
 * This module provides the "brain" of the adaptive learning system:
 * - Content Delivery: Selects what content to show next (reviews vs new)
 * - Session Planning: Generates complete learning session plans with teach-then-test, interleaving, and adaptive modality
 * - SRS (Spaced Repetition): Manages scheduling and intervals using SM-2 algorithm
 * - Scoring: Tracks XP and achievements
 * 
 * This is a SERVICE LAYER, not middleware. It's called by domain services
 * (LearnService, ProgressService) to handle adaptive learning logic.
 */
@Module({
  imports: [PrismaModule, ContentModule],
  providers: [ContentDeliveryService, SessionPlanService, SrsService, XpService],
  exports: [ContentDeliveryService, SessionPlanService, SrsService, XpService],
})
export class EngineModule {}
