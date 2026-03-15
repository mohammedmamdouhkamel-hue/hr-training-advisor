import { motion } from 'framer-motion';
import { FileText, CheckCircle2, BookOpen, Target, Users } from 'lucide-react';

const POLICIES = [
  {
    title: 'Mandatory Onboarding Training',
    description: 'All new employees must complete onboarding training within the first 30 days. Covers company values, security basics, and role-specific orientation.',
    roles: ['All Roles'],
    icon: Users,
    color: '#6366F1',
  },
  {
    title: 'Annual Competency Review',
    description: 'Every employee undergoes annual competency assessment. Scores below 65% trigger mandatory development plans within 90 days.',
    roles: ['All Roles'],
    icon: Target,
    color: '#8B5CF6',
  },
  {
    title: 'Leadership Development Track',
    description: 'Employees scoring 80+ in leadership competencies are eligible for the advanced leadership program. Managers must complete this within their first year.',
    roles: ['Manager'],
    icon: BookOpen,
    color: '#059669',
  },
  {
    title: 'Technical Certification Requirements',
    description: 'Technology department employees must maintain at least one active certification relevant to their role. Renewal tracking is automated.',
    roles: ['Technology'],
    icon: CheckCircle2,
    color: '#0EA5E9',
  },
  {
    title: 'Continuous Learning Hours',
    description: 'All employees are expected to dedicate a minimum of 40 hours per year to professional development activities.',
    roles: ['All Roles'],
    icon: FileText,
    color: '#F59E0B',
  },
];

export default function TrainingPoliciesPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: 800 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>Training Policies</h1>
      <p style={{ margin: '0 0 24px', color: '#94A3B8', fontSize: '0.88rem' }}>Organization training requirements and frameworks</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {POLICIES.map(policy => (
          <div key={policy.title} style={{
            borderRadius: 12, padding: '20px 24px',
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: `${policy.color}1A`, border: `1px solid ${policy.color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <policy.icon size={18} style={{ color: policy.color }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>{policy.title}</h3>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {policy.roles.map(r => (
                    <span key={r} style={{
                      padding: '1px 8px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 600,
                      color: '#818CF8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                    }}>{r}</span>
                  ))}
                </div>
              </div>
            </div>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.5 }}>{policy.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
