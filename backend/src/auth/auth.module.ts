import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseAuthStrategy } from './supabase-auth.strategy';

@Module({
  imports: [PassportModule],
  providers: [SupabaseAuthStrategy, SupabaseAuthGuard],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
