import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../../src/auth/supabase-auth.strategy';

export interface TestJwtOptions {
  userId: string;
  email?: string;
  expiresIn?: string | number;
  secret?: string; // Defaults to test JWT secret from env
}

/**
 * Generate a valid test JWT token for integration tests.
 * Uses the same secret as the application to ensure real JWT verification.
 */
export function generateTestJwt(options: TestJwtOptions): string {
  const payload: JwtPayload = {
    sub: options.userId,
    email: options.email,
    iat: Math.floor(Date.now() / 1000),
  };

  const secret = options.secret || process.env.TEST_JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret required for test token generation. Set TEST_JWT_SECRET or SUPABASE_JWT_SECRET');
  }

  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: options.expiresIn || '1h',
  });
}

/**
 * Generate an expired test JWT token for testing expiration handling.
 */
export function generateExpiredJwt(options: Omit<TestJwtOptions, 'expiresIn'>): string {
  const payload: JwtPayload = {
    sub: options.userId,
    email: options.email,
    iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    exp: Math.floor(Date.now() / 1000) - 1800, // Expired 30 min ago
  };

  const secret = options.secret || process.env.TEST_JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret required for test token generation. Set TEST_JWT_SECRET or SUPABASE_JWT_SECRET');
  }

  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    noTimestamp: true, // Use explicit exp
  });
}

/**
 * Generate a JWT token with missing 'sub' claim for testing validation.
 */
export function generateJwtWithoutSub(options: Omit<TestJwtOptions, 'userId'>): string {
  const payload: any = {
    email: options.email,
    iat: Math.floor(Date.now() / 1000),
  };

  const secret = options.secret || process.env.TEST_JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret required for test token generation. Set TEST_JWT_SECRET or SUPABASE_JWT_SECRET');
  }

  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: options.expiresIn || '1h',
  });
}

// TODO: If migrating to JWKS (RS256), update generateTestJwt to:
// 1. Generate RSA key pair for tests
// 2. Serve public key via mock JWKS endpoint
// 3. Sign tokens with private key
// 4. Configure strategy to fetch from JWKS endpoint
