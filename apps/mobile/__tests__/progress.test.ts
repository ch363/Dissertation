import {
  getCompletedModules,
  markModuleCompleted,
  resetProgress,
  type ProgressSummary,
  getProgressSummary,
} from '@/lib/progress';

const mockUpsert = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockMaybeSingle = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: (...args: any[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: any[]) => {
            mockEq(...eqArgs);
            return {
              maybeSingle: mockMaybeSingle,
            };
          },
        };
      },
      upsert: (...upsertArgs: any[]) => {
        mockUpsert(...upsertArgs);
        return {
          select: () => ({
            single: mockSingle,
          }),
        };
      },
    }),
  }),
}));

describe('progress repo', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await resetProgress(null);
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it('returns local cache when no remote', async () => {
    await markModuleCompleted('basics', null);
    const completed = await getCompletedModules(null);
    expect(completed).toEqual(['basics']);
  });

  it('merges remote over empty cache', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { completed: ['remote'], updated_at: '2099-01-01T00:00:00Z', version: 1 },
      error: null,
    });
    const completed = await getCompletedModules('u1');
    expect(completed).toEqual(['remote']);
  });

  it('pushes local when it wins merge', async () => {
    await markModuleCompleted('local', null);
    mockMaybeSingle.mockResolvedValue({
      data: { completed: [], updated_at: '2020-01-01T00:00:00Z', version: 0 },
      error: null,
    });
    await getCompletedModules('u1');
    expect(mockUpsert).toHaveBeenCalled();
  });

  it('summarizes progress', async () => {
    await markModuleCompleted('foo', null);
    const summary: ProgressSummary = await getProgressSummary('u1');
    expect(summary.xp).toBeGreaterThan(0);
    expect(summary.streak).toBeGreaterThanOrEqual(0);
  });
});
