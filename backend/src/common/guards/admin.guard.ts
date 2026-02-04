import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { LoggerService } from '../logger';

// Use after SupabaseJwtGuard: @UseGuards(SupabaseJwtGuard, AdminGuard)
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new LoggerService(AdminGuard.name);
  private supabaseAdmin: ReturnType<typeof createClient> | null = null;

  constructor(private configService: ConfigService) {
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
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const isAdmin = await this.isUserAdmin(userId);

    if (!isAdmin) {
      throw new ForbiddenException(
        'Insufficient permissions. Admin access required.',
      );
    }

    return true;
  }

  private async isUserAdmin(userId: string): Promise<boolean> {
    // Environment-based admin list for dev/testing
    const adminUsers = this.configService.get<string>('ADMIN_USERS', '');
    const adminUserIds = adminUsers.split(',').map((id) => id.trim());
    if (adminUserIds.includes(userId)) {
      return true;
    }

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
