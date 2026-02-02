import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { createClient } from '@supabase/supabase-js';
import { SupabaseJwtService } from './supabase-jwt.service';
import { JwtPayload } from './types';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  private supabase;

  constructor(private jwtService: SupabaseJwtService) {
    jwtService.validateConfig();

    const jwtSecret = jwtService.getJwtSecret();
    const supabaseUrl = jwtService.getSupabaseUrl();
    const supabaseKey = jwtService.getSupabaseKey();

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      algorithms: ['HS256'],
    });

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async validate(payload: JwtPayload): Promise<{ id: string }> {
    const userId = payload.sub;

    if (!userId) {
      throw new UnauthorizedException('Invalid token: missing user ID');
    }

    return { id: userId };
  }
}
