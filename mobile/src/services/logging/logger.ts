export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogMetadata {
  [key: string]: unknown;
}

class Logger {
  private context: string;
  private minLevel: LogLevel;

  constructor(context: string = 'App') {
    this.context = context;
    this.minLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  private sanitizeMetadata(metadata?: LogMetadata): LogMetadata | undefined {
    if (!metadata) return undefined;

    const sanitized: LogMetadata = {};
    const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken', 'secret', 'apiKey'];

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((sk) => lowerKey.includes(sk));

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (value instanceof Error) {
        sanitized[key] = {
          message: value.message,
          stack: __DEV__ ? value.stack : undefined,
        };
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const sanitized = this.sanitizeMetadata(metadata);
    const metaStr = sanitized ? ` ${JSON.stringify(sanitized)}` : '';
    return `[${timestamp}] [${level}] [${this.context}] ${message}${metaStr}`;
  }

  debug(message: string, metadata?: LogMetadata) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const formatted = this.formatMessage(LogLevel.DEBUG, message, metadata);
    console.debug(formatted);
  }

  info(message: string, metadata?: LogMetadata) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const formatted = this.formatMessage(LogLevel.INFO, message, metadata);
    console.log(formatted);
  }

  warn(message: string, metadata?: LogMetadata) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const formatted = this.formatMessage(LogLevel.WARN, message, metadata);
    console.warn(formatted);
  }

  error(message: string, error?: Error | unknown, metadata?: LogMetadata) {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const enrichedMetadata = { ...metadata };
    if (error) {
      if (error instanceof Error) {
        enrichedMetadata.error = {
          message: error.message,
          stack: __DEV__ ? error.stack : undefined,
          name: error.name,
        };
      } else {
        enrichedMetadata.error = String(error);
      }
    }

    const formatted = this.formatMessage(LogLevel.ERROR, message, enrichedMetadata);
    console.error(formatted);
  }

  child(additionalContext: string): Logger {
    return new Logger(`${this.context}:${additionalContext}`);
  }

  setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}

export const logger = new Logger('App');
