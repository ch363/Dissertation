import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../common/logger';

@Injectable()
export class SupabaseJwtService {
  private readonly logger = new LoggerService(SupabaseJwtService.name);

  constructor(private configService: ConfigService) {}

  getJwtSecret(): string {
    const jwtSecret = this.configService.get<string>('supabase.jwtSecret');
    const serviceRoleKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );

    const secret = jwtSecret || serviceRoleKey;
    if (!secret) {
      throw new Error(
        'SUPABASE_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY environment variable is required for JWT verification.\n' +
          'Note: SUPABASE_ANON_KEY cannot be used for JWT verification. You need the JWT Secret from Supabase Dashboard > Settings > API > JWT Secret',
      );
    }

    return secret;
  }

  getSupabaseUrl(): string {
    const url = this.configService.get<string>('supabase.url');
    if (!url) {
      throw new Error('SUPABASE_URL environment variable is required');
    }
    return url;
  }

  getSupabaseKey(): string {
    return (
      this.configService.get<string>('supabase.serviceRoleKey') ||
      this.configService.get<string>('supabase.anonKey') ||
      ''
    );
  }

  validateConfig(): void {
    const anonKey = this.configService.get<string>('supabase.anonKey');
    const jwtSecret = this.configService.get<string>('supabase.jwtSecret');
    const serviceRoleKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );

    if (anonKey && !jwtSecret && !serviceRoleKey) {
      this.logger.logWarn(
        'SUPABASE_ANON_KEY cannot be used for JWT verification',
        {
          message:
            'Please set SUPABASE_JWT_SECRET in your .env file. Find it in Supabase Dashboard > Settings > API > JWT Secret',
        },
      );
    }
  }
}
