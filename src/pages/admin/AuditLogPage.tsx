import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Filter } from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  details?: string;
}

function loadAuditLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem('hra_audit_log');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export default function AuditLogPage() {
  const entries = useMemo(() => loadAuditLog().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), []);
  const [actionFilter, setActionFilter] = useState('');

  const actions = useMemo(() => [...new Set(entries.map(e => e.action))].sort(), [entries]);
  const filtered = actionFilter ? entries.filter(e => e.action === actionFilter) : entries;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 1000 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>Audit Log</h1>
      <p style={{ margin: '0 0 20px', color: '#94A3B8', fontSize: '0.88rem' }}>{entries.length} entries recorded</p>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <Filter size={14} style={{ color: '#64748B' }} />
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{
          padding: '8px 14px', borderRadius: 8, background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(255,255,255,0.08)', color: '#F8FAFC', fontSize: '0.82rem',
          cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>
          <option value="">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
          <ScrollText size={40} style={{ color: 'rgba(99,102,241,0.3)', marginBottom: 12 }} />
          <p>No audit entries found</p>
        </div>
      ) : (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '180px 120px 1fr 1fr', padding: '10px 16px', background: 'rgba(99,102,241,0.08)', fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>Timestamp</span><span>Action</span><span>User</span><span>Details</span>
          </div>
          {/* Rows */}
          {filtered.slice(0, 100).map((entry, i) => (
            <div key={entry.id || i} style={{
              display: 'grid', gridTemplateColumns: '180px 120px 1fr 1fr', padding: '10px 16px',
              background: i % 2 === 0 ? 'rgba(15,23,42,0.5)' : 'rgba(15,23,42,0.3)',
              borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem',
            }}>
              <span style={{ color: '#94A3B8', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                {new Date(entry.timestamp).toLocaleString()}
              </span>
              <span style={{
                color: entry.action.includes('LOGIN') ? '#34D399' : entry.action.includes('LOGOUT') ? '#F87171' : '#818CF8',
                fontWeight: 600, fontSize: '0.72rem',
              }}>
                {entry.action}
              </span>
              <span style={{ color: '#CBD5E1' }}>{entry.userId}</span>
              <span style={{ color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.details || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
