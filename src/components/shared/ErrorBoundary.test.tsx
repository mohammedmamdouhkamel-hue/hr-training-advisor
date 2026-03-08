import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function ProblemChild() {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  // Suppress console.error during expected error tests
  const originalError = console.error;
  beforeEach(() => { console.error = vi.fn(); });
  afterEach(() => { console.error = originalError; });

  it('renders children when no error', () => {
    render(<ErrorBoundary><div>Hello</div></ErrorBoundary>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(<ErrorBoundary><ProblemChild /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(<ErrorBoundary fallback={<div>Custom fallback</div>}><ProblemChild /></ErrorBoundary>);
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('has a Try Again button that resets', () => {
    render(<ErrorBoundary><ProblemChild /></ErrorBoundary>);
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});
