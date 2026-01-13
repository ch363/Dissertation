import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
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
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
