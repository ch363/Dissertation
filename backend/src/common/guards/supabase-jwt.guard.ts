import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class SupabaseJwtGuard extends AuthGuard('supabase') {
  private readonly logger = new Logger(SupabaseJwtGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Log detailed error information for debugging
    if (err) {
      this.logger.error('Auth error:', err.message || err);
      throw err;
    }

    if (info) {
      this.logger.warn('Auth info:', info.message || info);
    }

    if (!user) {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers?.authorization;

      if (!authHeader) {
        this.logger.warn('Missing Authorization header');
        throw new UnauthorizedException(
          'Missing Authorization header. Please provide: Authorization: Bearer <token>',
        );
      }

      if (!authHeader.startsWith('Bearer ')) {
        this.logger.warn('Invalid Authorization header format');
        throw new UnauthorizedException(
          'Invalid Authorization header format. Expected: Bearer <token>',
        );
      }

      // Provide specific error message for signature issues
      if (info?.message === 'invalid signature') {
        this.logger.error(
          'JWT signature verification failed. This usually means:',
        );
        this.logger.error(
          '1. SUPABASE_JWT_SECRET in .env does not match your Supabase project JWT secret',
        );
        this.logger.error(
          '2. The token was not issued by Supabase (e.g., custom token or wrong project)',
        );
        this.logger.error('3. The token is corrupted or malformed');
        throw new UnauthorizedException(
          'Invalid JWT signature. Please verify:\n' +
            '1. Your SUPABASE_JWT_SECRET in .env matches the JWT Secret from Supabase Dashboard (Settings > API)\n' +
            '2. You are using a valid Supabase access token (from signInWithPassword, not a custom token)\n' +
            '3. The token is from the same Supabase project as your SUPABASE_URL',
        );
      }

      this.logger.warn(
        'Token validation failed:',
        info?.message || 'Unknown error',
      );
      throw new UnauthorizedException(
        info?.message ||
          'Invalid or expired authentication token. Please check your JWT token and SUPABASE_JWT_SECRET.',
      );
    }

    return user;
  }
}
