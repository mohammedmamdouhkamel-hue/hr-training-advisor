import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Loader2, CheckCircle2, Upload, Download } from 'lucide-react';
import { useEmployees } from '../../hooks/useEmployees';
import { useApiKey } from '../../hooks/useApiKey';
import { useTrainingPlans } from '../../hooks/useTrainingPlans';
import ApiKeyModal from '../../components/modals/ApiKeyModal';

export default function BulkOperationsPage() {
  const { employees } = useEmployees();
  const { apiKey, setApiKey } = useApiKey();
  const { plans, loading, loadingMsg, error, generateAll } = useTrainingPlans(apiKey);
  const [showApiModal, setShowApiModal] = useState(false);

  const plansCount = Object.keys(plans).length;
  const pendingCount = employees.filter(e => !plans[e.name]).length;

  const handleBulkGenerate = () => {
    if (!apiKey) {
      setShowApiModal(true);
      return;
    }
    generateAll(employees, () => {});
  };

  const exportAllCSV = () => {
    if (!employees.length) return;
    const header = 'Name,Role,Department,Score,Has Plan\n';
    const rows = employees.map(e =>
      `"${e.name}","${e.role}","${e.department}",${e.score},${plans[e.name] ? 'Yes' : 'No'}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 800 }}>
      {showApiModal && <ApiKeyModal onSave={key => { setApiKey(key); setShowApiModal(false); }} />}

      <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>Bulk Operations</h1>
      <p style={{ margin: '0 0 24px', color: '#94A3B8', fontSize: '0.88rem' }}>Mass operations across all employees</p>

      {employees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
          <Upload size={40} style={{ color: 'rgba(99,102,241,0.3)', marginBottom: 12 }} />
          <p>Upload employee data first to use bulk operations.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <StatusCard label="Total Employees" value={String(employees.length)} color="#6366F1" />
            <StatusCard label="Plans Generated" value={String(plansCount)} color="#34D399" />
            <StatusCard label="Pending" value={String(pendingCount)} color={pendingCount > 0 ? '#F87171' : '#34D399'} />
          </div>

          {/* Bulk Generate */}
          <div style={{ borderRadius: 12, padding: '24px 28px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>Bulk Generate Training Plans</h2>
            <p style={{ margin: '0 0 16px', color: '#94A3B8', fontSize: '0.85rem' }}>
              Generate AI-powered training plans for all {pendingCount} employees without a plan.
              Requires an Anthropic API key.
            </p>
            <button
              onClick={handleBulkGenerate}
              disabled={loading || pendingCount === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10,
                background: loading || pendingCount === 0 ? 'rgba(99,102,241,0.2)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                border: 'none', color: '#fff', fontSize: '0.88rem', fontWeight: 600,
                cursor: loading || pendingCount === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : pendingCount === 0 ? <CheckCircle2 size={16} /> : <Zap size={16} />}
              {loading ? loadingMsg || 'Generating...' : pendingCount === 0 ? 'All Plans Generated' : `Generate ${pendingCount} Plans`}
            </button>
            {error && <p style={{ marginTop: 8, color: '#F87171', fontSize: '0.82rem' }}>{error}</p>}
          </div>

          {/* Export */}
          <div style={{ borderRadius: 12, padding: '24px 28px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>Export Data</h2>
            <p style={{ margin: '0 0 16px', color: '#94A3B8', fontSize: '0.85rem' }}>Download employee data and plan status as CSV.</p>
            <button onClick={exportAllCSV} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              color: '#818CF8', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}

function StatusCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ borderRadius: 10, padding: '14px 16px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
