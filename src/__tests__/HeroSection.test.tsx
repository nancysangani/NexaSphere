import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HeroSection from '../pages/home/HeroSection';

describe('HeroSection Component', () => {
  const mockOnTabChange = vi.fn();
  const mockOnApply = vi.fn();
  const mockOnJoin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders hero section with tagline', () => {
    render(
      <HeroSection onTabChange={mockOnTabChange} onApply={mockOnApply} onJoin={mockOnJoin} />
    );
    expect(screen.getByText(/GL Bajaj's Student-Driven Tech Ecosystem/i)).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(
      <HeroSection onTabChange={mockOnTabChange} onApply={mockOnApply} onJoin={mockOnJoin} />
    );
    expect(screen.getByText(/Join as Member/i)).toBeInTheDocument();
    expect(screen.getByText(/Core Team/i)).toBeInTheDocument();
    expect(screen.getByText(/Apply for Core Team/i)).toBeInTheDocument();
  });

  it('calls onJoin when join button is clicked', async () => {
    render(
      <HeroSection onTabChange={mockOnTabChange} onApply={mockOnApply} onJoin={mockOnJoin} />
    );
    const joinBtn = screen.getByText(/Join as Member/i);
    fireEvent.click(joinBtn);
    expect(mockOnJoin).toHaveBeenCalled();
  });

  it('calls onApply when apply button is clicked', async () => {
    render(
      <HeroSection onTabChange={mockOnTabChange} onApply={mockOnApply} onJoin={mockOnJoin} />
    );
    const applyBtn = screen.getByText(/Apply for Core Team/i);
    fireEvent.click(applyBtn);
    expect(mockOnApply).toHaveBeenCalled();
  });

  it('calls onTabChange when team tab is clicked', async () => {
    render(
      <HeroSection onTabChange={mockOnTabChange} onApply={mockOnApply} onJoin={mockOnJoin} />
    );
    const teamBtn = screen.getByText(/Core Team/i);
    fireEvent.click(teamBtn);
    expect(mockOnTabChange).toHaveBeenCalledWith('Team');
  });

  it('renders stats bar after delay', async () => {
    render(
      <HeroSection onTabChange={mockOnTabChange} onApply={mockOnApply} onJoin={mockOnJoin} />
    );
    vi.runAllTimers();
    expect(screen.getByText(/Members/i)).toBeInTheDocument();
    expect(screen.getByText(/Activities/i)).toBeInTheDocument();
  });

  it('supports light theme prop', () => {
    const { container } = render(
      <HeroSection
        theme="light"
        onTabChange={mockOnTabChange}
        onApply={mockOnApply}
        onJoin={mockOnJoin}
      />
    );
    expect(container.querySelector('.hero-section')).toBeInTheDocument();
  });
});
