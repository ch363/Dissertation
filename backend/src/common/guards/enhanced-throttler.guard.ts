import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

// Rate limiting: tracks by IP (public) and IP+user (authenticated)
// Prevents bypassing limits via IP switching or multiple accounts
@Injectable()
export class EnhancedThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const ip = this.getIpAddress(req);
    const userId = (req as any).user?.id;

    // Authenticated: track by both IP and user to prevent abuse
    if (userId) {
      return `user:${userId}:ip:${ip}`;
    }

    return `ip:${ip}`;
  }

  // In production behind reverse proxy, ensure proxy strips client X-Forwarded-For to prevent spoofing
  private getIpAddress(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0].trim();
      return ips;
    }

    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return req.ip || req.socket?.remoteAddress || 'unknown';
  }

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
    const { limit, ttl, timeToExpire } = throttlerLimitDetail;
    const retryAfter = Math.ceil(timeToExpire / 1000);

    response.setHeader('Retry-After', retryAfter);
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', 0);
    response.setHeader(
      'X-RateLimit-Reset',
      new Date(Date.now() + timeToExpire).toISOString(),
    );

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
