import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { LoggerService } from '../logger';

/**
 * Extended request type that includes authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: unknown;
  };
}

/**
 * BaseGuard
 *
 * Abstract base class for guards providing common functionality.
 * Demonstrates Template Method Pattern and DRY principle.
 *
 * Provides:
 * - Consistent logging
 * - Request extraction helpers
 * - User ID extraction
 * - Access denial logging
 */
export abstract class BaseGuard implements CanActivate {
  protected readonly logger: LoggerService;

  constructor(guardName: string) {
    this.logger = new LoggerService(guardName);
  }

  /**
   * Abstract method to be implemented by subclasses.
   */
  abstract canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean>;

  /**
   * Get the HTTP request from the execution context.
   */
  protected getRequest(context: ExecutionContext): AuthenticatedRequest {
    return context.switchToHttp().getRequest<AuthenticatedRequest>();
  }

  /**
   * Get the authenticated user's ID from the request.
   */
  protected getUserId(context: ExecutionContext): string | undefined {
    return this.getRequest(context).user?.id;
  }

  /**
   * Get the full authenticated user from the request.
   */
  protected getUser(context: ExecutionContext): AuthenticatedRequest['user'] {
    return this.getRequest(context).user;
  }

  /**
   * Get the request path.
   */
  protected getPath(context: ExecutionContext): string {
    return this.getRequest(context).path;
  }

  /**
   * Get the request method.
   */
  protected getMethod(context: ExecutionContext): string {
    return this.getRequest(context).method;
  }

  /**
   * Log access denied with context.
   */
  protected logAccessDenied(reason: string, context: ExecutionContext): void {
    const request = this.getRequest(context);
    this.logger.logWarn(`Access denied: ${reason}`, {
      path: request.path,
      method: request.method,
      userId: this.getUserId(context),
      ip: this.getIpAddress(request),
    });
  }

  /**
   * Log access granted with context.
   */
  protected logAccessGranted(context: ExecutionContext): void {
    this.logger.logDebug('Access granted', {
      path: this.getPath(context),
      method: this.getMethod(context),
      userId: this.getUserId(context),
    });
  }

  /**
   * Get IP address from request, handling proxies.
   */
  protected getIpAddress(request: AuthenticatedRequest): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0].trim();
      return ips;
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return request.ip || request.socket?.remoteAddress || 'unknown';
  }

  /**
   * Check if user is authenticated.
   */
  protected isAuthenticated(context: ExecutionContext): boolean {
    const userId = this.getUserId(context);
    return !!userId && userId.length > 0;
  }
}
