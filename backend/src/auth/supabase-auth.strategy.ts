import { Injectable, UnauthorizedException } from '@nestjs/common';
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

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is required');
    }

    // Prefer JWT_SECRET for verification, fallback to service role key
    const jwtSecret = supabaseJwtSecret || supabaseServiceRoleKey;
    if (!jwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      algorithms: ['HS256'],
    });

    this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey || process.env.SUPABASE_ANON_KEY || '');
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
