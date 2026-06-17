import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PageError from '../PageError';

describe('PageError Component', () => {
  const defaultTitle = 'Something went wrong';
  const defaultDescription =
    'We encountered an unexpected issue while loading this content. Please try again.';

  it('renders default title and description', () => {
    render(<PageError />);
    expect(screen.getByText(defaultTitle)).toBeInTheDocument();
    expect(screen.getByText(defaultDescription)).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(<PageError title="Custom Error" description="Custom description" />);
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
  });

  it('has role="alert" for accessibility', () => {
    render(<PageError />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders the alert triangle icon', () => {
    render(<PageError />);
    // AlertTriangle from lucide-react renders as an SVG
    const alert = screen.getByRole('alert');
    expect(alert.querySelector('svg')).toBeInTheDocument();
  });

  it('shows Try Again button when onRetry is provided', () => {
    render(<PageError onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows Go Home button when onGoHome is provided', () => {
    render(<PageError onGoHome={() => {}} />);
    expect(screen.getByRole('button', { name: /go to home page/i })).toBeInTheDocument();
  });

  it('does not render action buttons when callbacks are omitted', () => {
    render(<PageError />);
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /go to home/i })).not.toBeInTheDocument();
  });

  it('calls onRetry when Try Again is clicked', () => {
    const onRetry = vi.fn();
    render(<PageError onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onGoHome when Go Home is clicked', () => {
    const onGoHome = vi.fn();
    render(<PageError onGoHome={onGoHome} />);
    fireEvent.click(screen.getByRole('button', { name: /go to home page/i }));
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });

  it('renders as heading with proper level', () => {
    render(<PageError />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(defaultTitle);
  });

  it('renders without error details when error prop is null', () => {
    render(<PageError />);
    expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
  });
});
