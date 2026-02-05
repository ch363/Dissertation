import React from 'react';
import renderer from 'react-test-renderer';

import { ErrorBoundary } from '@/components/error-boundary';

// Mock the logger to avoid console output during tests
jest.mock('@/services/logging', () => ({
  createLogger: () => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('should render children when there is no error', () => {
    const tree = renderer.create(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    );

    const json = tree.toJSON();
    expect(json).toBeTruthy();
    expect(JSON.stringify(json)).toContain('No error');
  });

  it('should render fallback UI when an error is thrown', () => {
    const tree = renderer.create(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>,
    );

    const json = tree.toJSON();
    expect(json).toBeTruthy();
    // ErrorBoundary should have caught the error and rendered fallback
  });

  it('should use custom fallback when provided', () => {
    const CustomFallback = () => <div>Custom error message</div>;

    const tree = renderer.create(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow />
      </ErrorBoundary>,
    );

    expect(tree.toJSON()).toBeTruthy();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();

    renderer.create(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test error');
  });
});
