interface LoadingSpinnerProps {
  message: string;
  submessage?: string;
}

export default function LoadingSpinner({ message, submessage = 'AI is curating courses from 6 platforms' }: LoadingSpinnerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', border: '4px solid #E2E8F0', borderTopColor: '#3B82F6', animation: 'spin 0.8s linear infinite', marginBottom: 24 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', marginBottom: 6 }}>{message}</div>
      <div style={{ fontSize: 12, color: '#94A3B8' }}>{submessage}</div>
    </div>
  );
}
