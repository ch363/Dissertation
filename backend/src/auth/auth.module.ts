import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseStrategy } from './supabase.strategy';
import { SupabaseJwtService } from './supabase-jwt.service';

@Module({
  imports: [PassportModule],
  providers: [SupabaseStrategy, SupabaseJwtService],
  exports: [SupabaseJwtService],
})
export class AuthModule {}
