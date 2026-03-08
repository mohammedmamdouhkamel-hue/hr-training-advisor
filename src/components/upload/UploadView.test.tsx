import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadView from './UploadView';

describe('UploadView', () => {
  it('renders heading', () => {
    render(<UploadView onFileSelect={() => {}} onLoadSample={() => {}} error="" />);
    expect(screen.getByText('Performance-Driven Training')).toBeInTheDocument();
  });

  it('renders upload zone', () => {
    render(<UploadView onFileSelect={() => {}} onLoadSample={() => {}} error="" />);
    expect(screen.getByText('Drop your file here')).toBeInTheDocument();
  });

  it('renders file format info', () => {
    render(<UploadView onFileSelect={() => {}} onLoadSample={() => {}} error="" />);
    expect(screen.getByText(/Supports .xlsx, .xls and .csv/)).toBeInTheDocument();
  });

  it('renders sample data button', () => {
    render(<UploadView onFileSelect={() => {}} onLoadSample={() => {}} error="" />);
    expect(screen.getByText('Load sample data')).toBeInTheDocument();
  });

  it('calls onLoadSample when sample button clicked', () => {
    const onLoadSample = vi.fn();
    render(<UploadView onFileSelect={() => {}} onLoadSample={onLoadSample} error="" />);
    fireEvent.click(screen.getByText('Load sample data'));
    expect(onLoadSample).toHaveBeenCalledOnce();
  });

  it('shows error message when error prop is set', () => {
    render(<UploadView onFileSelect={() => {}} onLoadSample={() => {}} error="Invalid file" />);
    expect(screen.getByText(/Invalid file/)).toBeInTheDocument();
  });

  it('does not show error when error is empty', () => {
    render(<UploadView onFileSelect={() => {}} onLoadSample={() => {}} error="" />);
    expect(screen.queryByText('⚠️')).not.toBeInTheDocument();
  });

  it('renders platform chips', () => {
    render(<UploadView onFileSelect={() => {}} onLoadSample={() => {}} error="" />);
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('Coursera')).toBeInTheDocument();
    expect(screen.getByText('Udemy')).toBeInTheDocument();
  });

  it('renders Choose File button', () => {
    render(<UploadView onFileSelect={() => {}} onLoadSample={() => {}} error="" />);
    expect(screen.getByText('Choose File')).toBeInTheDocument();
  });
});
