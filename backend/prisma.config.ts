import { defineConfig, env } from 'prisma/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Manually load .env file if environment variables aren't set
if (!process.env.DATABASE_URL) {
  try {
    const envPath = resolve(__dirname, '.env');
    const envFile = readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    // If .env file doesn't exist or can't be read, env() will throw a helpful error
  }
}

// For migrations, prefer DIRECT_URL if available, otherwise use DATABASE_URL
const datasourceConfig: { url: string; directUrl?: string } = {
  // Use DIRECT_URL for migrations if available, otherwise fall back to DATABASE_URL
  url: process.env.DIRECT_URL ? env('DIRECT_URL') : env('DATABASE_URL'),
};

// Set directUrl if DIRECT_URL is provided and different from url
if (process.env.DIRECT_URL && process.env.DIRECT_URL !== process.env.DATABASE_URL) {
  datasourceConfig.directUrl = env('DIRECT_URL');
}

export default defineConfig({
  datasource: datasourceConfig,
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'node prisma/seed.js',
  },
});
