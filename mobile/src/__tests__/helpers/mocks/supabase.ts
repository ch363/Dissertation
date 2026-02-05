/**
 * Shared Supabase client mocks for tests
 */

/**
 * Mock Supabase client
 */
export const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(() =>
      Promise.resolve({
        data: { session: null },
        error: null,
      }),
    ),
    getUser: jest.fn(() =>
      Promise.resolve({
        data: { user: null },
        error: null,
      }),
    ),
    signInWithPassword: jest.fn(() =>
      Promise.resolve({
        data: { session: null, user: null },
        error: null,
      }),
    ),
    signUp: jest.fn(() =>
      Promise.resolve({
        data: { session: null, user: null },
        error: null,
      }),
    ),
    signOut: jest.fn(() =>
      Promise.resolve({
        error: null,
      }),
    ),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
  })),
};

/**
 * Mock getSupabaseClient function
 */
export const mockGetSupabaseClient = jest.fn(() => mockSupabaseClient);

/**
 * Setup Supabase mocks
 * Usage:
 * ```ts
 * setupSupabaseMocks();
 * ```
 */
export function setupSupabaseMocks() {
  jest.mock('@/services/supabase/client', () => ({
    getSupabaseClient: mockGetSupabaseClient,
  }));
}
