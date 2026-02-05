import { Injectable } from '@nestjs/common';
import { ContentDeliveryService } from '../engine/content-delivery/content-delivery.service';
import {
  SessionPlanDto,
  SessionContext,
} from '../engine/content-delivery/session-types';
import { LearningPathCardDto } from './learning-path.dto';
import { LearningPathService } from './learning-path.service';
import {
  SuggestionService,
  SuggestionsResult,
} from './suggestion.service';
import { ILearnService } from '../common/interfaces';

/**
 * LearnService (Facade)
 *
 * Facade that delegates to focused services.
 * Implements ILearnService interface for Dependency Inversion.
 *
 * SOLID Principles:
 * - Single Responsibility: Delegates to focused services
 * - Open/Closed: New features via new services
 * - Dependency Inversion: Implements interface abstraction
 */
@Injectable()
export class LearnService implements ILearnService {
  constructor(
    private contentDelivery: ContentDeliveryService,
    private learningPathService: LearningPathService,
    private suggestionService: SuggestionService,
  ) {}

  /**
   * Get the learning path for a user.
   * Delegates to LearningPathService.
   */
  async getLearningPath(userId: string): Promise<LearningPathCardDto[]> {
    return this.learningPathService.getLearningPath(userId);
  }

  /**
   * Get content suggestions for a user.
   * Delegates to SuggestionService.
   */
  async getSuggestions(
    userId: string,
    currentLessonId?: string,
    moduleId?: string,
    limit?: number,
  ): Promise<SuggestionsResult> {
    return this.suggestionService.getSuggestions(
      userId,
      currentLessonId,
      moduleId,
      limit,
    );
  }

  /**
   * Get a session plan for a user.
   * Delegates to ContentDeliveryService.
   */
  async getSessionPlan(
    userId: string,
    context: SessionContext,
  ): Promise<SessionPlanDto> {
    return this.contentDelivery.getSessionPlan(userId, context);
  }

  /**
   * Get user's knowledge level.
   * Delegates to LearningPathService.
   */
  async getUserKnowledgeLevel(userId: string): Promise<string> {
    return this.learningPathService.getUserKnowledgeLevel(userId);
  }

  /**
   * Get module progress.
   * Delegates to LearningPathService.
   */
  async getModuleProgress(
    userId: string,
    moduleId: string,
  ): Promise<{ completed: number; total: number }> {
    return this.learningPathService.getModuleProgress(userId, moduleId);
  }
}
