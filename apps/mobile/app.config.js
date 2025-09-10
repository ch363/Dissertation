const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

function loadEnv() {
  const here = __dirname;
  const repoRoot = path.resolve(here, '..', '..');
  const candidates = [
    path.join(repoRoot, '.env.local'),
    path.join(repoRoot, '.env'),
    path.join(here, '.env.local'),
    path.join(here, '.env'),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) dotenv.config({ path: file });
  }
}

module.exports = () => {
  loadEnv();
  const appJson = require('./app.json');
  const base = appJson.expo || {};
  return {
    ...base,
    extra: {
      ...(base.extra || {}),
      EXPO_PUBLIC_SUPABASE_URL:
        process.env.EXPO_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        (base.extra && base.extra.EXPO_PUBLIC_SUPABASE_URL) ||
        '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        (base.extra && base.extra.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
        '',
      EXPO_PUBLIC_SUPABASE_REDIRECT_URL:
        process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ||
        (base.extra && base.extra.EXPO_PUBLIC_SUPABASE_REDIRECT_URL) ||
        '',
    },
  };
};
