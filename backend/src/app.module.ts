import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { envValidationSchema } from './config/env.validation';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? undefined : '.env', // Skip .env file in tests
      validationSchema: process.env.NODE_ENV === 'test' ? undefined : envValidationSchema, // Skip validation in tests
      load: [configuration],
    }),
    // Rate Limiting Configuration
    // ThrottlerGuard is applied globally via APP_GUARD below
    // Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) are automatically added
    // Default: 100 requests/minute in production, 1000 requests/minute in development
    // Configure via THROTTLE_TTL and THROTTLE_LIMIT environment variables
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const throttleConfig = config.get('throttle');
        return [
          {
            ttl: throttleConfig.ttl, // Time window in milliseconds (default: 60000 = 1 minute)
            limit: throttleConfig.limit, // Max requests per time window (default: 100 prod, 1000 dev)
            // Use in-memory storage (default) - can be configured to use Redis for distributed systems
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      // Apply EnhancedThrottlerGuard globally to all routes
      // This guard provides both IP-based and user-based rate limiting
      // - Public endpoints: Rate limited by IP address (THROTTLE_LIMIT)
      // - Authenticated endpoints: Rate limited by both IP and user ID (THROTTLE_USER_LIMIT or THROTTLE_LIMIT)
      // Use @SkipThrottle() decorator on controllers/routes to exclude specific endpoints
      // Health endpoints are excluded (see health.controller.ts)
      // Note: ConfigService is injected automatically since ConfigModule is global
      provide: APP_GUARD,
      useClass: EnhancedThrottlerGuard,
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
