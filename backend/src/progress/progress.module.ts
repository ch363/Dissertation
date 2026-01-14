import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { EngineModule } from '../engine/engine.module';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [EngineModule, ContentModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
