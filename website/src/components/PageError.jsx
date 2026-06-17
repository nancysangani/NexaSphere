import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * PageError — Styled error fallback component.
 * Designed for use inside ErrorBoundary or as a standalone error display.
 *
 * @param {object}   props
 * @param {string}   props.title       - Headline error message
 * @param {string}   props.description - Explanatory body text
 * @param {Error}    props.error       - Error object (shown in dev only)
 * @param {function} props.onRetry     - Retry callback
 * @param {function} props.onGoHome    - Navigate-home callback
 */
export default function PageError({
  title = 'Something went wrong',
  description = 'We encountered an unexpected issue while loading this content. Please try again.',
  error = null,
  onRetry,
  onGoHome,
}) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '60px 24px',
        minHeight: '400px',
      }}
    >
      {/* Icon */}
      <div style={{ color: 'var(--c1, #CC1111)', marginBottom: '20px' }}>
        <AlertTriangle size={48} strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h2
        style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: '1.4rem',
          fontWeight: 700,
          color: 'var(--t1)',
          marginBottom: '12px',
        }}
      >
        {title}
      </h2>

      {/* Description */}
      <p
        style={{
          color: 'var(--t2)',
          fontSize: '0.95rem',
          maxWidth: '440px',
          lineHeight: 1.7,
          marginBottom: '24px',
        }}
      >
        {description}
      </p>

      {/* Error details — dev only */}
      {error && import.meta.env.DEV && (
        <details
          style={{
            whiteSpace: 'pre-wrap',
            background: 'var(--bdr)',
            padding: '12px 16px',
            borderRadius: '8px',
            maxWidth: '520px',
            marginBottom: '24px',
            fontSize: '0.82rem',
            fontFamily: 'monospace',
            color: '#ff5555',
            textAlign: 'left',
            border: '1px solid rgba(255,68,68,0.15)',
            width: '100%',
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: '8px',
              color: 'var(--t1)',
            }}
          >
            Error Details
          </summary>
          {error.toString()}
          <br />
          {error.stack}
        </details>
      )}

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {onRetry && (
          <button
            className="btn btn-primary"
            onClick={onRetry}
            aria-label="Retry loading this content"
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={16} /> Try Again
          </button>
        )}
        {onGoHome && (
          <button
            onClick={onGoHome}
            aria-label="Go to home page"
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem',
              background: 'var(--bdr)',
              color: 'var(--t1)',
              border: '1px solid var(--bdr)',
              borderRadius: '8px',
            }}
          >
            <Home size={16} /> Go Home
          </button>
        )}
      </div>
    </div>
  );
}
