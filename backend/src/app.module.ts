import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ModulesModule } from './modules/modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { TeachingsModule } from './teachings/teachings.module';
import { QuestionsModule } from './questions/questions.module';
import { ProgressModule } from './progress/progress.module';
import { LearnModule } from './learn/learn.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ModulesModule,
    LessonsModule,
    TeachingsModule,
    QuestionsModule,
    ProgressModule,
    LearnModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
