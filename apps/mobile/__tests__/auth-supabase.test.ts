import { signInWithEmail, signUpWithEmail } from '@/features/auth/api';

jest.mock('@/app/api/auth', () => ({
  signInWithEmailPassword: jest.fn(),
  signUpWithEmailPassword: jest.fn(),
  sendPasswordReset: jest.fn(),
  signOut: jest.fn(),
  updatePassword: jest.fn(),
}));

jest.mock('@/app/api/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock('@/services/env/supabaseConfig', () => ({
  getSupabaseRedirectUrl: jest.fn(() => 'fluentia://sign-in'),
}));

const authApi = require('@/app/api/auth');
const { getSupabaseClient } = require('@/app/api/supabase/client');
const { getSupabaseRedirectUrl } = require('@/services/env/supabaseConfig');

describe('auth facade (Supabase)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signInWithEmail returns user from underlying auth call', async () => {
    (authApi.signInWithEmailPassword as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });

    const user = await signInWithEmail('a@example.com', 'secret');

    expect(authApi.signInWithEmailPassword).toHaveBeenCalledWith('a@example.com', 'secret');
    expect(user).toEqual({ id: 'u1' });
  });

  it('signInWithEmail returns null when no user returned', async () => {
    (authApi.signInWithEmailPassword as jest.Mock).mockResolvedValue({ user: null });

    const user = await signInWithEmail('a@example.com', 'secret');

    expect(user).toBeNull();
  });

  it('signUpWithEmail passes redirect URL and returns user/session', async () => {
    const signUpMock = jest.fn().mockResolvedValue({
      data: { user: { id: 'u1' }, session: { access_token: 't' } },
      error: null,
    });
    (getSupabaseClient as jest.Mock).mockReturnValue({ auth: { signUp: signUpMock } });
    (getSupabaseRedirectUrl as jest.Mock).mockReturnValue('fluentia://sign-in');

    const result = await signUpWithEmail('Jane', 'jane@example.com', 'secret123');

    expect(signUpMock).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'secret123',
      options: {
        data: { name: 'Jane' },
        emailRedirectTo: 'fluentia://sign-in',
      },
    });
    expect(result).toEqual({ user: { id: 'u1' }, session: { access_token: 't' } });
  });

  it('signUpWithEmail throws when supabase returns error', async () => {
    const err = new Error('signup failed');
    const signUpMock = jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: err,
    });
    (getSupabaseClient as jest.Mock).mockReturnValue({ auth: { signUp: signUpMock } });

    await expect(signUpWithEmail(null, 'jane@example.com', 'secret123')).rejects.toThrow(err);
  });
});

