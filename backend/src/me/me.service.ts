import { Injectable } from '@nestjs/common';
import { MeDashboardService } from './me-dashboard.service';
import { MeProfileService } from './me-profile.service';
import { MeLearningService } from './me-learning.service';
import { MeAccountService } from './me-account.service';
import { ResetProgressDto } from '../progress/dto/reset-progress.dto';

/**
 * MeService
 *
 * Thin facade that delegates to specialized services.
 * Follows SRP by keeping coordination thin and delegating actual work.
 *
 * Delegates to:
 * - MeDashboardService: Dashboard and statistics
 * - MeProfileService: Profile and avatar management
 * - MeLearningService: Lessons, mastery, recent activity
 * - MeAccountService: Account deletion and progress reset
 */
@Injectable()
export class MeService {
  constructor(
    private readonly dashboardService: MeDashboardService,
    private readonly profileService: MeProfileService,
    private readonly learningService: MeLearningService,
    private readonly accountService: MeAccountService,
  ) {}

  // ============================================
  // Profile Operations (MeProfileService)
  // ============================================

  /**
   * Get user profile with display name resolution.
   */
  async getMe(userId: string) {
    return this.profileService.getMe(userId);
  }

  /**
   * Upload or update user avatar.
   */
  async uploadAvatar(userId: string, avatarUrl: string) {
    return this.profileService.uploadAvatar(userId, avatarUrl);
  }

  // ============================================
  // Dashboard Operations (MeDashboardService)
  // ============================================

  /**
   * Get comprehensive dashboard data.
   */
  async getDashboard(userId: string, tzOffsetMinutes?: number) {
    return this.dashboardService.getDashboard(userId, tzOffsetMinutes);
  }

  /**
   * Get daily stats (minutes, items, accuracy).
   */
  async getStats(userId: string, tzOffsetMinutes?: number) {
    return this.dashboardService.getStats(userId, tzOffsetMinutes);
  }

  // ============================================
  // Learning Operations (MeLearningService)
  // ============================================

  /**
   * Get all lessons the user has started.
   */
  async getMyLessons(userId: string) {
    return this.learningService.getMyLessons(userId);
  }

  /**
   * Get all mastery records.
   */
  async getAllMastery(userId: string) {
    return this.learningService.getAllMastery(userId);
  }

  /**
   * Get recent learning activity.
   */
  async getRecent(userId: string) {
    return this.learningService.getRecent(userId);
  }

  // ============================================
  // Account Operations (MeAccountService)
  // ============================================

  /**
   * Reset all progress for a user.
   */
  async resetAllProgress(userId: string, options?: ResetProgressDto) {
    return this.accountService.resetAllProgress(userId, options);
  }

  /**
   * Delete user account and all associated data.
   */
  async deleteAccount(userId: string) {
    return this.accountService.deleteAccount(userId);
  }
}
