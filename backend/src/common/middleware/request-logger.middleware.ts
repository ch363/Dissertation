import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RequestLogger');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    // Generate correlation ID if not present
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    // Log request start
    this.logger.log(
      `[${correlationId}] ${method} ${originalUrl} - ${ip} - ${userAgent}`,
    );

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      if (statusCode >= 400) {
        this.logger.warn(
          `[${correlationId}] ${method} ${originalUrl} ${statusCode} - ${duration}ms`,
        );
      } else {
        this.logger.log(
          `[${correlationId}] ${method} ${originalUrl} ${statusCode} - ${duration}ms`,
        );
      }
    });

    next();
  }
}
