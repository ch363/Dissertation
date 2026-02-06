import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { UsersService } from '../users/users.service';
import { LoggerService } from '../common/logger';

/**
 * MeProfileService
 *
 * Handles user profile operations including display name resolution and avatar management.
 * Follows SRP - focused on profile-related concerns.
 */
@Injectable()
export class MeProfileService {
  private supabaseAdmin: ReturnType<typeof createClient> | null = null;
  private readonly logger = new LoggerService(MeProfileService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const serviceRoleKey = this.configService.get<string>('supabase.serviceRoleKey');
    if (supabaseUrl && serviceRoleKey) {
      this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  /**
   * Get user profile with display name resolution.
   * Attempts to resolve display name from:
   * 1. Database user record
   * 2. Supabase auth metadata
   * 3. Email prefix as fallback
   * 4. "User" as final fallback
   */
  async getMe(userId: string) {
    const user = await this.usersService.upsertUser(userId);
    let displayName = user.name;

    if (!displayName || displayName.trim() === '') {
      displayName = await this.resolveDisplayName(userId, user);
    }

    return {
      ...user,
      displayName: displayName || 'User',
    };
  }

  /**
   * Upload or update user avatar.
   */
  async uploadAvatar(userId: string, avatarUrl: string) {
    await this.usersService.updateUser(userId, { avatarUrl });

    return {
      message: 'Avatar uploaded successfully',
      avatarUrl,
    };
  }

  /**
   * Resolve display name from Supabase auth metadata.
   */
  private async resolveDisplayName(
    userId: string,
    user: { name: string | null },
  ): Promise<string> {
    if (!this.supabaseAdmin) {
      return 'User';
    }

    try {
      const { data: authUser, error } =
        await this.supabaseAdmin.auth.admin.getUserById(userId);

      if (error || !authUser?.user) {
        return 'User';
      }

      const authMetadataName = (authUser.user.user_metadata as Record<string, unknown>)?.name;

      if (authMetadataName && typeof authMetadataName === 'string' && authMetadataName.trim()) {
        const displayName = authMetadataName.trim();
        await this.syncNameToDatabase(userId, displayName);
        return displayName;
      }

      // Fallback to email prefix
      const email = authUser.user.email;
      if (email) {
        const emailName = email.split('@')[0];
        return emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }

      return 'User';
    } catch (error) {
      this.logger.logWarn('Failed to fetch user metadata from Supabase', {
        error: String(error),
      });
      return 'User';
    }
  }

  /**
   * Sync resolved display name back to database.
   */
  private async syncNameToDatabase(userId: string, displayName: string): Promise<void> {
    try {
      await this.usersService.updateUser(userId, {
        name: displayName || undefined,
      });
    } catch (syncError) {
      this.logger.logWarn('Failed to sync name from auth metadata to DB', {
        error: String(syncError),
      });
    }
  }
}
