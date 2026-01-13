import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { createClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email?: string;
  [key: string]: any;
}

@Injectable()
export class SupabaseAuthStrategy extends PassportStrategy(Strategy, 'supabase') {
  private supabase;

  constructor(private configService: ConfigService) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL');
    const supabaseJwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');
    const supabaseServiceRoleKey = configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is required');
    }

    // IMPORTANT: For JWT verification, we need SUPABASE_JWT_SECRET (not ANON_KEY)
    // The JWT secret is used to verify tokens signed by Supabase Auth
    // ANON_KEY is for client-side operations, not for token verification
    const jwtSecret = supabaseJwtSecret || supabaseServiceRoleKey;
    if (!jwtSecret) {
      throw new Error(
        'SUPABASE_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY environment variable is required for JWT verification.\n' +
        'Note: SUPABASE_ANON_KEY cannot be used for JWT verification. You need the JWT Secret from Supabase Dashboard > Settings > API > JWT Secret'
      );
    }

    // Warn if someone tries to use anon key (it won't work for verification)
    if (supabaseAnonKey && !supabaseJwtSecret && !supabaseServiceRoleKey) {
      console.warn(
        'WARNING: SUPABASE_ANON_KEY cannot be used for JWT verification. ' +
        'Please set SUPABASE_JWT_SECRET in your .env file. ' +
        'Find it in Supabase Dashboard > Settings > API > JWT Secret'
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      algorithms: ['HS256'],
    });

    this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey || '');
  }

  async validate(payload: JwtPayload): Promise<{ id: string }> {
    // Extract user ID from 'sub' claim (Supabase standard)
    const userId = payload.sub;
    
    if (!userId) {
      throw new UnauthorizedException('Invalid token: missing user ID');
    }

    // Return user object that will be attached to request
    return { id: userId };
  }
}
