import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionRepository } from './questions.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionsController],
  providers: [
    QuestionRepository,
    {
      provide: 'IQuestionRepository',
      useExisting: QuestionRepository,
    },
    QuestionsService,
  ],
  exports: [QuestionsService],
})
export class QuestionsModule {}
