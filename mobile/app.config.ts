import dotenv from 'dotenv';
import type { ExpoConfig } from 'expo/config';
import fs from 'fs';
import path from 'path';

// Load environment variables from common locations
const loadEnv = () => {
  const here = __dirname;
  const repoRoot = path.resolve(here, '..', '..');
  const candidates = [
    path.join(repoRoot, '.env.local'),
    path.join(repoRoot, '.env'),
    path.join(here, '.env.local'),
    path.join(here, '.env'),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      dotenv.config({ path: file });
    }
  }
};

loadEnv();

// Merge with existing app.json base
const appJson = require('./app.json');
const base: ExpoConfig = appJson.expo || {};

const config: ExpoConfig = {
  ...base,
  extra: {
    ...(base.extra || {}),
    EXPO_PUBLIC_SUPABASE_URL:
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      base?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
      '',
    EXPO_PUBLIC_SUPABASE_ANON_KEY:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      base?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      '',
    EXPO_PUBLIC_API_URL:
      process.env.EXPO_PUBLIC_API_URL ||
      base?.extra?.EXPO_PUBLIC_API_URL ||
      'http://localhost:3000',
    EXPO_PUBLIC_BACKEND_URL:
      process.env.EXPO_PUBLIC_BACKEND_URL || base?.extra?.EXPO_PUBLIC_BACKEND_URL || undefined,
  },
};

export default config;
