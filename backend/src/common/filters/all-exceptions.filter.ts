import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from './base-exception.filter';
import { getErrorMessage, getErrorStack } from '../utils/error.util';

interface ErrorWithStatus extends Error {
  status?: number;
}

@Catch()
export class AllExceptionsFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  protected readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const status =
      exception instanceof Error && 'status' in exception
        ? ((exception as ErrorWithStatus).status ??
          HttpStatus.INTERNAL_SERVER_ERROR)
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = getErrorMessage(exception) || 'Internal server error';

    this.handleException(
      host,
      status,
      message,
      'Internal Server Error',
      getErrorStack(exception),
    );
  }
}
