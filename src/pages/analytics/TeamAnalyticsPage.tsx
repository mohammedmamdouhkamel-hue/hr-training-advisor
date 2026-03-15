import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTeamEmployees } from '../../hooks/useTeamEmployees';
import { loadPlans } from '../../services/storage';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';

export default function TeamAnalyticsPage() {
  const { teamEmployees: employees } = useTeamEmployees();
  const plans = useMemo(() => loadPlans() || {}, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 1200 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>Team Analytics</h1>
      <p style={{ margin: '0 0 24px', color: '#94A3B8', fontSize: '0.88rem' }}>Your team&apos;s training performance and skill gaps</p>
      <div style={{ borderRadius: 12, padding: '24px 28px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <AnalyticsDashboard employees={employees} plans={plans} />
      </div>
    </motion.div>
  );
}
