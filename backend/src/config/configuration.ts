export default () => ({
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
    // Pool tuning (pg.Pool)
    pool: {
      max: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),
      idleTimeoutMillis: parseInt(
        process.env.DATABASE_POOL_IDLE_TIMEOUT_MS || '30000',
        10,
      ),
      // Supabase pooler connections can occasionally take a few seconds; 2s is often too aggressive.
      connectionTimeoutMillis: parseInt(
        process.env.DATABASE_POOL_CONNECTION_TIMEOUT_MS || '10000',
        10,
      ),
    },
    // SSL configuration for Postgres connections.
    // In dev we allow rejecting to be disabled (some local DBs / proxies), but Supabase is fine with true.
    sslRejectUnauthorized:
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== undefined
        ? process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true'
        : process.env.NODE_ENV === 'production',
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN,
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10), // Default: 1 minute
    // Rate limit for public endpoints (IP-based)
    limit: process.env.THROTTLE_LIMIT
      ? parseInt(process.env.THROTTLE_LIMIT, 10)
      : process.env.NODE_ENV === 'production'
        ? 100
        : 1000, // 100 req/min in prod, 1000 in dev
    // Rate limit for authenticated endpoints (user-based, typically stricter)
    // If not set, uses same limit as IP-based
    userLimit: process.env.THROTTLE_USER_LIMIT
      ? parseInt(process.env.THROTTLE_USER_LIMIT, 10)
      : undefined, // Will use same as limit if not specified
  },
  sessionPlanCache: {
    ttlMs: parseInt(process.env.SESSION_PLAN_CACHE_TTL_MS || '300000', 10), // Default: 5 minutes (300000 ms)
  },
  speech: {
    azureKey: process.env.AZURE_SPEECH_KEY,
    azureRegion: process.env.AZURE_SPEECH_REGION,
    defaultLocale: process.env.AZURE_SPEECH_DEFAULT_LOCALE || 'it-IT',
  },
  health: {
    // When enabled (or in non-production), /health/db includes sanitized DB diagnostics (no credentials).
    dbDebug: process.env.HEALTH_DB_DEBUG === 'true',
  },
});
