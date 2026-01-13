import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentDeliveryService } from './content-delivery/content-delivery.service';
import { SrsService } from './srs/srs.service';
import { XpService } from './scoring/xp.service';

/**
 * Engine Module
 * 
 * This module provides the "brain" of the adaptive learning system:
 * - Content Delivery: Selects what content to show next (reviews vs new)
 * - SRS (Spaced Repetition): Manages scheduling and intervals using SM-2 algorithm
 * - Scoring: Tracks XP and achievements
 * 
 * This is a SERVICE LAYER, not middleware. It's called by domain services
 * (LearnService, ProgressService) to handle adaptive learning logic.
 */
@Module({
  imports: [PrismaModule],
  providers: [ContentDeliveryService, SrsService, XpService],
  exports: [ContentDeliveryService, SrsService, XpService],
})
export class EngineModule {}
