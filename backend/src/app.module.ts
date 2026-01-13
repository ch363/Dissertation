import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MeModule } from './me/me.module';
import { ModulesModule } from './modules/modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { TeachingsModule } from './teachings/teachings.module';
import { QuestionsModule } from './questions/questions.module';
import { ProgressModule } from './progress/progress.module';
import { LearnModule } from './learn/learn.module';
import { HealthModule } from './health/health.module';
import { EngineModule } from './engine/engine.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { envValidationSchema } from './config/env.validation';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    MeModule,
    ModulesModule,
    LessonsModule,
    TeachingsModule,
    QuestionsModule,
    ProgressModule,
    LearnModule,
    HealthModule,
    EngineModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes('*');
  }
}
