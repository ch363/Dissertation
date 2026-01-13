import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Progress (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId: string;
  let testLessonId: string;
  let testTeachingId: string;
  let testQuestionId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({
      logger: false,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Setup test data
    // Note: In a real test, you'd use a test database
    testUserId = 'test-user-id';
    testLessonId = 'test-lesson-id';
    testTeachingId = 'test-teaching-id';
    testQuestionId = 'test-question-id';

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /progress/lessons/:lessonId/start', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post(`/progress/lessons/${testLessonId}/start`)
        .expect(401);
    });

    // Note: Full integration test would require:
    // 1. Valid JWT token from Supabase
    // 2. Test database with actual data
    // 3. Cleanup after tests
  });

  describe('POST /progress/questions/:questionId/attempt', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post(`/progress/questions/${testQuestionId}/attempt`)
        .send({
          score: 80,
          timeToComplete: 5000,
        })
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      // Note: Testing validation (400) would require a valid JWT token
      // This test verifies that invalid tokens are rejected before validation
      return request(app.getHttpServer())
        .post(`/progress/questions/${testQuestionId}/attempt`)
        .set('Authorization', 'Bearer test-token')
        .send({
          score: 'invalid', // Should be number
        })
        .expect(401);
    });
  });

  describe('GET /progress/reviews/due', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/progress/reviews/due')
        .expect(401);
    });
  });
});
