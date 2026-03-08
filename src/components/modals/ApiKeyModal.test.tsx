import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApiKeyModal from './ApiKeyModal';

describe('ApiKeyModal', () => {
  it('renders the modal title', () => {
    render(<ApiKeyModal onSave={() => {}} />);
    expect(screen.getByText('Enter your Anthropic API Key')).toBeInTheDocument();
  });

  it('renders the input placeholder', () => {
    render(<ApiKeyModal onSave={() => {}} />);
    expect(screen.getByPlaceholderText('sk-ant-api03-...')).toBeInTheDocument();
  });

  it('disables button when key does not start with sk-', () => {
    render(<ApiKeyModal onSave={() => {}} />);
    const button = screen.getByText('Start Session →');
    expect(button).toBeDisabled();
  });

  it('enables button when key starts with sk-', async () => {
    const user = userEvent.setup();
    render(<ApiKeyModal onSave={() => {}} />);
    const input = screen.getByPlaceholderText('sk-ant-api03-...');
    await user.type(input, 'sk-ant-test-key');
    const button = screen.getByText('Start Session →');
    expect(button).not.toBeDisabled();
  });

  it('calls onSave with the key when button clicked', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<ApiKeyModal onSave={onSave} />);
    const input = screen.getByPlaceholderText('sk-ant-api03-...');
    await user.type(input, 'sk-ant-test-key');
    fireEvent.click(screen.getByText('Start Session →'));
    expect(onSave).toHaveBeenCalledWith('sk-ant-test-key');
  });

  it('calls onSave on Enter key press', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<ApiKeyModal onSave={onSave} />);
    const input = screen.getByPlaceholderText('sk-ant-api03-...');
    await user.type(input, 'sk-ant-test-key{Enter}');
    expect(onSave).toHaveBeenCalledWith('sk-ant-test-key');
  });

  it('does not call onSave on Enter if key is invalid', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<ApiKeyModal onSave={onSave} />);
    const input = screen.getByPlaceholderText('sk-ant-api03-...');
    await user.type(input, 'invalid-key{Enter}');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<ApiKeyModal onSave={() => {}} />);
    const input = screen.getByPlaceholderText('sk-ant-api03-...') as HTMLInputElement;
    expect(input.type).toBe('password');

    const toggleBtn = screen.getByRole('button', { name: /show api key/i });
    await user.click(toggleBtn);
    expect(input.type).toBe('text');
  });

  it('links to console.anthropic.com', () => {
    render(<ApiKeyModal onSave={() => {}} />);
    const link = screen.getByText('console.anthropic.com');
    expect(link).toHaveAttribute('href', 'https://console.anthropic.com');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
