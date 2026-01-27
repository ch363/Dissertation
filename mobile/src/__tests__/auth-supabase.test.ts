import { signInWithEmailPassword, signUpWithEmail } from '@/services/api/auth';

jest.mock('@/services/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock('@/services/env/supabaseConfig', () => ({
  getSupabaseRedirectUrl: jest.fn(() => 'fluentia://sign-in'),
}));

const { getSupabaseClient } = require('@/services/supabase/client');
const { getSupabaseRedirectUrl } = require('@/services/env/supabaseConfig');

describe('auth facade (Supabase)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signInWithEmailPassword returns session from underlying auth call', async () => {
    const signInMock = jest.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null });
    (getSupabaseClient as jest.Mock).mockReturnValue({ auth: { signInWithPassword: signInMock } });

    const result = await signInWithEmailPassword('a@example.com', 'secret');

    expect(signInMock).toHaveBeenCalledWith({ email: 'a@example.com', password: 'secret' });
    expect(result.session?.user.id).toBe('u1');
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
