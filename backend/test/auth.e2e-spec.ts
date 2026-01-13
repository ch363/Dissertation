import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
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

  describe('GET /me', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/me')
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    // Note: Full integration test with real Supabase token would require
    // setting up test Supabase instance or mocking JWT verification
    // This is a placeholder structure
  });
});
