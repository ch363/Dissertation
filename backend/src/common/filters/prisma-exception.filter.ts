import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database operation failed';

    // Map Prisma error codes to HTTP status codes and messages
    switch (exception.code) {
      case 'P2002':
        // Unique constraint violation
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[]) || [];
        message = `A record with this ${target.join(', ')} already exists`;
        break;

      case 'P2025':
        // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;

      case 'P2003':
        // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference to related record';
        break;

      case 'P2014':
        // Required relation violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Required relation is missing';
        break;

      case 'P2000':
        // Value too long
        status = HttpStatus.BAD_REQUEST;
        message = 'The provided value is too long';
        break;

      case 'P2001':
        // Record does not exist
        status = HttpStatus.NOT_FOUND;
        message = 'The record searched for does not exist';
        break;

      default:
        this.logger.error(
          `Unhandled Prisma error: ${exception.code}`,
          exception.stack,
        );
        message = `Database error: ${exception.message}`;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error: 'Database Error',
      code: exception.code,
    };

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message} (Prisma ${exception.code})`,
    );

    response.status(status).json(errorResponse);
  }
}
