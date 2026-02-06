import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { LessonRepository } from './lessons.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [LessonsController],
  providers: [LessonRepository, LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
