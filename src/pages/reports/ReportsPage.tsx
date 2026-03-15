import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Users, BarChart3 } from 'lucide-react';
import { useEmployees } from '../../hooks/useEmployees';
import { loadPlans } from '../../services/storage';
import { getScoreCategory } from '../../types/employee';

export default function ReportsPage() {
  const { employees } = useEmployees();
  const plans = useMemo(() => loadPlans() || {}, []);

  const stats = useMemo(() => {
    if (!employees.length) return null;
    const departments = [...new Set(employees.map(e => e.department))];
    const avgScore = Math.round(employees.reduce((s, e) => s + e.score, 0) / employees.length);
    const plansCount = Object.keys(plans).length;
    const categories = { strong: 0, developing: 0, needsFocus: 0 };
    employees.forEach(e => { categories[getScoreCategory(e.score)]++; });
    return { departments, avgScore, plansCount, categories };
  }, [employees, plans]);

  const exportCSV = () => {
    if (!employees.length) return;
    const header = 'Name,Role,Department,Score,Category,Has Plan\n';
    const rows = employees.map(e =>
      `"${e.name}","${e.role}","${e.department}",${e.score},${getScoreCategory(e.score)},${plans[e.name] ? 'Yes' : 'No'}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>Reports</h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.88rem' }}>Generate and export training reports</p>
        </div>
        {employees.length > 0 && (
          <button onClick={exportCSV} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none', color: '#fff',
            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}>
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      {!stats ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
          <FileText size={40} style={{ color: 'rgba(99,102,241,0.3)', marginBottom: 12 }} />
          <p>No data to report. Upload employee results first.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            <ReportCard icon={Users} label="Employees" value={String(employees.length)} color="#6366F1" />
            <ReportCard icon={BarChart3} label="Avg Score" value={`${stats.avgScore}%`} color="#059669" />
            <ReportCard icon={FileText} label="Plans Generated" value={`${stats.plansCount}/${employees.length}`} color="#8B5CF6" />
          </div>

          {/* Department breakdown */}
          <div style={{ borderRadius: 12, padding: '24px 28px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Department Breakdown</h2>
            {stats.departments.map(dept => {
              const deptEmps = employees.filter(e => e.department === dept);
              const avg = Math.round(deptEmps.reduce((s, e) => s + e.score, 0) / deptEmps.length);
              return (
                <div key={dept} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: '#CBD5E1', fontSize: '0.88rem' }}>{dept}</span>
                  <span style={{ color: '#94A3B8', fontSize: '0.82rem' }}>{deptEmps.length} employees &middot; Avg: {avg}%</span>
                </div>
              );
            })}
          </div>

          {/* Employee table */}
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 100px', padding: '10px 16px', background: 'rgba(99,102,241,0.08)', fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              <span>Name</span><span>Department</span><span>Score</span><span>Plan</span>
            </div>
            {employees.map((emp, i) => (
              <div key={emp.name} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 100px', padding: '10px 16px', background: i % 2 === 0 ? 'rgba(15,23,42,0.5)' : 'rgba(15,23,42,0.3)', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem' }}>
                <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{emp.name}</span>
                <span style={{ color: '#94A3B8' }}>{emp.department}</span>
                <span style={{ color: '#CBD5E1', fontWeight: 600 }}>{emp.score}%</span>
                <span style={{ color: plans[emp.name] ? '#34D399' : '#64748B' }}>{plans[emp.name] ? 'Ready' : 'Pending'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

function ReportCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; label: string; value: string; color: string }) {
  return (
    <div style={{ borderRadius: 12, padding: '18px 20px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={16} style={{ color }} />
        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F8FAFC' }}>{value}</div>
    </div>
  );
}
