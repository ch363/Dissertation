import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { EngineModule } from '../engine/engine.module';
import { ContentModule } from '../content/content.module';
import { SpeechModule } from '../speech/speech.module';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [EngineModule, ContentModule, SpeechModule, OnboardingModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
