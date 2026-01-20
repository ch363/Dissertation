import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Database
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().optional(),
  DATABASE_POOL_MAX: Joi.number().integer().min(1).optional(),
  DATABASE_POOL_IDLE_TIMEOUT_MS: Joi.number().integer().min(1000).optional(),
  DATABASE_POOL_CONNECTION_TIMEOUT_MS: Joi.number()
    .integer()
    .min(1000)
    .optional(),
  DATABASE_SSL_REJECT_UNAUTHORIZED: Joi.boolean().optional(),

  // Supabase
  SUPABASE_URL: Joi.string().required(),
  SUPABASE_JWT_SECRET: Joi.string().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().optional(),
  SUPABASE_ANON_KEY: Joi.string().optional(),

  // Server
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  CORS_ORIGIN: Joi.string().optional(),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().optional(), // Time window in milliseconds (default: 60000 = 1 minute)
  THROTTLE_LIMIT: Joi.number().optional(), // Max requests per time window for IP-based (default: 100 in prod, 1000 in dev)
  THROTTLE_USER_LIMIT: Joi.number().optional(), // Max requests per time window for user-based (default: same as THROTTLE_LIMIT)

  // Azure Speech (required - pronunciation assessment)
  AZURE_SPEECH_KEY: Joi.string().required(),
  AZURE_SPEECH_REGION: Joi.string().required(),
  AZURE_SPEECH_DEFAULT_LOCALE: Joi.string().optional(),

  // Health
  HEALTH_DB_DEBUG: Joi.boolean().optional(),
}).unknown(true); // Allow unknown keys for test environment
