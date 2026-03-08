import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScoreBadge from './ScoreBadge';

describe('ScoreBadge', () => {
  it('renders "Needs Focus" for score < 65', () => {
    render(<ScoreBadge score={50} />);
    expect(screen.getByText('Needs Focus')).toBeInTheDocument();
  });

  it('renders "Developing" for score 65-79', () => {
    render(<ScoreBadge score={72} />);
    expect(screen.getByText('Developing')).toBeInTheDocument();
  });

  it('renders "Strong" for score >= 80', () => {
    render(<ScoreBadge score={85} />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('uses correct color for danger range', () => {
    const { container } = render(<ScoreBadge score={40} />);
    const span = container.firstChild as HTMLElement;
    expect(span.style.color).toBe('rgb(239, 68, 68)');
  });

  it('uses correct color for success range', () => {
    const { container } = render(<ScoreBadge score={90} />);
    const span = container.firstChild as HTMLElement;
    expect(span.style.color).toBe('rgb(16, 185, 129)');
  });
});
