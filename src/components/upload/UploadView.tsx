import { useRef } from 'react';
import { UploadCloud, AlertTriangle, FileSpreadsheet, Sparkles, Brain, Target, BookOpenCheck } from 'lucide-react';
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
    <div className="upload-container" style={{ maxWidth: 680, margin: '60px auto', padding: '0 24px' }}>
      {/* Hero section with background image */}
      <div style={{
        position: 'relative', borderRadius: 20, overflow: 'hidden',
        marginBottom: 40, padding: '48px 32px',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.88), rgba(79, 70, 229, 0.82))',
      }}>
        <img
          src={`${import.meta.env.BASE_URL}images/hero-training.jpg`}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0, opacity: 0.3, mixBlendMode: 'luminosity',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            borderRadius: 9999, padding: '6px 16px', marginBottom: 20,
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <Sparkles size={14} color="#fff" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>AI-Powered Training Plans</span>
          </div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{t('upload.heading')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'var(--text-lg)', margin: 0, lineHeight: 1.6, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>{t('upload.description')}</p>
        </div>
        {/* Unsplash attribution */}
        <div style={{ position: 'absolute', bottom: 8, right: 12, zIndex: 1, fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
          Photo by Unsplash
        </div>
      </div>

      {/* Animated gradient border upload zone */}
      <div
        className="upload-zone-animated"
        role="button"
        tabIndex={0}
        aria-label="Upload file. Drag and drop or click to select"
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) onFileSelect(file); }}
        onDragOver={e => e.preventDefault()}
      >
        <div className="upload-zone-inner">
          <div className="upload-icon-float" style={{
            width: 72, height: 72, borderRadius: 18,
            background: 'linear-gradient(135deg, var(--color-primary), #7C3AED)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20, boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)',
          }}>
            <UploadCloud size={32} color="#fff" strokeWidth={1.5} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text-primary)', marginBottom: 8 }}>{t('upload.dropzone')}</div>
          <div style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-base)', marginBottom: 24 }}>{t('upload.supportedFormats')}</div>
          <div style={{
            background: 'var(--gradient-brand)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 32px', borderRadius: 10, fontSize: 'var(--text-base)', fontWeight: 600,
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)', transition: 'transform 0.15s, box-shadow 0.15s',
          }}>
            <FileSpreadsheet size={16} />
            {t('upload.chooseFile')}
          </div>
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => { const file = e.target.files?.[0]; if (file) onFileSelect(file); }} aria-hidden="true" />
        </div>
      </div>

      {error && (
        <div role="alert" style={{ background: 'var(--color-danger-light)', border: '1px solid #FECDD3', color: '#991B1B', borderRadius: 10, padding: '12px 16px', marginTop: 16, fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <span style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-base)' }}>{t('upload.noFileYet')} </span>
        <button onClick={onLoadSample} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 'var(--text-base)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>{t('upload.loadSample')}</button>
      </div>

      {/* Feature cards — icons validated via Iconify (lucide:brain, lucide:target, lucide:book-open-check, lucide:bar-chart, lucide:users) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 40 }}>
        {[
          { icon: Brain, title: 'AI Analysis', desc: 'Intelligent competency gap detection powered by Claude' },
          { icon: Target, title: 'Targeted Plans', desc: '90-day personalized training roadmaps per employee' },
          { icon: BookOpenCheck, title: 'Course Matching', desc: 'Auto-matched courses from top platforms' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} style={{
            background: 'var(--surface-card)', border: '1px solid var(--surface-border)',
            borderRadius: 12, padding: '20px 16px', textAlign: 'center',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--color-primary-bg)', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              <Icon size={20} color="var(--color-primary)" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Supported platforms */}
      <div style={{ marginTop: 32, background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>{t('upload.supportedPlatforms')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.keys(PLATFORMS).map(k => <PlatformChip key={k} platform={k} />)}
        </div>
      </div>
    </div>
  );
}
