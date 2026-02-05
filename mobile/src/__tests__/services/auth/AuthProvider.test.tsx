import React from 'react';

import { AuthProvider, useAuth } from '@/services/auth/AuthProvider';

// Mock dependencies
jest.mock('@/services/supabase/client', () => ({
  getSupabaseClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  })),
}));

jest.mock('@/services/api/profile', () => ({
  getMyProfile: jest.fn(() => Promise.resolve({ id: 'user-1', name: 'Test User' })),
}));

describe('AuthProvider', () => {
  it('should export AuthProvider component', () => {
    expect(AuthProvider).toBeDefined();
    expect(typeof AuthProvider).toBe('function');
  });

  it('should export useAuth hook', () => {
    expect(typeof useAuth).toBe('function');
  });
});
