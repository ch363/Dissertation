import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from './base-exception.filter';

interface ExceptionResponseObject {
  message?: string;
  error?: string;
}

@Catch(HttpException)
export class HttpExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  protected readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as ExceptionResponseObject).message ||
          exception.message;

    const error =
      typeof exceptionResponse === 'object' &&
      (exceptionResponse as ExceptionResponseObject).error
        ? (exceptionResponse as ExceptionResponseObject).error
        : HttpStatus[status] || 'Error';

    this.handleException(
      host,
      status,
      message,
      error || 'Error',
      exception.stack,
    );
  }
}
