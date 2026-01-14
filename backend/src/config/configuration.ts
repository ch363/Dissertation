export default () => ({
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
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
    limit: process.env.THROTTLE_LIMIT
      ? parseInt(process.env.THROTTLE_LIMIT, 10)
      : process.env.NODE_ENV === 'production'
        ? 100
        : 1000, // 100 req/min in prod, 1000 in dev
  },
});
