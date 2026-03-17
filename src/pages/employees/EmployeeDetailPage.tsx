import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2, AlertCircle, Target } from 'lucide-react';
import { useEmployees } from '../../hooks/useEmployees';
import { useGoals } from '../../hooks/useGoals';
import { useApiKey } from '../../hooks/useApiKey';
import { useTrainingPlans } from '../../hooks/useTrainingPlans';
import { getScoreCategory } from '../../types/employee';
import TrainingPlanView from '../../components/training/TrainingPlanView';
import ApiKeyModal from '../../components/modals/ApiKeyModal';

const CATEGORY_COLORS = { strong: '#34D399', developing: '#FBBF24', needsFocus: '#F87171' };

export default function EmployeeDetailPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { employees } = useEmployees();
  const { apiKey, setApiKey } = useApiKey();
  const { plans, loading, loadingMsg, error, doGenerate, setPlans } = useTrainingPlans(apiKey);
  const { getGoalsForEmployee } = useGoals();
  const [showApiModal, setShowApiModal] = useState(false);

  const employee = useMemo(() => {
    const decoded = decodeURIComponent(name || '');
    return employees.find(e => e.name === decoded);
  }, [employees, name]);

  if (!employee) {
    return (
      <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 40, textAlign: 'center', color: '#94A3B8' }}>
        <AlertCircle size={48} style={{ color: 'rgba(239,68,68,0.4)', marginBottom: 12 }} />
        <h2 style={{ color: '#F8FAFC', margin: '0 0 8px' }}>Employee not found</h2>
        <p>The employee &quot;{decodeURIComponent(name || '')}&quot; was not found in the loaded data.</p>
        <button onClick={() => navigate('/employees')} style={{
          marginTop: 16, padding: '10px 20px', borderRadius: 10,
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none',
          color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>Back to Employees</button>
      </div>
    );
  }

  const category = getScoreCategory(employee.score);
  const color = CATEGORY_COLORS[category];
  const plan = plans[employee.name];
  const competencies = Object.entries(employee.competencies).sort((a, b) => b[1] - a[1]);
  const employeeGoals = getGoalsForEmployee(employee.name);
  const goalWeightTotal = employeeGoals.reduce((s, g) => s + g.weight, 0);
  const isGoalWeightValid = Math.abs(goalWeightTotal - 100) < 0.5;

  const handleGenerate = () => {
    if (!apiKey) {
      setShowApiModal(true);
      return;
    }
    doGenerate(employee);
  };

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    setShowApiModal(false);
    // Will auto-trigger on next click
  };

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 960 }}>
      {showApiModal && <ApiKeyModal onSave={handleApiKeySave} />}

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
          background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer',
          fontSize: '0.85rem', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Employee header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: 16, padding: '28px 32px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
          border: '1px solid rgba(99,102,241,0.2)', marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: 16, flexShrink: 0,
            background: `linear-gradient(135deg, ${color}44, ${color}22)`,
            border: `2px solid ${color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', fontWeight: 800, color,
          }}>
            {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>{employee.name}</h1>
            <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '0.9rem' }}>{employee.role} &middot; {employee.department}</p>
          </div>

          {/* Score */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color, lineHeight: 1 }}>{employee.score}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 4, textTransform: 'uppercase', fontWeight: 600 }}>
              {category === 'needsFocus' ? 'Needs Focus' : category === 'developing' ? 'Developing' : 'Strong'}
            </div>
          </div>
        </div>

        {/* Generate button */}
        {!plan && (
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10,
                background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                border: 'none', color: '#fff', fontSize: '0.9rem', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
              }}
            >
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
              {loading ? loadingMsg || 'Generating...' : 'Generate Training Plan'}
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', fontSize: '0.82rem' }}>
            {error}
          </div>
        )}
      </motion.div>

      {/* Competencies */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{
          borderRadius: 12, padding: '24px 28px', marginBottom: 24,
          background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Competencies
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {competencies.map(([name, score]) => {
            const cat = getScoreCategory(score);
            const barColor = CATEGORY_COLORS[cat];
            return (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.82rem', color: '#CBD5E1', fontWeight: 500 }}>{name}</span>
                  <span style={{ fontSize: '0.82rem', color: barColor, fontWeight: 700 }}>{score}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${score}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${barColor}88, ${barColor})` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Goals */}
      {employeeGoals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{
            borderRadius: 12, padding: '24px 28px', marginBottom: 24,
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Goals ({employeeGoals.length})
            </h2>
            <span style={{
              padding: '3px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600,
              background: isGoalWeightValid ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              color: isGoalWeightValid ? '#34D399' : '#F87171',
              border: `1px solid ${isGoalWeightValid ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
            }}>
              Weight: {goalWeightTotal}% {isGoalWeightValid ? '(Valid)' : '(Invalid)'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {employeeGoals.map(g => {
              const ratingColors: Record<string, string> = { Outstanding: '#34D399', Exceeds: '#6366F1', Meets: '#FBBF24', Below: '#F87171', Unrated: '#64748B' };
              const catColors: Record<string, string> = { 'Personal goals': '#818CF8', 'Department/Service goals': '#8B5CF6' };
              const rc = ratingColors[g.rating] || '#64748B';
              const cc = catColors[g.category] || '#818CF8';
              return (
                <div
                  key={g.id}
                  onClick={() => navigate(`/goals/${g.id}`)}
                  style={{
                    padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.06)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <p style={{ margin: '0 0 6px', fontSize: '0.86rem', color: '#F8FAFC', fontWeight: 600 }}>{g.title}</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: '0.66rem', fontWeight: 600, background: `${cc}1A`, color: cc, border: `1px solid ${cc}33` }}>
                          {g.category === 'Personal goals' ? 'Personal' : 'Dept/Svc'}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: '0.66rem', fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: '#94A3B8' }}>
                          {g.weight}%
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: '0.66rem', fontWeight: 600, background: `${rc}1A`, color: rc, border: `1px solid ${rc}33` }}>
                          {g.rating}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 60 }}>
                      <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>{g.progress}%</p>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2, width: `${g.progress}%`,
                      background: g.progress >= 80 ? 'linear-gradient(90deg, #34D399, #059669)' :
                        g.progress >= 50 ? 'linear-gradient(90deg, #FBBF24, #F59E0B)' :
                          'linear-gradient(90deg, #F87171, #EF4444)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Training Plan */}
      {plan && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{
            borderRadius: 12, padding: '24px 28px',
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Training Plan
          </h2>
          <TrainingPlanView
            plan={plan}
            employee={employee}
            onUpdatePlan={updatedPlan => setPlans(prev => ({ ...prev, [employee.name]: updatedPlan }))}
          />
        </motion.div>
      )}

      {/* Spin animation keyframes */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
