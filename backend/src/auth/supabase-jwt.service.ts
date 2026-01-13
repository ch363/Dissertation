import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseJwtService {
  constructor(private configService: ConfigService) {}

  /**
   * Get JWT secret for token verification
   * Uses SUPABASE_JWT_SECRET or falls back to SUPABASE_SERVICE_ROLE_KEY
   */
  getJwtSecret(): string {
    const jwtSecret = this.configService.get<string>('supabase.jwtSecret');
    const serviceRoleKey = this.configService.get<string>('supabase.serviceRoleKey');

    const secret = jwtSecret || serviceRoleKey;
    if (!secret) {
      throw new Error(
        'SUPABASE_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY environment variable is required for JWT verification.\n' +
        'Note: SUPABASE_ANON_KEY cannot be used for JWT verification. You need the JWT Secret from Supabase Dashboard > Settings > API > JWT Secret'
      );
    }

    return secret;
  }

  /**
   * Get Supabase URL
   */
  getSupabaseUrl(): string {
    const url = this.configService.get<string>('supabase.url');
    if (!url) {
      throw new Error('SUPABASE_URL environment variable is required');
    }
    return url;
  }

  /**
   * Get Supabase service role key or anon key for client creation
   */
  getSupabaseKey(): string {
    return (
      this.configService.get<string>('supabase.serviceRoleKey') ||
      this.configService.get<string>('supabase.anonKey') ||
      ''
    );
  }

  /**
   * Validate that required Supabase configuration is present
   */
  validateConfig(): void {
    const anonKey = this.configService.get<string>('supabase.anonKey');
    const jwtSecret = this.configService.get<string>('supabase.jwtSecret');
    const serviceRoleKey = this.configService.get<string>('supabase.serviceRoleKey');

    // Warn if someone tries to use anon key for JWT verification
    if (anonKey && !jwtSecret && !serviceRoleKey) {
      console.warn(
        'WARNING: SUPABASE_ANON_KEY cannot be used for JWT verification. ' +
        'Please set SUPABASE_JWT_SECRET in your .env file. ' +
        'Find it in Supabase Dashboard > Settings > API > JWT Secret'
      );
    }
  }
}
