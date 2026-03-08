interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>⚠️ Error generating plan</div>
      <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{error}</div>
      {onRetry && (
        <button onClick={onRetry}
          style={{ background: '#BE123C', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          Retry
        </button>
      )}
    </div>
  );
}
