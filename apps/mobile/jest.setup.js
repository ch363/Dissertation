// Mock AsyncStorage with official mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Minimal Expo Constants mock to satisfy supabase config resolution
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'test_anon_key',
    },
  },
}));

// Mock Supabase client to avoid network/native usage in tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'u1', user_metadata: {} } }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      resend: jest.fn().mockResolvedValue({ error: null }),
      exchangeCodeForSession: jest.fn().mockResolvedValue({}),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

// Silence React Native warn noise in tests
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: (objs) => objs.ios,
}));
