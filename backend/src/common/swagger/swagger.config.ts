import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, Logger } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const logger = new Logger('Swagger');
  const isProduction = process.env.NODE_ENV === 'production';
  const enableSwagger = process.env.ENABLE_SWAGGER === 'true';

  if (isProduction && !enableSwagger) {
    logger.log(
      'Swagger documentation disabled in production (set ENABLE_SWAGGER=true to enable)',
    );
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Fluentia API')
    .setDescription('Language learning platform API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('health', 'Health check endpoints')
    .addTag('me', 'User profile and preferences')
    .addTag('modules', 'Learning modules management')
    .addTag('lessons', 'Lessons management')
    .addTag('teachings', 'Teachings management')
    .addTag('questions', 'Questions management')
    .addTag('progress', 'User progress tracking')
    .addTag('learn', 'Learning orchestration')
    .addTag('search', 'Search and discovery')
    .addTag('onboarding', 'User onboarding')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: false,
    },
  });

  logger.log('Swagger documentation available at /api/docs');
}
