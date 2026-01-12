import { Module } from '@nestjs/common';
import { TeachingsController } from './teachings.controller';
import { TeachingsService } from './teachings.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TeachingsController],
  providers: [TeachingsService],
  exports: [TeachingsService],
})
export class TeachingsModule {}
