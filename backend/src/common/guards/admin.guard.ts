import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { BaseGuard } from './base.guard';

/**
 * AdminGuard
 *
 * Extends BaseGuard to check for admin permissions.
 * Use after SupabaseJwtGuard: @UseGuards(SupabaseJwtGuard, AdminGuard)
 *
 * Demonstrates:
 * - Template Method Pattern: Extends BaseGuard for common functionality
 * - Single Responsibility: Focused on admin permission checking
 */
@Injectable()
export class AdminGuard extends BaseGuard {
  private supabaseAdmin: ReturnType<typeof createClient> | null = null;

  constructor(private configService: ConfigService) {
    super(AdminGuard.name);

    const supabaseUrl = this.configService.get<string>('supabase.url');
    const serviceRoleKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );

    if (supabaseUrl && serviceRoleKey) {
      this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const userId = this.getUserId(context);

    if (!userId) {
      this.logAccessDenied('User not authenticated', context);
      throw new ForbiddenException('User not authenticated');
    }

    const isAdmin = await this.isUserAdmin(userId);

    if (!isAdmin) {
      this.logAccessDenied('Admin access required', context);
      throw new ForbiddenException(
        'Insufficient permissions. Admin access required.',
      );
    }

    this.logAccessGranted(context);
    return true;
  }

  /**
   * Check if a user has admin privileges.
   * Checks environment-based admin list and Supabase user metadata.
   */
  private async isUserAdmin(userId: string): Promise<boolean> {
    // Environment-based admin list for dev/testing
    const adminUsers = this.configService.get<string>('ADMIN_USERS', '');
    const adminUserIds = adminUsers.split(',').map((id) => id.trim());
    if (adminUserIds.includes(userId)) {
      return true;
    }

    // Check Supabase user metadata
    if (this.supabaseAdmin) {
      try {
        const { data: authUser } =
          await this.supabaseAdmin.auth.admin.getUserById(userId);

        if (authUser?.user?.user_metadata?.is_admin === true) {
          return true;
        }
      } catch (error) {
        this.logger.logError('Error checking admin status', { userId, error });
      }
    }

    return false;
  }
}
