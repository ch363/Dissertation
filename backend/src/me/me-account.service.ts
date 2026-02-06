import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import { UserDataCleanupService } from '../progress/user-data-cleanup.service';
import { ResetProgressDto } from '../progress/dto/reset-progress.dto';
import { LoggerService } from '../common/logger';

/**
 * MeAccountService
 *
 * Handles account-level operations like progress reset and account deletion.
 * Follows SRP - focused on account management concerns.
 * Uses UserDataCleanupService for data cleanup (DRY compliance).
 */
@Injectable()
export class MeAccountService {
  private readonly logger = new LoggerService(MeAccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
    private readonly userDataCleanupService: UserDataCleanupService,
  ) {}

  /**
   * Reset all progress for a user.
   * Delegates to ProgressService for the actual reset logic.
   */
  async resetAllProgress(userId: string, options?: ResetProgressDto) {
    return this.progressService.resetAllProgress(userId, options);
  }

  /**
   * Delete user account and all associated data.
   * Uses a transaction to ensure atomicity.
   */
  async deleteAccount(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Delete all user-related data using centralized cleanup service
      await this.userDataCleanupService.deleteAllUserDataForAccountDeletion(tx, userId);

      // Delete the user record itself
      await tx.user.delete({
        where: { id: userId },
      });

      this.logger.logInfo(`Deleted account for user ${userId}`);

      return {
        message: 'Account and all associated data deleted successfully',
        deletedAt: new Date().toISOString(),
      };
    });
  }
}
