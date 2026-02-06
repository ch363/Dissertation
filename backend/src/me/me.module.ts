import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { MeDashboardService } from './me-dashboard.service';
import { MeProfileService } from './me-profile.service';
import { MeLearningService } from './me-learning.service';
import { MeAccountService } from './me-account.service';
import { UsersModule } from '../users/users.module';
import { ProgressModule } from '../progress/progress.module';
import { EngineModule } from '../engine/engine.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    UsersModule,
    ProgressModule,
    EngineModule,
  ],
  controllers: [MeController],
  providers: [
    MeDashboardService,
    MeProfileService,
    MeLearningService,
    MeAccountService,
    MeService,
  ],
  exports: [MeService],
})
export class MeModule {}
