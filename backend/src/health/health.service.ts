import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async checkDb() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const nodeEnv = this.configService.get<string>(
        'server.nodeEnv',
        'development',
      );
      const dbDebugEnabled =
        nodeEnv !== 'production' ||
        this.configService.get<boolean>('health.dbDebug') === true;

      return {
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        ...(dbDebugEnabled ? { debug: this.prisma.getConnectionDebug() } : {}),
      };
    }
  }
}
