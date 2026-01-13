import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, query, params } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip || request.connection.remoteAddress;
    const startTime = Date.now();

    // Log request
    this.logger.log(
      `${method} ${url} - ${ip} - ${userAgent}`,
    );

    // Log request body (excluding sensitive data)
    if (Object.keys(body || {}).length > 0) {
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.debug(`Request body: ${JSON.stringify(sanitizedBody)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          
          this.logger.log(
            `${method} ${url} ${statusCode} - ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          
          this.logger.error(
            `${method} ${url} ${statusCode} - ${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
