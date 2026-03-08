import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';

describe('Header', () => {
  it('renders app title', () => {
    render(<Header view="upload" loading={false} onUploadNew={() => {}} onGenerateAll={() => {}} onChangeKey={() => {}} />);
    expect(screen.getByText('HR Training Advisor')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<Header view="upload" loading={false} onUploadNew={() => {}} onGenerateAll={() => {}} onChangeKey={() => {}} />);
    expect(screen.getByText('Powered by AI · SuccessFactors Integration')).toBeInTheDocument();
  });

  it('shows dashboard buttons when view is dashboard', () => {
    render(<Header view="dashboard" loading={false} onUploadNew={() => {}} onGenerateAll={() => {}} onChangeKey={() => {}} />);
    expect(screen.getByRole('button', { name: /upload new file/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate all training plans/i })).toBeInTheDocument();
  });

  it('hides dashboard buttons when view is upload', () => {
    render(<Header view="upload" loading={false} onUploadNew={() => {}} onGenerateAll={() => {}} onChangeKey={() => {}} />);
    expect(screen.queryByRole('button', { name: /upload new file/i })).not.toBeInTheDocument();
  });

  it('shows loading state on generate button', () => {
    render(<Header view="dashboard" loading={true} onUploadNew={() => {}} onGenerateAll={() => {}} onChangeKey={() => {}} />);
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  it('calls onUploadNew when Upload New clicked', () => {
    const onUploadNew = vi.fn();
    render(<Header view="dashboard" loading={false} onUploadNew={onUploadNew} onGenerateAll={() => {}} onChangeKey={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /upload new file/i }));
    expect(onUploadNew).toHaveBeenCalledOnce();
  });

  it('calls onGenerateAll when Generate All clicked', () => {
    const onGenerateAll = vi.fn();
    render(<Header view="dashboard" loading={false} onUploadNew={() => {}} onGenerateAll={onGenerateAll} onChangeKey={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /generate all training plans/i }));
    expect(onGenerateAll).toHaveBeenCalledOnce();
  });

  it('calls onChangeKey when key button clicked', () => {
    const onChangeKey = vi.fn();
    render(<Header view="upload" loading={false} onUploadNew={() => {}} onGenerateAll={() => {}} onChangeKey={onChangeKey} />);
    fireEvent.click(screen.getByRole('button', { name: /change api key/i }));
    expect(onChangeKey).toHaveBeenCalledOnce();
  });
});
