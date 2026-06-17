/**
 * ErrorBoundary — Reusable React error boundary.
 *
 * Catches JavaScript errors in its child component tree, logs them to Sentry,
 * and displays a fallback UI instead of unmounting the entire app.
 *
 * Props:
 *   fallback  - Custom fallback element/component (receives { error, resetError })
 *   onError   - Optional callback invoked with (error, errorInfo)
 *   children  - Component tree to guard
 *
 * Usage:
 *   <ErrorBoundary>
 *     <MyComponent />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary fallback={<CustomFallback />}>
 *     <LazyRoute />
 *   </ErrorBoundary>
 */

import React from 'react';
import * as Sentry from '@sentry/react';
import { captureHandledException } from '../utils/errorTracking';
import PageError from './PageError';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to Sentry
    captureHandledException(error, `React ErrorBoundary: ${errorInfo.componentStack}`);

    // Dev console log
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }

    // Call optional onError prop
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const { fallback } = this.props;

      // If a custom fallback is provided, render it
      if (fallback) {
        if (React.isValidElement(fallback)) {
          return fallback;
        }
        // If fallback is a component function, call it with error context
        if (typeof fallback === 'function') {
          return fallback({ error, resetError: this.resetError });
        }
      }

      // Default fallback: PageError with retry + go-home
      return (
        <PageError
          error={error}
          title="Something went wrong"
          description="We encountered an unexpected issue while loading this content. Please try again."
          onRetry={this.resetError}
          onGoHome={() => {
            window.location.href = '/';
          }}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
