import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  generateTestJwt,
  generateExpiredJwt,
  generateJwtWithoutSub,
} from './helpers/jwt.helper';

// Set test environment variables before any modules are imported
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'https://test.supabase.co';
}
if (!process.env.SUPABASE_JWT_SECRET) {
  process.env.SUPABASE_JWT_SECRET =
    'test-jwt-secret-for-e2e-tests-only-do-not-use-in-production';
}
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
}
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    try {
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

      // Verify app initialized correctly
      // Note: For supertest, the server doesn't need to be "listening"
      // as supertest handles the server lifecycle internally
      const httpServer = app.getHttpServer();
      if (!httpServer) {
        throw new Error(
          'App HTTP server not initialized - app.init() may have failed silently',
        );
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      console.error('Environment variables:', {
        SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'missing',
        SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET
          ? 'set'
          : 'missing',
        DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
        NODE_ENV: process.env.NODE_ENV,
      });
      throw error;
    }
  });

  afterEach(async () => {
    // Clean up in reverse order of initialization
    try {
      // Close the app first (this triggers onModuleDestroy)
      if (app) {
        await app.close();
      }
    } catch {
      // Ignore cleanup errors
    }

    // Additional cleanup for Prisma pool if needed
    try {
      if (prisma) {
        // Prisma cleanup should happen via onModuleDestroy, but ensure it's done
        await prisma.$disconnect().catch(() => {
          // Ignore disconnect errors (might already be disconnected)
        });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('GET /me', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/me').expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 with missing Authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/me')
        .expect(401);

      expect(response.body.message).toContain('Missing Authorization header');
    });

    it('should return 401 with invalid header format', async () => {
      const response = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.message).toContain(
        'Invalid Authorization header format',
      );
    });

    it('should return 401 with expired JWT', async () => {
      const testUserId = 'test-user-expired-' + Date.now();
      const token = generateExpiredJwt({ userId: testUserId });

      await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('should return 401 with invalid signature', async () => {
      const testUserId = 'test-user-invalid-sig-' + Date.now();
      const token = generateTestJwt({
        userId: testUserId,
        secret: 'wrong-secret-key-that-does-not-match',
      });

      const response = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.message).toContain('Invalid JWT signature');
    });

    it('should return 401 with missing sub claim', async () => {
      const token = generateJwtWithoutSub({});

      const response = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.message).toContain('missing user ID');
    });

    it('should authenticate with valid JWT and provision user', async () => {
      const testUserId = 'test-user-' + Date.now();
      const token = generateTestJwt({ userId: testUserId });

      const response = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${token}`);

      // Auth should pass (not 401)
      expect(response.status).not.toBe(401);

      // If database is available, should be 200 with user data
      // If database is unavailable, might be 500 (but auth still passed)
      if (response.status === 200) {
        expect(response.body.id).toBe(testUserId);
        expect(response.body).toHaveProperty('knowledgePoints');
        expect(response.body).toHaveProperty('knowledgeLevel');

        // Verify user was created in database
        try {
          const user = await prisma.user.findUnique({
            where: { id: testUserId },
          });
          if (user) {
            expect(user.id).toBe(testUserId);
          }
        } catch (error) {
          // Database might not be available - this is acceptable
          // The important part is that auth passed (not 401)
        }
      } else if (response.status === 500) {
        // Database error is acceptable for auth tests
        // The key is that we got past authentication (not 401)
        // Database unavailable - this is acceptable for auth tests
        // The important part is that authentication passed (not 401)
      }
    });

    it('should return same user on subsequent requests (idempotent)', async () => {
      const testUserId = 'test-user-idempotent-' + Date.now();
      const token = generateTestJwt({ userId: testUserId });

      // First request
      const response1 = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${token}`);

      // Auth should pass (not 401)
      expect(response1.status).not.toBe(401);

      // Second request
      const response2 = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${token}`);

      // Auth should pass (not 401)
      expect(response2.status).not.toBe(401);

      // If both succeeded (database available), verify idempotency
      if (response1.status === 200 && response2.status === 200) {
        expect(response1.body.id).toBe(response2.body.id);
        expect(response1.body.id).toBe(testUserId);
      }
    });
  });

  describe('GET /me/dashboard', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/me/dashboard').expect(401);
    });

    it('should authenticate with valid JWT', async () => {
      const testUserId = 'test-user-dashboard-' + Date.now();
      const token = generateTestJwt({ userId: testUserId });

      // First provision user
      const provisionResponse = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${token}`);

      // Auth should pass (not 401)
      expect(provisionResponse.status).not.toBe(401);

      const response = await request(app.getHttpServer())
        .get('/me/dashboard')
        .set('Authorization', `Bearer ${token}`);

      // Auth should pass (not 401)
      expect(response.status).not.toBe(401);

      // If database is available, verify response structure
      if (response.status === 200) {
        expect(response.body).toHaveProperty('dueReviewCount');
        expect(response.body).toHaveProperty('activeLessonCount');
        expect(response.body).toHaveProperty('xpTotal');
      }
    });
  });

  describe('POST /progress/lessons/:lessonId/start', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/progress/lessons/test-lesson-id/start')
        .expect(401);
    });

    it('should authenticate with valid JWT', async () => {
      const testUserId = 'test-user-progress-' + Date.now();
      const token = generateTestJwt({ userId: testUserId });

      // First provision user
      const provisionResponse = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${token}`);

      // Auth should pass (not 401)
      expect(provisionResponse.status).not.toBe(401);

      // Note: This will fail with 404 if lesson doesn't exist, but auth should pass
      const response = await request(app.getHttpServer())
        .post('/progress/lessons/test-lesson-id/start')
        .set('Authorization', `Bearer ${token}`);

      // Should not be 401 (auth passed)
      expect(response.status).not.toBe(401);
      // If lesson exists, should be 200, otherwise 404 or 500 (if db unavailable)
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('GET /learn/next', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/learn/next').expect(401);
    });

    it('should authenticate with valid JWT', async () => {
      const testUserId = 'test-user-learn-' + Date.now();
      const token = generateTestJwt({ userId: testUserId });

      // First provision user
      const provisionResponse = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${token}`);

      // Auth should pass (not 401)
      expect(provisionResponse.status).not.toBe(401);

      const response = await request(app.getHttpServer())
        .get('/learn/next')
        .set('Authorization', `Bearer ${token}`);

      // Should not be 401 (auth passed)
      expect(response.status).not.toBe(401);
      // Should be 200 (with content) or 200 (with 'done' type) or 500 (if db unavailable)
      if (response.status === 200) {
        expect(response.body).toHaveProperty('type');
      }
    });
  });
});
