import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeamPage from '../pages/team/TeamPage';
import { teamMembers } from '../data/teamData';

describe('TeamPage Component', () => {
  const mockOnBack = vi.fn();
  const mockOnApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders team page with title', () => {
    render(<TeamPage onBack={mockOnBack} onApply={mockOnApply} />);
    expect(screen.getAllByText(/Core Team/i).length).toBeGreaterThan(0);
  });

  it('displays leadership section', () => {
    render(<TeamPage onBack={mockOnBack} onApply={mockOnApply} />);
    expect(screen.getByText(/Leadership/i)).toBeInTheDocument();
  });

  it('displays core members section', () => {
    render(<TeamPage onBack={mockOnBack} onApply={mockOnApply} />);
    expect(screen.getByText(/Core Members/i)).toBeInTheDocument();
  });

  it('renders apply card with call to action', () => {
    render(<TeamPage onBack={mockOnBack} onApply={mockOnApply} />);
    expect(screen.getByText(/Want to Join NexaSphere/i)).toBeInTheDocument();
    expect(screen.getByText(/Apply Here/i)).toBeInTheDocument();
  });

  it('renders back button', () => {
    render(<TeamPage onBack={mockOnBack} onApply={mockOnApply} />);
    const backBtn = screen.getByText(/← Back/);
    expect(backBtn).toBeInTheDocument();
  });

  it('displays at least one team member card', () => {
    render(<TeamPage onBack={mockOnBack} onApply={mockOnApply} />);
    const orgMembers = teamMembers.filter(
      m => m.role === 'Organiser' || m.role === 'Co-organiser'
    );
    if (orgMembers.length > 0) {
      expect(screen.getByText(orgMembers[0].name)).toBeInTheDocument();
    }
  });

  it('renders call to action title', () => {
    render(<TeamPage onBack={mockOnBack} onApply={mockOnApply} />);
    expect(screen.getByText(/Want to Join NexaSphere/i)).toBeInTheDocument();
  });
});
