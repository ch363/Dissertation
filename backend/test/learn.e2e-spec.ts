import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Learn (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /learn/next', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/learn/next')
        .query({ lessonId: 'test-lesson-id' })
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      // Note: Testing validation (400) would require a valid JWT token
      // This test verifies that invalid tokens are rejected
      return request(app.getHttpServer())
        .get('/learn/next')
        .set('Authorization', 'Bearer test-token')
        .expect(401);
    });
  });

  describe('GET /learn/suggestions', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/learn/suggestions')
        .expect(401);
    });

    // Note: Full integration test would require:
    // 1. Valid JWT token
    // 2. Test database with modules, lessons, teachings
    // 3. User progress data
    // 4. Verification of suggestion algorithm
  });
});
