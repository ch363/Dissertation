import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EnhancedThrottlerGuard } from './common/guards/enhanced-throttler.guard';
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
import { SearchModule } from './search/search.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { ContentModule } from './content/content.module';
import { SpeechModule } from './speech/speech.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { envValidationSchema } from './config/env.validation';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? undefined : '.env',
      validationSchema:
        process.env.NODE_ENV === 'test' ? undefined : envValidationSchema,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const throttleConfig = config.get('throttle');
        return [
          {
            ttl: throttleConfig.ttl,
            limit: throttleConfig.limit,
            storage: undefined,
          },
        ];
      },
    }),
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
    SearchModule,
    OnboardingModule,
    ContentModule,
    SpeechModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: EnhancedThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
