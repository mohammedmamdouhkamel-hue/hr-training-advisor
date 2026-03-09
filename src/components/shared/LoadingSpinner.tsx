interface LoadingSpinnerProps {
  message: string;
  submessage?: string;
}

export default function LoadingSpinner({ message, submessage = 'AI is curating courses from 6 platforms' }: LoadingSpinnerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', border: '4px solid var(--surface-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite', marginBottom: 24 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{message}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{submessage}</div>
    </div>
  );
}
