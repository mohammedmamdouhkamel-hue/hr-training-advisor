import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlatformChip from './PlatformChip';

describe('PlatformChip', () => {
  it('renders known platform name', () => {
    render(<PlatformChip platform="coursera" />);
    expect(screen.getByText('Coursera')).toBeInTheDocument();
  });

  it('renders platform icon', () => {
    render(<PlatformChip platform="youtube" />);
    expect(screen.getByText('▶')).toBeInTheDocument();
  });

  it('falls back for unknown platform', () => {
    render(<PlatformChip platform="unknown_platform" />);
    expect(screen.getByText('unknown_platform')).toBeInTheDocument();
  });

  it('renders LinkedIn Learning correctly', () => {
    render(<PlatformChip platform="linkedin" />);
    expect(screen.getByText('LinkedIn Learning')).toBeInTheDocument();
  });

  it('renders all 6 platforms without error', () => {
    const platforms = ['youtube', 'coursera', 'udemy', 'pluralsight', 'aim', 'linkedin'];
    platforms.forEach(p => {
      const { unmount } = render(<PlatformChip platform={p} />);
      unmount();
    });
  });
});
