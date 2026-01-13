import { Module } from '@nestjs/common';
import { LearnController } from './learn.controller';
import { LearnService } from './learn.service';
import { EngineModule } from '../engine/engine.module';

@Module({
  imports: [EngineModule],
  controllers: [LearnController],
  providers: [LearnService],
  exports: [LearnService],
})
export class LearnModule {}
