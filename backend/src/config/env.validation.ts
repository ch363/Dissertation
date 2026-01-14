import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Database
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().optional(),

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
  THROTTLE_LIMIT: Joi.number().optional(), // Max requests per time window (default: 100 in prod, 1000 in dev)
}).unknown(true); // Allow unknown keys for test environment
