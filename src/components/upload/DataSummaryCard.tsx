import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Building2, TrendingUp, AlertTriangle,
  CheckCircle2, FileSpreadsheet, Clock, Trash2, UploadCloud,
} from 'lucide-react';
import type { Employee, UploadMeta } from '../../types/employee';
import { getScoreCategory } from '../../types/employee';

interface DataSummaryCardProps {
  employees: Employee[];
  uploadMeta: UploadMeta;
  onReUpload: () => void;
  onReset: () => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function DataSummaryCard({ employees, uploadMeta, onReUpload, onReset }: DataSummaryCardProps) {
  const stats = useMemo(() => {
    const departments = new Set(employees.map(e => e.department)).size;
    const avgScore = employees.length
      ? Math.round(employees.reduce((s, e) => s + e.score, 0) / employees.length)
      : 0;
    const categories = { strong: 0, developing: 0, needsFocus: 0 };
    employees.forEach(e => { categories[getScoreCategory(e.score)]++; });
    return { departments, avgScore, categories };
  }, [employees]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        maxWidth: 720,
        margin: '40px auto',
        padding: '0 24px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      {/* Header banner */}
      <div style={{
        borderRadius: 16,
        padding: '28px 32px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(99,102,241,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <FileSpreadsheet size={24} style={{ color: '#818CF8' }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#F8FAFC' }}>
              Results Database
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, color: '#94A3B8', fontSize: '0.82rem' }}>
              <Clock size={13} />
              <span>Uploaded {relativeTime(uploadMeta.uploadedAt)} from <strong style={{ color: '#C7D2FE' }}>{uploadMeta.filename}</strong></span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
        }}>
          <StatMini icon={Users} label="Employees" value={String(employees.length)} color="#6366F1" />
          <StatMini icon={Building2} label="Departments" value={String(stats.departments)} color="#8B5CF6" />
          <StatMini icon={TrendingUp} label="Avg Score" value={`${stats.avgScore}%`} color="#059669" />
          <StatMini icon={CheckCircle2} label="Strong" value={String(stats.categories.strong)} color="#34D399" />
          <StatMini icon={AlertTriangle} label="Needs Focus" value={String(stats.categories.needsFocus)} color="#F87171" />
        </div>
      </div>

      {/* Score distribution bar */}
      <div style={{
        borderRadius: 12,
        padding: '20px 24px',
        background: 'rgba(15,23,42,0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 24,
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Score Distribution
        </div>
        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 28, background: 'rgba(255,255,255,0.05)' }}>
          {employees.length > 0 && (
            <>
              {stats.categories.strong > 0 && (
                <div
                  title={`Strong: ${stats.categories.strong}`}
                  style={{
                    width: `${(stats.categories.strong / employees.length) * 100}%`,
                    background: 'linear-gradient(135deg, #059669, #34D399)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                    minWidth: stats.categories.strong > 0 ? 30 : 0,
                  }}
                >
                  {stats.categories.strong}
                </div>
              )}
              {stats.categories.developing > 0 && (
                <div
                  title={`Developing: ${stats.categories.developing}`}
                  style={{
                    width: `${(stats.categories.developing / employees.length) * 100}%`,
                    background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                    minWidth: stats.categories.developing > 0 ? 30 : 0,
                  }}
                >
                  {stats.categories.developing}
                </div>
              )}
              {stats.categories.needsFocus > 0 && (
                <div
                  title={`Needs Focus: ${stats.categories.needsFocus}`}
                  style={{
                    width: `${(stats.categories.needsFocus / employees.length) * 100}%`,
                    background: 'linear-gradient(135deg, #EF4444, #F87171)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                    minWidth: stats.categories.needsFocus > 0 ? 30 : 0,
                  }}
                >
                  {stats.categories.needsFocus}
                </div>
              )}
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '0.72rem', color: '#94A3B8' }}>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#34D399', marginRight: 4 }} />Strong (80+)</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#FBBF24', marginRight: 4 }} />Developing (65-79)</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#F87171', marginRight: 4 }} />Needs Focus (&lt;65)</span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={onReUpload}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 10,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            border: 'none', color: '#fff', fontSize: '0.88rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          }}
        >
          <UploadCloud size={16} />
          Re-upload Results
        </button>
        <button
          onClick={() => {
            if (window.confirm('This will permanently delete all uploaded employee data and training plans. Continue?')) {
              onReset();
            }
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 10,
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#F87171', fontSize: '0.88rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          <Trash2 size={16} />
          Reset Results Database
        </button>
      </div>
    </motion.div>
  );
}

// Small stat cell
function StatMini({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string; value: string; color: string;
}) {
  return (
    <div style={{
      borderRadius: 10, padding: '14px 16px',
      background: 'rgba(15,23,42,0.6)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={14} style={{ color }} />
        <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC' }}>{value}</div>
    </div>
  );
}
