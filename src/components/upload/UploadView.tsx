import { useRef } from 'react';
import { UploadCloud, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PLATFORMS } from '../../constants/platforms';
import PlatformChip from '../shared/PlatformChip';

interface UploadViewProps {
  onFileSelect: (file: File) => void;
  onLoadSample: () => void;
  error: string;
}

export default function UploadView({ onFileSelect, onLoadSample, error }: UploadViewProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="upload-container" style={{ maxWidth: 620, margin: '80px auto', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px', letterSpacing: -1 }}>{t('upload.heading')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16, margin: 0, lineHeight: 1.6 }}>{t('upload.description')}</p>
      </div>

      <div className="upload-zone"
        role="button"
        tabIndex={0}
        aria-label="Upload file. Drag and drop or click to select"
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) onFileSelect(file); }}
        onDragOver={e => e.preventDefault()}
        style={{ border: '2px dashed var(--surface-border)', borderRadius: 16, padding: '48px 32px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: 'var(--surface-card)' }}>
        <UploadCloud size={48} color="var(--color-blue-500)" strokeWidth={1.5} style={{ marginBottom: 16 }} />
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 8 }}>{t('upload.dropzone')}</div>
        <div style={{ color: 'var(--text-subtle)', fontSize: 13, marginBottom: 20 }}>{t('upload.supportedFormats')}</div>
        <div style={{ background: '#0F172A', color: '#fff', display: 'inline-block', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{t('upload.chooseFile')}</div>
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => { const file = e.target.files?.[0]; if (file) onFileSelect(file); }} aria-hidden="true" />
      </div>

      {error && (
        <div role="alert" style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', borderRadius: 10, padding: '12px 16px', marginTop: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <span style={{ color: 'var(--text-subtle)', fontSize: 13 }}>{t('upload.noFileYet')} </span>
        <button onClick={onLoadSample} style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>{t('upload.loadSample')}</button>
      </div>

      <div style={{ marginTop: 40, background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>{t('upload.supportedPlatforms')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.keys(PLATFORMS).map(k => <PlatformChip key={k} platform={k} />)}
        </div>
      </div>
    </div>
  );
}
