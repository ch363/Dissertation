import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';
import { Logger as NestLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends NestLogger implements NestLoggerService {
  setContext(context: string) {
    this.context = context;
  }

  logInfo(message: string, metadata?: Record<string, unknown>) {
    if (metadata) {
      super.log(`${message} ${JSON.stringify(metadata)}`, this.context);
    } else {
      super.log(message, this.context);
    }
  }

  logWarn(message: string, metadata?: Record<string, unknown>) {
    if (metadata) {
      super.warn(`${message} ${JSON.stringify(metadata)}`, this.context);
    } else {
      super.warn(message, this.context);
    }
  }

  logError(
    message: string,
    error?: Error | unknown,
    metadata?: Record<string, unknown>,
  ) {
    const stack = error instanceof Error ? error.stack : undefined;
    const errorMessage = error instanceof Error ? error.message : String(error);

    const fullMetadata = {
      ...metadata,
      error: errorMessage,
    };

    if (stack) {
      super.error(
        `${message} ${JSON.stringify(fullMetadata)}`,
        stack,
        this.context,
      );
    } else {
      super.error(`${message} ${JSON.stringify(fullMetadata)}`, this.context);
    }
  }

  logDebug(message: string, metadata?: Record<string, unknown>) {
    if (metadata) {
      super.debug(`${message} ${JSON.stringify(metadata)}`, this.context);
    } else {
      super.debug(message, this.context);
    }
  }

  logVerbose(message: string, metadata?: Record<string, unknown>) {
    if (metadata) {
      super.verbose(`${message} ${JSON.stringify(metadata)}`, this.context);
    } else {
      super.verbose(message, this.context);
    }
  }
}
