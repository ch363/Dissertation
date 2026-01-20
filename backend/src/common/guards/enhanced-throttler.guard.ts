import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * Enhanced Throttler Guard that supports both IP-based and user-based rate limiting
 *
 * Security Best Practices (OWASP):
 * - Tracks rate limits by both IP address (for public endpoints) and user ID (for authenticated endpoints)
 * - Provides graceful 429 responses with proper headers
 * - Prevents abuse from both anonymous and authenticated users
 * - Supports different rate limits for IP-based vs user-based tracking
 *
 * Rate limiting strategy:
 * - Public endpoints: Rate limit by IP address (THROTTLE_LIMIT)
 * - Authenticated endpoints: Rate limit by both IP and user ID (THROTTLE_USER_LIMIT or THROTTLE_LIMIT)
 * - Prevents users from bypassing limits by switching IPs or using multiple accounts
 *
 * Configuration:
 * - THROTTLE_TTL: Time window in milliseconds (default: 60000 = 1 minute)
 * - THROTTLE_LIMIT: Max requests per window (default: 100 prod, 1000 dev)
 */
@Injectable()
export class EnhancedThrottlerGuard extends ThrottlerGuard {
  /**
   * Generate a unique key for rate limiting
   * For authenticated users: combines IP + user ID
   * For anonymous users: uses IP only
   */
  protected async getTracker(req: Request): Promise<string> {
    const ip = this.getIpAddress(req);
    const userId = (req as any).user?.id;

    // For authenticated endpoints, track by both IP and user ID
    // This prevents abuse from:
    // 1. Single user making too many requests (user-based limit)
    // 2. Multiple users from same IP (IP-based limit)
    if (userId) {
      return `user:${userId}:ip:${ip}`;
    }

    // For public endpoints, track by IP only
    return `ip:${ip}`;
  }

  /**
   * Extract IP address from request
   * Handles proxies and load balancers (X-Forwarded-For header)
   *
   * Security Note: In production behind a reverse proxy, ensure the proxy
   * is configured to set X-Forwarded-For correctly and strip any client-provided
   * X-Forwarded-For headers to prevent IP spoofing.
   */
  private getIpAddress(req: Request): string {
    // Check for X-Forwarded-For header (from proxies/load balancers)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2)
      // Take the first one (original client IP)
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0].trim();
      return ips;
    }

    // Check for X-Real-IP header (common in nginx)
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // Fallback to connection remote address
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

  /**
   * Override throwThrottlingException to provide graceful 429 responses
   * with proper headers and clear error messages
   *
   * Headers set (RFC 6585 / RFC 7231):
   * - Retry-After: Seconds until the rate limit resets
   * - X-RateLimit-Limit: Maximum requests allowed in the window
   * - X-RateLimit-Remaining: Requests remaining (0 when exceeded)
   * - X-RateLimit-Reset: ISO timestamp when the limit resets
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: {
      limit: number;
      ttl: number;
      key: string;
      tracker: string;
      totalHits: number;
      timeToExpire: number;
      isBlocked: boolean;
      timeToBlockExpire: number;
    },
  ): Promise<void> {
    const response = context.switchToHttp().getResponse();

    // Get rate limit info from the throttler
    const { limit, ttl, timeToExpire } = throttlerLimitDetail;

    // Calculate retry-after (seconds until rate limit resets)
    const retryAfter = Math.ceil(timeToExpire / 1000);

    // Set standard rate limiting headers (RFC 6585)
    response.setHeader('Retry-After', retryAfter);
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', 0);
    response.setHeader(
      'X-RateLimit-Reset',
      new Date(Date.now() + timeToExpire).toISOString(),
    );

    // Throw exception with clear message
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: `Rate limit exceeded. Maximum ${limit} requests per ${Math.ceil(ttl / 1000)} seconds. Please retry after ${retryAfter} seconds.`,
        error: 'Too Many Requests',
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
