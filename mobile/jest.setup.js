// Mock AsyncStorage with official mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
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

// Mock vector icons to avoid native module load in tests
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock Supabase client to avoid network/native usage in tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: 'u1', user_metadata: {} } }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      resend: jest.fn().mockResolvedValue({ error: null }),
      exchangeCodeForSession: jest
        .fn()
        .mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null }),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

// Mock expo-av to avoid native module issues
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    Recording: {
      createAsync: jest.fn(() => Promise.resolve({
        recording: {
          stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
          getURI: jest.fn(() => 'mock-recording-uri'),
        },
      })),
    },
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({
        sound: {
          playAsync: jest.fn(() => Promise.resolve()),
          unloadAsync: jest.fn(() => Promise.resolve()),
          setOnPlaybackStatusUpdate: jest.fn(),
        },
      })),
    },
    AndroidOutputFormat: {
      DEFAULT: 0,
      THREE_GPP: 1,
      MPEG_4: 2,
      AMR_NB: 3,
      AMR_WB: 4,
      AAC_ADTS: 6,
      WEBM: 9,
    },
    AndroidAudioEncoder: {
      DEFAULT: 0,
      AMR_NB: 1,
      AMR_WB: 2,
      AAC: 3,
      HE_AAC: 4,
      AAC_ELD: 5,
    },
    IOSOutputFormat: {
      LINEARPCM: 'lpcm',
      AC3: 'ac-3',
      MPEGLAYER1: '.mp1',
      MPEGLAYER2: '.mp2',
      MPEGLAYER3: '.mp3',
      MPEG4AAC: 'aac ',
    },
    IOSAudioQuality: {
      MIN: 0,
      LOW: 32,
      MEDIUM: 64,
      HIGH: 96,
      MAX: 127,
    },
  },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Silence React Native warn noise in tests
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: (objs: Record<string, unknown>) => objs.ios,
  isPad: false,
  isTV: false,
}));
