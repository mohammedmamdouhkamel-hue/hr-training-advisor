import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CompetencyBar from './CompetencyBar';

describe('CompetencyBar', () => {
  it('renders competency name', () => {
    render(<CompetencyBar name="Leadership" score={75} />);
    expect(screen.getByText('Leadership')).toBeInTheDocument();
  });

  it('renders score value', () => {
    render(<CompetencyBar name="Leadership" score={75} />);
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('sets bar width to score percentage', () => {
    const { container } = render(<CompetencyBar name="Test" score={60} />);
    const bars = container.querySelectorAll('div');
    const progressBar = Array.from(bars).find(el => el.style.width === '60%');
    expect(progressBar).toBeTruthy();
  });

  it('uses red color for low scores', () => {
    render(<CompetencyBar name="Test" score={40} />);
    const scoreEl = screen.getByText('40');
    expect(scoreEl.style.color).toBe('rgb(239, 68, 68)');
  });

  it('uses green color for high scores', () => {
    render(<CompetencyBar name="Test" score={85} />);
    const scoreEl = screen.getByText('85');
    expect(scoreEl.style.color).toBe('rgb(16, 185, 129)');
  });
});
