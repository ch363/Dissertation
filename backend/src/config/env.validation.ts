import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().optional(),
  DATABASE_POOL_MAX: Joi.number().integer().min(1).optional(),
  DATABASE_POOL_IDLE_TIMEOUT_MS: Joi.number().integer().min(1000).optional(),
  DATABASE_POOL_CONNECTION_TIMEOUT_MS: Joi.number()
    .integer()
    .min(1000)
    .optional(),
  DATABASE_SSL_REJECT_UNAUTHORIZED: Joi.boolean().optional(),

  SUPABASE_URL: Joi.string().required(),
  SUPABASE_JWT_SECRET: Joi.string().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().optional(),
  SUPABASE_ANON_KEY: Joi.string().optional(),

  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  CORS_ORIGIN: Joi.string().optional(),

  THROTTLE_TTL: Joi.number().optional(),
  THROTTLE_LIMIT: Joi.number().optional(),
  THROTTLE_USER_LIMIT: Joi.number().optional(),

  AZURE_SPEECH_KEY: Joi.string().required(),
  AZURE_SPEECH_REGION: Joi.string().required(),
  AZURE_SPEECH_DEFAULT_LOCALE: Joi.string().optional(),

  HEALTH_DB_DEBUG: Joi.boolean().optional(),
}).unknown(true);
