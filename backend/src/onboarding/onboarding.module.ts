import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OnboardingPreferencesService } from './onboarding-preferences.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingPreferencesService],
  exports: [OnboardingService, OnboardingPreferencesService],
})
export class OnboardingModule {}
