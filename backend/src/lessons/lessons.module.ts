import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { LessonRepository } from './lessons.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LessonsController],
  providers: [
    LessonRepository,
    {
      provide: 'ILessonRepository',
      useExisting: LessonRepository,
    },
    LessonsService,
  ],
  exports: [LessonsService],
})
export class LessonsModule {}
