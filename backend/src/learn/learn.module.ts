import { Module } from '@nestjs/common';
import { LearnController } from './learn.controller';
import { LearnService } from './learn.service';
import { EngineModule } from '../engine/engine.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [EngineModule, ProgressModule],
  controllers: [LearnController],
  providers: [LearnService],
  exports: [LearnService],
})
export class LearnModule {}
