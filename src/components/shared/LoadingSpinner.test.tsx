import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders the main message', () => {
    render(<LoadingSpinner message="Loading plan..." />);
    expect(screen.getByText('Loading plan...')).toBeInTheDocument();
  });

  it('renders default submessage', () => {
    render(<LoadingSpinner message="Loading..." />);
    expect(screen.getByText('AI is curating courses from 6 platforms')).toBeInTheDocument();
  });

  it('renders custom submessage', () => {
    render(<LoadingSpinner message="Loading..." submessage="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });
});
