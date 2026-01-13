import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool | null = null;

  constructor(private configService: ConfigService) {
    // Extract config values before calling super()
    const nodeEnv = configService.get<string>('server.nodeEnv', 'development');
    const connectionString = configService.get<string>('database.url') || '';
    
    // Configure SSL for Supabase connections
    // Supabase requires SSL, and we need to allow self-signed certificates in development
    // The Pool SSL config will override any sslmode in the connection string
    const sslConfig = nodeEnv === 'production' 
      ? { rejectUnauthorized: true } // Strict SSL in production
      : { rejectUnauthorized: false }; // Allow self-signed certs in development (for Supabase)
    
    const pool = new Pool({
      connectionString,
      // Force SSL configuration - this overrides sslmode in connection string
      ssl: sslConfig,
      // Additional connection options
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    // Connect to the database when the module initializes
    await this.$connect();
  }

  async onModuleDestroy() {
    // Disconnect from the database when the module is destroyed
    await this.$disconnect();
    if (this.pool) {
      await this.pool.end();
    }
  }
}
