import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionRepository } from './questions.repository';
import { QuestionVariantRepository } from './repositories';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionsController],
  providers: [
    QuestionRepository,
    QuestionVariantRepository,
    QuestionsService,
  ],
  exports: [
    QuestionsService,
    QuestionRepository,
    QuestionVariantRepository,
  ],
})
export class QuestionsModule {}
