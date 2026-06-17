import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import ErrorBoundary from '../ErrorBoundary';

// Mock Sentry and errorTracking before importing ErrorBoundary
vi.mock('@sentry/react', () => ({
  default: {},
  captureException: vi.fn(),
}));

vi.mock('../../utils/errorTracking', () => ({
  captureHandledException: vi.fn(),
}));

// Spy on console.error to suppress expected error logging
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
});

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { DEV: false } } });

function SafeComponent() {
  return <div data-testid="safe">Safe content</div>;
}

function BuggyComponent({ message = 'Test error' }) {
  throw new Error(message);
}

describe('ErrorBoundary (website)', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('safe')).toHaveTextContent('Safe content');
  });

  it('renders default fallback (PageError) when a child throws', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(
        'We encountered an unexpected issue while loading this content. Please try again.'
      )
    ).toBeInTheDocument();
  });

  it('renders custom fallback element when provided', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error UI</div>}>
        <BuggyComponent />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('custom-fallback')).toHaveTextContent('Custom Error UI');
  });

  it('renders fallback function with error and resetError', () => {
    const fallbackFn = vi.fn(({ error, resetError }) => (
      <div data-testid="fn-fallback">
        <span>Error: {error.message}</span>
        <button onClick={resetError}>Retry</button>
      </div>
    ));
    render(
      <ErrorBoundary fallback={fallbackFn}>
        <BuggyComponent />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('fn-fallback')).toBeInTheDocument();
    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    expect(fallbackFn).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        resetError: expect.any(Function),
      })
    );
  });

  it('calls onError prop when a child throws', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <BuggyComponent />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
  });

  it('resets error state when Try Again is clicked and re-catches on re-throw', async () => {
    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );
    // Error fallback is shown
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click Try Again to reset — ErrorBoundary clears state, re-attempts
    // to render children (BuggyComponent throws again), and re-catches.
    // The fallback should remain visible and interactive.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    });

    // After reset + re-catch, fallback should still be shown
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('has role="alert" in the default fallback', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders PageError with Try Again and Go Home buttons in default fallback', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
  });
});
