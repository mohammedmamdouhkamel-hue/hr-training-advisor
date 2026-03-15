import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, AlertCircle } from 'lucide-react';
import { useEmployees } from '../../hooks/useEmployees';
import { loadPlans } from '../../services/storage';
import TrainingPlanView from '../../components/training/TrainingPlanView';

export default function MyPlanPage() {
  const { employees } = useEmployees();
  const plans = useMemo(() => loadPlans() || {}, []);

  // For demo: show first employee's plan (or prompt to generate)
  const employee = employees[0] || null;
  const plan = employee ? plans[employee.name] : null;

  if (!employee) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, color: '#94A3B8', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <BookOpen size={48} style={{ color: 'rgba(99,102,241,0.3)' }} />
        <p style={{ fontSize: '1rem', fontWeight: 600 }}>No employee data loaded</p>
        <p style={{ fontSize: '0.82rem' }}>Ask your administrator to upload results first.</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, color: '#94A3B8', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <AlertCircle size={48} style={{ color: 'rgba(245,158,11,0.4)' }} />
        <p style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC' }}>No training plan generated yet</p>
        <p style={{ fontSize: '0.82rem', maxWidth: 400, textAlign: 'center' }}>
          Your administrator or HR coordinator needs to generate a training plan for you.
          Once generated, it will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 960 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>My Training Plan</h1>
      <p style={{ margin: '0 0 24px', color: '#94A3B8', fontSize: '0.88rem' }}>Personalized development roadmap for {employee.name}</p>
      <div style={{ borderRadius: 12, padding: '24px 28px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <TrainingPlanView plan={plan} employee={employee} />
      </div>
    </motion.div>
  );
}
