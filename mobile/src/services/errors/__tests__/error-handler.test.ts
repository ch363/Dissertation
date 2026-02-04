import {
  AppError,
  ErrorType,
  classifyError,
  getUserFriendlyMessage,
  executeSafely,
} from '../error-handler';

describe('Error Handler', () => {
  describe('AppError', () => {
    it('should create error with type', () => {
      const error = new AppError('Test error', ErrorType.NETWORK);
      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.message).toBe('Test error');
    });

    it('should support user message', () => {
      const error = new AppError(
        'Internal error',
        ErrorType.SERVER,
        500,
        'Something went wrong',
      );
      expect(error.userMessage).toBe('Something went wrong');
    });
  });

  describe('classifyError', () => {
    it('should classify network errors', () => {
      const error = new Error('Network request failed');
      expect(classifyError(error)).toBe(ErrorType.NETWORK);
    });

    it('should classify auth errors', () => {
      const error = new Error('Unauthorized access');
      expect(classifyError(error)).toBe(ErrorType.AUTH);
    });

    it('should classify not found errors', () => {
      const error = new Error('Resource not found');
      expect(classifyError(error)).toBe(ErrorType.NOT_FOUND);
    });

    it('should classify validation errors', () => {
      const error = new Error('Invalid input');
      expect(classifyError(error)).toBe(ErrorType.VALIDATION);
    });

    it('should default to unknown', () => {
      const error = new Error('Some random error');
      expect(classifyError(error)).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user message for AppError', () => {
      const error = new AppError('Internal', ErrorType.NETWORK, 500, 'Check your connection');
      expect(getUserFriendlyMessage(error)).toBe('Check your connection');
    });

    it('should return appropriate message for network errors', () => {
      const error = new Error('fetch failed');
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('internet');
    });

    it('should return appropriate message for auth errors', () => {
      const error = new Error('Unauthorized');
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('sign in');
    });

    it('should return generic message for unknown errors', () => {
      const error = new Error('Something weird');
      const message = getUserFriendlyMessage(error);
      expect(message).toContain('went wrong');
    });
  });

  describe('executeSafely', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should return result on success', async () => {
      const operation = async () => 'success';
      const result = await executeSafely(operation, 'test', 'fallback');
      expect(result).toBe('success');
    });

    it('should return fallback on error', async () => {
      const operation = async () => {
        throw new Error('Test error');
      };
      const result = await executeSafely(operation, 'test', 'fallback');
      expect(result).toBe('fallback');
    });

    it('should return undefined if no fallback provided', async () => {
      const operation = async () => {
        throw new Error('Test error');
      };
      const result = await executeSafely(operation, 'test');
      expect(result).toBeUndefined();
    });
  });
});
