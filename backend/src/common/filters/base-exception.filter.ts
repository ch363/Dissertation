import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { buildErrorResponse } from '../utils/error-response.util';

/**
 * Base class for exception filters providing common functionality
 * for HTTP context extraction, error response building, and logging
 */
export abstract class BaseExceptionFilter {
  protected abstract readonly logger: Logger;

  /**
   * Extract HTTP context from ArgumentsHost
   */
  protected getHttpContext(host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    return {
      response: ctx.getResponse<Response>(),
      request: ctx.getRequest<Request>(),
    };
  }

  /**
   * Build and send error response
   */
  protected sendErrorResponse(
    response: Response,
    request: Request,
    status: number,
    message: string,
    error: string,
    code?: string,
  ) {
    const errorResponse = buildErrorResponse(
      request,
      status,
      message,
      error,
      code,
    );

    response.status(status).json(errorResponse);
  }

  /**
   * Log error with consistent formatting
   */
  protected logError(
    request: Request,
    status: number,
    message: string,
    stack?: string,
    code?: string,
  ) {
    const codeInfo = code ? ` (${code})` : '';
    const logMessage = `${request.method} ${request.url} - ${status} - ${message}${codeInfo}`;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(logMessage, stack);
    } else if (status >= HttpStatus.BAD_REQUEST) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }
  }

  /**
   * Handle exception with common pattern
   */
  protected handleException(
    host: ArgumentsHost,
    status: number,
    message: string,
    error: string,
    stack?: string,
    code?: string,
  ) {
    const { response, request } = this.getHttpContext(host);

    this.logError(request, status, message, stack, code);
    this.sendErrorResponse(response, request, status, message, error, code);
  }
}
