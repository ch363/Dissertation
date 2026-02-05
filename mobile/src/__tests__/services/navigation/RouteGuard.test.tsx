import React from 'react';

import { RouteGuard } from '@/services/navigation/RouteGuard';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
  useSegments: () => [],
  usePathname: () => '/',
}));

jest.mock('@/services/auth/AuthProvider', () => ({
  useAuth: () => ({
    session: null,
    loading: false,
  }),
}));

describe('RouteGuard', () => {
  it('should export RouteGuard component', () => {
    expect(RouteGuard).toBeDefined();
    expect(typeof RouteGuard).toBe('function');
  });
});
