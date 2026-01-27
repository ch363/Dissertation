import { getProgressSummary, markModuleCompleted } from '@/services/api/progress';

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('@/services/api/client', () => ({
  apiClient: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
  },
}));

describe('progress api client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches progress summary', async () => {
    mockGet.mockResolvedValue({
      xp: 100,
      streak: 2,
      completedLessons: 1,
      completedModules: 0,
      totalLessons: 10,
      totalModules: 2,
      dueReviewCount: 3,
    });

    const summary = await getProgressSummary('u1');
    expect(summary.xp).toBe(100);
    expect(mockGet).toHaveBeenCalled();
  });

  it('marks module completed via backend endpoint', async () => {
    mockPost.mockResolvedValue(null);
    await markModuleCompleted('basics');
    expect(mockPost).toHaveBeenCalledWith('/progress/modules/basics/complete');
  });
});
