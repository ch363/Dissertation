import { Module } from '@nestjs/common';
import { LearnController } from './learn.controller';
import { LearnService } from './learn.service';
import { LearningPathService } from './learning-path.service';
import { SuggestionService } from './suggestion.service';
import { EngineModule } from '../engine/engine.module';
import { ProgressModule } from '../progress/progress.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, EngineModule, ProgressModule],
  controllers: [LearnController],
  providers: [
    LearningPathService,
    SuggestionService,
    LearnService,
  ],
  exports: [LearnService, LearningPathService, SuggestionService],
})
export class LearnModule {}
