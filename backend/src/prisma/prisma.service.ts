import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool | null = null;
  private readonly connectionString: string;
  private readonly sslRejectUnauthorized: boolean;
  private readonly poolConfig: {
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
  };

  constructor(private configService: ConfigService) {
    const nodeEnv = configService.get<string>('server.nodeEnv', 'development');
    const connectionString = configService.get<string>('database.url') || '';
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not set (required to connect to Postgres).',
      );
    }

    const poolCfg =
      (configService.get<{
        max: number;
        idleTimeoutMillis: number;
        connectionTimeoutMillis: number;
      }>('database.pool') as any) || {};

    const sslRejectUnauthorized =
      configService.get<boolean>('database.sslRejectUnauthorized') ??
      nodeEnv === 'production';

    // Configure SSL for Supabase connections
    // Supabase requires SSL, and we need to allow self-signed certificates in development
    // The Pool SSL config will override any sslmode in the connection string
    const sslConfig = { rejectUnauthorized: sslRejectUnauthorized };

    const pool = new Pool({
      connectionString,
      ssl: sslConfig,
      max: poolCfg.max ?? 20,
      idleTimeoutMillis: poolCfg.idleTimeoutMillis ?? 30000,
      connectionTimeoutMillis: poolCfg.connectionTimeoutMillis ?? 10000,
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;

    this.connectionString = connectionString;
    this.sslRejectUnauthorized = sslRejectUnauthorized;
    this.poolConfig = {
      max: poolCfg.max ?? 20,
      idleTimeoutMillis: poolCfg.idleTimeoutMillis ?? 30000,
      connectionTimeoutMillis: poolCfg.connectionTimeoutMillis ?? 10000,
    };
  }

  async onModuleInit() {
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
    } catch (error) {
      // Allow test environment to start without DB
      if (process.env.NODE_ENV === 'test') {
        this.logger.warn(
          `Database connection failed in test environment: ${error.message}`,
        );
      } else {
        this.logger.error(
          `Database connection failed during startup: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
        throw error;
      }
    }
  }

  /**
   * Safe diagnostics for health checks. Never includes credentials.
   */
  getConnectionDebug() {
    let host: string | undefined;
    let port: number | undefined;
    let database: string | undefined;

    try {
      const url = new URL(this.connectionString);
      host = url.hostname || undefined;
      port = url.port ? parseInt(url.port, 10) : undefined;
      database = url.pathname?.replace(/^\//, '') || undefined;
    } catch {}

    const isSupabasePooler = host?.includes('pooler.supabase.com');
    const hasPgBouncerHint =
      this.connectionString.includes('pgbouncer=true') ||
      this.connectionString.includes('pgbouncer=1');

    return {
      sslRejectUnauthorized: this.sslRejectUnauthorized,
      poolMax: this.poolConfig.max,
      poolIdleTimeoutMillis: this.poolConfig.idleTimeoutMillis,
      poolConnectionTimeoutMillis: this.poolConfig.connectionTimeoutMillis,
      host,
      port,
      database,
      poolTotalCount: this.pool?.totalCount ?? 0,
      poolIdleCount: this.pool?.idleCount ?? 0,
      poolWaitingCount: this.pool?.waitingCount ?? 0,
      warnings: [
        ...(isSupabasePooler && !hasPgBouncerHint
          ? [
              'DATABASE_URL appears to use Supabase pooler. Consider adding `?pgbouncer=true` to avoid prepared-statement issues with transaction pooling.',
            ]
          : []),
      ],
    };
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error) {}

    if (this.pool) {
      try {
        await this.pool.end();
      } catch (error) {}
      this.pool = null;
    }
  }
}
